import { io } from 'socket.io-client';
import Peer from 'peerjs';

const broadcastChannel = typeof BroadcastChannel !== 'undefined' 
  ? new BroadcastChannel('buzzerx_channel') 
  : null;

let socket = null;
let peer = null;
let peerConnections = [];
let hostPeerConnection = null;
let isHostPeer = false;

// 1. Localhost Socket.io connection (if running local Node server)
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
      console.warn('Socket.io bypassed, using PeerJS P2P engine');
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

// 2. Initialize Host PeerJS Room on Laptop
export function initPeerHostRoom(roomId, onActionReceived, getCurrentState, onPeerCountChange) {
  if (peer) {
    try { peer.destroy(); } catch (e) {}
  }

  isHostPeer = true;
  peerConnections = [];
  const cleanId = `buzzerx-room-${roomId.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

  peer = new Peer(cleanId, {
    debug: 1,
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    }
  });

  peer.on('open', (id) => {
    console.log('✅ Host Peer Room Active:', id);
  });

  peer.on('connection', (conn) => {
    console.log('📱 Mobile Player connected:', conn.peer);
    peerConnections.push(conn);
    if (onPeerCountChange) onPeerCountChange(peerConnections.length);

    conn.on('open', () => {
      // Send host state to new player
      const state = getCurrentState();
      conn.send({ type: 'STATE_SYNC', payload: state });
    });

    conn.on('data', (data) => {
      console.log('📩 Host received action from mobile:', data);
      if (onActionReceived) onActionReceived(data.type, data.payload);
    });

    conn.on('close', () => {
      peerConnections = peerConnections.filter(c => c !== conn);
      if (onPeerCountChange) onPeerCountChange(peerConnections.length);
    });

    conn.on('error', (err) => {
      console.warn('Connection error:', err);
    });
  });

  peer.on('error', (err) => {
    console.warn('Host PeerJS Error:', err);
  });

  return peer;
}

// 3. Initialize Player PeerJS Connection on Mobile Phone
export function initPeerPlayerRoom(roomId, onStateChange, onBuzzerPressed, onConnectStatusChange) {
  if (peer) {
    try { peer.destroy(); } catch (e) {}
  }

  isHostPeer = false;
  peer = new Peer({
    debug: 1,
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    }
  });

  peer.on('open', (playerPeerId) => {
    console.log('📱 Mobile Player Peer Ready:', playerPeerId);
    const hostPeerId = `buzzerx-room-${roomId.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

    hostPeerConnection = peer.connect(hostPeerId, { reliable: true });

    hostPeerConnection.on('open', () => {
      console.log('⚡ Connected to Host Laptop Peer:', hostPeerId);
      if (onConnectStatusChange) onConnectStatusChange(true);
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
      if (onConnectStatusChange) onConnectStatusChange(false);
    });

    hostPeerConnection.on('error', (err) => {
      console.warn('Host Connection Error:', err);
      if (onConnectStatusChange) onConnectStatusChange(false);
    });
  });

  peer.on('error', (err) => {
    console.warn('Player PeerJS Error:', err);
    if (onConnectStatusChange) onConnectStatusChange(false);
  });

  return peer;
}

// 4. Broadcast Host State to All Mobile Devices
export function broadcastPeerState(state) {
  if (!isHostPeer) return;
  peerConnections.forEach(conn => {
    if (conn && conn.open) {
      try {
        conn.send({ type: 'STATE_SYNC', payload: state });
      } catch (e) {
        console.warn('Error sending to peer:', e);
      }
    }
  });

  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: 'STATE_UPDATE', payload: state });
  }
}

// 5. Send Action from Mobile Phone to Host Laptop
export function sendPlayerAction(type, payload) {
  if (socket && socket.connected) {
    socket.emit(type.toLowerCase().replace('_', '-'), payload);
    return;
  }

  if (hostPeerConnection && hostPeerConnection.open) {
    try {
      hostPeerConnection.send({ type, payload });
      console.log('⚡ Action sent to Host over WebRTC:', type, payload);
    } catch (e) {
      console.warn('Failed to send over WebRTC:', e);
    }
  } else {
    console.warn('Host connection not open yet, fallback to broadcast');
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
