const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const os = require('os');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

// Helper to get local IP address for QR code generation
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    if (iface) {
      for (let i = 0; i < iface.length; i++) {
        const alias = iface[i];
        if (alias.family === 'IPv4' && !alias.internal && alias.address !== '127.0.0.1') {
          return alias.address;
        }
      }
    }
  }
  return 'localhost';
}

const localIp = getLocalIpAddress();
const localUrl = `http://${localIp}:${PORT}`;

let qrCodeDataUrl = '';
QRCode.toDataURL(localUrl)
  .then(url => {
    qrCodeDataUrl = url;
  })
  .catch(err => {
    console.error('Error generating QR code:', err);
  });

// Application State
let state = {
  buzzerOpen: false,       // whether teams can press buzzer
  roundId: 1,              // round counter
  teams: [                 // dynamic list of teams
    { id: 't1', name: 'Alpha Squad', color: '#6366f1', score: 0 },
    { id: 't2', name: 'Beta Titans', color: '#ec4899', score: 0 },
    { id: 't3', name: 'Gamma Force', color: '#10b981', score: 0 },
    { id: 't4', name: 'Delta Warriors', color: '#f59e0b', score: 0 }
  ],
  buzzerPresses: [],        // array of { teamId, teamName, timestampMs, formattedTime, timeDiffMs, isFalseStart }
  countdown: null          // active countdown status if any
};

// WebSocket logic
io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Send current state to newly connected client
  socket.emit('state-sync', {
    ...state,
    localUrl,
    qrCodeDataUrl
  });

  // Host or player requests dynamic state
  socket.on('get-state', () => {
    socket.emit('state-sync', {
      ...state,
      localUrl,
      qrCodeDataUrl
    });
  });

  // Host opens or locks the buzzer
  socket.on('toggle-buzzer-lock', (isOpen) => {
    state.buzzerOpen = Boolean(isOpen);
    state.countdown = null;
    io.emit('buzzer-lock-updated', { buzzerOpen: state.buzzerOpen });
    io.emit('state-sync', state);
  });

  // Host triggers round reset
  socket.on('reset-buzzer', () => {
    state.buzzerOpen = true;
    state.buzzerPresses = [];
    state.roundId += 1;
    state.countdown = null;
    io.emit('buzzer-reset', { roundId: state.roundId, buzzerOpen: true });
    io.emit('state-sync', state);
  });

  // Host starts countdown (e.g. 30, 29, 28... -> OPEN)
  socket.on('start-countdown', (seconds = 30) => {
    state.buzzerOpen = false;
    let current = seconds;
    state.countdown = current;
    io.emit('countdown-tick', { current });

    const interval = setInterval(() => {
      current -= 1;
      if (current > 0) {
        state.countdown = current;
        io.emit('countdown-tick', { current });
      } else {
        clearInterval(interval);
        state.countdown = 0;
        state.buzzerOpen = true;
        io.emit('countdown-finished');
        io.emit('buzzer-lock-updated', { buzzerOpen: true });
        io.emit('state-sync', state);
      }
    }, 1000);
  });

  // Player presses buzzer
  socket.on('press-buzzer', (payload) => {
    const { teamId, teamName } = payload;
    const now = Date.now();

    // Check if team already pressed in this round
    const existingPress = state.buzzerPresses.find(p => p.teamId === teamId);
    if (existingPress) {
      return; // prevent duplicate buzzes from same team in same round
    }

    const dateObj = new Date(now);
    const formattedTime = dateObj.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }) + '.' + String(dateObj.getMilliseconds()).padStart(3, '0');

    const isFalseStart = !state.buzzerOpen;
    const firstPressMs = state.buzzerPresses.length > 0 ? state.buzzerPresses[0].timestampMs : now;
    const timeDiffMs = now - firstPressMs;

    const rank = state.buzzerPresses.length + 1;

    const newPress = {
      teamId,
      teamName: teamName || 'Unknown Team',
      timestampMs: now,
      formattedTime,
      timeDiffMs,
      isFalseStart,
      rank
    };

    state.buzzerPresses.push(newPress);

    // Notify all clients of new buzzer press
    io.emit('buzzer-pressed', {
      press: newPress,
      buzzerPresses: state.buzzerPresses
    });

    io.emit('state-sync', state);
  });

  // Dynamic Team Management: Add Team
  socket.on('add-team', (teamData) => {
    const newTeam = {
      id: 't_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      name: teamData.name || 'New Team',
      color: teamData.color || '#3b82f6',
      score: 0
    };
    state.teams.push(newTeam);
    io.emit('state-sync', state);
  });

  // Dynamic Team Management: Edit/Rename Team
  socket.on('update-team', (updatedTeam) => {
    const idx = state.teams.findIndex(t => t.id === updatedTeam.id);
    if (idx !== -1) {
      state.teams[idx] = { ...state.teams[idx], ...updatedTeam };
      io.emit('state-sync', state);
    }
  });

  // Dynamic Team Management: Delete Team
  socket.on('delete-team', (teamId) => {
    state.teams = state.teams.filter(t => t.id !== teamId);
    state.buzzerPresses = state.buzzerPresses.filter(p => p.teamId !== teamId);
    io.emit('state-sync', state);
  });

  // Host updates Score
  socket.on('update-score', ({ teamId, delta }) => {
    const team = state.teams.find(t => t.id === teamId);
    if (team) {
      team.score = (team.score || 0) + delta;
      io.emit('state-sync', state);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

async function startServer() {
  const distPath = path.join(__dirname, 'dist');
  if (fs.existsSync(distPath)) {
    // Serve static build from dist folder
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`\n⚡ BuzzerX Live Server is running!`);
    console.log(`👉 Local:   http://localhost:${PORT}`);
    console.log(`👉 Network: ${localUrl}\n`);
  });
}

startServer();
