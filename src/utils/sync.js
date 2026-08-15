import { io } from 'socket.io-client';
import Peer from 'peerjs';

// Local BroadcastChannel for multi-tab fallback on same browser
const broadcastChannel = typeof BroadcastChannel !== 'undefined' 
  ? new BroadcastChannel('buzzerx_channel') 
  : null;

let socket = null;
let peer = null;
let peerConnections = [];
let hostPeerConnection = null;
let isHostPeer = false;

// 1. Localhost Socket.io Connection (if local Node server is running)
export function initSocketConnection(onStateChange, onBuzzerPressed) {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    try {
      const serverUrl = window.location.origin;
      socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 2,
        timeout: 2000
      });

      socket.on('connect', () => {
        console.log('✅ Connected to local Node WebSocket server');
      });

      socket.on('state-sync', (data) => {
        if (onStateChange) onStateChange(data);
      });

      socket.on('buzzer-pressed', (data) => {
        if (onBuzzerPressed) onBuzzerPressed(data);
      });
    } catch (e) {
      console.warn('Socket.io connection bypassed, using PeerJS P2P fallback');
    }
  }

  if (broadcastChannel) {
    broadcastChannel.onmessage = (event) => {
      const { type, payload } = event.data;
      if (type === 'STATE_UPDATE' && onStateChange) {
        onStateChange(payload);
      } else if (type === 'BUZZER_PRESSED' && onBuzzerPressed) {
        onBuzzerPressed(payload);
      }
    };
  }

  return socket;
}

// 2. Host PeerJS Initialization (Runs on Host Laptop)
export function initPeerHostRoom(roomId, onActionReceived, getCurrentState) {
  if (peer) {
    try { peer.destroy(); } catch (e) {}
  }

  isHostPeer = true;
  const peerId = `buzzerx-room-${roomId}`;

  // Use public PeerJS signaling cloud server
  peer = new Peer(peerId, {
    debug: 1,
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
      ]
    }
  });

  peer.on('open', (id) => {
    console.log('✅ Host Peer Room Active:', id);
  });

  peer.on('connection', (conn) => {
    console.log('📱 Mobile Player connected to Host:', conn.peer);
    peerConnections.push(conn);

    conn.on('open', () => {
      // Immediately sync current host state to newly connected mobile player
      const currentState = getCurrentState();
      conn.send({ type: 'STATE_SYNC', payload: currentState });
    });

    conn.on('data', (data) => {
      console.log('📩 Host received action from mobile:', data);
      if (onActionReceived) onActionReceived(data.type, data.payload);
    });

    conn.on('close', () => {
      peerConnections = peerConnections.filter(c => c !== conn);
    });
  });

  peer.on('error', (err) => {
    console.warn('PeerJS Host Error:', err);
    // If peer ID is already taken, host is already active
  });

  return peer;
}

// 3. Player PeerJS Initialization (Runs on Mobile Phone)
export function initPeerPlayerRoom(roomId, onStateChange, onBuzzerPressed) {
  if (peer) {
    try { peer.destroy(); } catch (e) {}
  }

  isHostPeer = false;
  peer = new Peer({
    debug: 1,
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
      ]
    }
  });

  peer.on('open', (playerPeerId) => {
    console.log('📱 Mobile Player Peer Ready:', playerPeerId);
    const hostPeerId = `buzzerx-room-${roomId}`;

    // Connect to Host Laptop Peer
    hostPeerConnection = peer.connect(hostPeerId);

    hostPeerConnection.on('open', () => {
      console.log('⚡ Connected to Host Laptop Peer:', hostPeerId);
    });

    hostPeerConnection.on('data', (data) => {
      console.log('📩 Mobile received state from Host:', data);
      const { type, payload } = data;
      if (type === 'STATE_SYNC' && onStateChange) {
        onStateChange(payload);
      } else if (type === 'BUZZER_PRESSED' && onBuzzerPressed) {
        onBuzzerPressed(payload);
      }
    });

    hostPeerConnection.on('close', () => {
      console.warn('Disconnected from Host Peer');
    });
  });

  peer.on('error', (err) => {
    console.warn('PeerJS Player Error:', err);
  });

  return peer;
}

// 4. Broadcast updated state from Host to all connected mobile devices
export function broadcastPeerState(state) {
  if (!isHostPeer) return;
  peerConnections.forEach(conn => {
    if (conn && conn.open) {
      conn.send({ type: 'STATE_SYNC', payload: state });
    }
  });

  // Also broadcast via BroadcastChannel for multi-tab fallback
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: 'STATE_UPDATE', payload: state });
  }
}

// 5. Send action from Mobile Player to Host Laptop
export function sendPlayerAction(type, payload) {
  if (socket && socket.connected) {
    socket.emit(type.toLowerCase().replace('_', '-'), payload);
    return;
  }

  if (hostPeerConnection && hostPeerConnection.open) {
    hostPeerConnection.send({ type, payload });
  } else {
    console.warn('Host connection not open, broadcasting locally');
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: type === 'PRESS_BUZZER' ? 'BUZZER_PRESSED' : 'STATE_UPDATE', payload });
    }
  }
}

export function getSocket() {
  return socket;
}

export function broadcastLocal(type, payload) {
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type, payload });
  }
}
