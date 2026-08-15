import { io } from 'socket.io-client';
import Peer from 'peerjs';

// Local BroadcastChannel for multi-tab fallback when server is not used
const broadcastChannel = typeof BroadcastChannel !== 'undefined' 
  ? new BroadcastChannel('buzzerx_channel') 
  : null;

let socket = null;
let peer = null;
let peerConnections = [];
let hostPeerConnection = null;

export function initSocketConnection(onStateChange, onBuzzerPressed) {
  // Check if we are on localhost with a active Socket.io server
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    try {
      const serverUrl = window.location.origin;
      socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 3,
        timeout: 3000
      });

      socket.on('connect', () => {
        console.log('✅ Connected to local WebSocket server');
      });

      socket.on('state-sync', (data) => {
        if (onStateChange) onStateChange(data);
        localStorage.setItem('buzzerx_state', JSON.stringify(data));
      });

      socket.on('buzzer-pressed', (data) => {
        if (onBuzzerPressed) onBuzzerPressed(data);
      });
    } catch (e) {
      console.warn('Socket.io connection bypassed or failed, using P2P / BroadcastChannel');
    }
  }

  // Listen to BroadcastChannel for local cross-tab fallback
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

// PeerJS P2P Room Synchronization for Vercel Cloud Deployment
export function initPeerHostRoom(roomId, onStateChange, onBuzzerPressed, getCurrentState) {
  if (peer) peer.destroy();

  const peerId = `buzzerx-room-${roomId}`;
  peer = new Peer(peerId, {
    debug: 1
  });

  peer.on('open', (id) => {
    console.log('✅ PeerJS Host Room active:', id);
  });

  peer.on('connection', (conn) => {
    peerConnections.push(conn);

    conn.on('open', () => {
      // Send current state to newly joined player
      const state = getCurrentState();
      conn.send({ type: 'STATE_SYNC', payload: state });
    });

    conn.on('data', (data) => {
      const { type, payload } = data;
      if (type === 'PRESS_BUZZER') {
        if (onBuzzerPressed) onBuzzerPressed(payload);
      } else if (type === 'ADD_TEAM') {
        // Handled in host handler
      }
    });

    conn.on('close', () => {
      peerConnections = peerConnections.filter(c => c !== conn);
    });
  });

  return peer;
}

export function broadcastPeerState(state) {
  peerConnections.forEach(conn => {
    if (conn.open) {
      conn.send({ type: 'STATE_SYNC', payload: state });
    }
  });
}

export function initPeerPlayerRoom(roomId, onStateChange, onBuzzerPressed) {
  if (peer) peer.destroy();

  peer = new Peer({ debug: 1 });

  peer.on('open', () => {
    const hostPeerId = `buzzerx-room-${roomId}`;
    hostPeerConnection = peer.connect(hostPeerId);

    hostPeerConnection.on('open', () => {
      console.log('✅ Connected to Host Peer Room:', hostPeerId);
    });

    hostPeerConnection.on('data', (data) => {
      const { type, payload } = data;
      if (type === 'STATE_SYNC' && onStateChange) {
        onStateChange(payload);
      } else if (type === 'BUZZER_PRESSED' && onBuzzerPressed) {
        onBuzzerPressed(payload);
      }
    });
  });

  return peer;
}

export function sendPlayerPeerAction(type, payload) {
  if (hostPeerConnection && hostPeerConnection.open) {
    hostPeerConnection.send({ type, payload });
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
