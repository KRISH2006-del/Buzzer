import React, { useState, useEffect } from 'react';
import HostDashboard from './components/HostDashboard';
import PlayerView from './components/PlayerView';
import StageView from './components/StageView';
import { initSocketConnection, getSocket, broadcastLocal } from './utils/sync';
import { Shield, Users, Radio, Smartphone, ExternalLink, MonitorPlay } from 'lucide-react';

export default function App() {
  // Navigation mode: 'select' | 'host' | 'player' | 'stage'
  const [viewMode, setViewMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'host') return 'host';
    if (params.get('mode') === 'player') return 'player';
    if (params.get('mode') === 'stage') return 'stage';
    return 'select';
  });

  // Global Buzzer Application State
  const [state, setState] = useState({
    buzzerOpen: false,
    roundId: 1,
    teams: [
      { id: 't1', name: 'Alpha Squad', color: '#6366f1', score: 0 },
      { id: 't2', name: 'Beta Titans', color: '#ec4899', score: 0 },
      { id: 't3', name: 'Gamma Force', color: '#10b981', score: 0 },
      { id: 't4', name: 'Delta Warriors', color: '#f59e0b', score: 0 }
    ],
    buzzerPresses: [],
    countdown: null,
    localUrl: window.location.origin,
    qrCodeDataUrl: ''
  });

  const [socket, setSocket] = useState(null);

  // Initialize Socket connection and sync engine
  useEffect(() => {
    const sock = initSocketConnection(
      (newState) => {
        setState((prev) => ({ ...prev, ...newState }));
      },
      (pressData) => {
        // High priority live press update
        setState((prev) => ({
          ...prev,
          buzzerPresses: pressData.buzzerPresses
        }));
      }
    );

    setSocket(sock);
  }, []);

  // Action Dispatchers (works via Socket.io when connected, with local fallback)
  const handleAddTeam = (teamData) => {
    if (socket && socket.connected) {
      socket.emit('add-team', teamData);
    } else {
      const newTeam = {
        id: 't_' + Date.now(),
        name: teamData.name,
        color: teamData.color || '#6366f1',
        score: 0
      };
      const updatedState = { ...state, teams: [...state.teams, newTeam] };
      setState(updatedState);
      broadcastLocal('STATE_UPDATE', updatedState);
    }
  };

  const handleUpdateTeam = (updatedTeam) => {
    if (socket && socket.connected) {
      socket.emit('update-team', updatedTeam);
    } else {
      const updatedTeams = state.teams.map(t => t.id === updatedTeam.id ? { ...t, ...updatedTeam } : t);
      const updatedState = { ...state, teams: updatedTeams };
      setState(updatedState);
      broadcastLocal('STATE_UPDATE', updatedState);
    }
  };

  const handleDeleteTeam = (teamId) => {
    if (socket && socket.connected) {
      socket.emit('delete-team', teamId);
    } else {
      const updatedTeams = state.teams.filter(t => t.id !== teamId);
      const updatedPresses = state.buzzerPresses.filter(p => p.teamId !== teamId);
      const updatedState = { ...state, teams: updatedTeams, buzzerPresses: updatedPresses };
      setState(updatedState);
      broadcastLocal('STATE_UPDATE', updatedState);
    }
  };

  const handleUpdateScore = (teamId, delta) => {
    if (socket && socket.connected) {
      socket.emit('update-score', { teamId, delta });
    } else {
      const updatedTeams = state.teams.map(t => {
        if (t.id === teamId) return { ...t, score: (t.score || 0) + delta };
        return t;
      });
      const updatedState = { ...state, teams: updatedTeams };
      setState(updatedState);
      broadcastLocal('STATE_UPDATE', updatedState);
    }
  };

  const handleResetBuzzer = () => {
    if (socket && socket.connected) {
      socket.emit('reset-buzzer');
    } else {
      const updatedState = {
        ...state,
        buzzerOpen: true,
        buzzerPresses: [],
        roundId: state.roundId + 1,
        countdown: null
      };
      setState(updatedState);
      broadcastLocal('STATE_UPDATE', updatedState);
    }
  };

  const handleToggleLock = (isOpen) => {
    if (socket && socket.connected) {
      socket.emit('toggle-buzzer-lock', isOpen);
    } else {
      const updatedState = { ...state, buzzerOpen: isOpen, countdown: null };
      setState(updatedState);
      broadcastLocal('STATE_UPDATE', updatedState);
    }
  };

  const handleStartCountdown = (seconds) => {
    if (socket && socket.connected) {
      socket.emit('start-countdown', seconds);
    } else {
      let current = seconds;
      const updatedState = { ...state, buzzerOpen: false, countdown: current };
      setState(updatedState);

      const interval = setInterval(() => {
        current -= 1;
        if (current > 0) {
          setState(prev => ({ ...prev, countdown: current }));
        } else {
          clearInterval(interval);
          const finalState = { ...state, buzzerOpen: true, countdown: 0 };
          setState(finalState);
          broadcastLocal('STATE_UPDATE', finalState);
        }
      }, 1000);
    }
  };

  const handlePressBuzzer = (payload) => {
    if (socket && socket.connected) {
      socket.emit('press-buzzer', payload);
    } else {
      const now = Date.now();
      if (state.buzzerPresses.some(p => p.teamId === payload.teamId)) return;

      const dateObj = new Date(now);
      const formattedTime = dateObj.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }) + '.' + String(dateObj.getMilliseconds()).padStart(3, '0');

      const firstPressMs = state.buzzerPresses.length > 0 ? state.buzzerPresses[0].timestampMs : now;
      const timeDiffMs = now - firstPressMs;

      const newPress = {
        teamId: payload.teamId,
        teamName: payload.teamName,
        timestampMs: now,
        formattedTime,
        timeDiffMs,
        isFalseStart: !state.buzzerOpen,
        rank: state.buzzerPresses.length + 1
      };

      const updatedPresses = [...state.buzzerPresses, newPress];
      const updatedState = { ...state, buzzerPresses: updatedPresses };
      setState(updatedState);
      broadcastLocal('STATE_UPDATE', updatedState);
      broadcastLocal('BUZZER_PRESSED', { press: newPress, buzzerPresses: updatedPresses });
    }
  };

  // Open separate window in player mode for local multi-window testing
  const openPlayerWindow = () => {
    window.open(`${window.location.origin}?mode=player`, '_blank', 'width=450,height=750');
  };

  // Open separate stage view window for TV / Projector
  const openStageWindow = () => {
    window.open(`${window.location.origin}?mode=stage`, '_blank', 'width=1280,height=720');
  };

  return (
    <div>
      {/* Mode Switcher Bar */}
      <nav style={{
        backgroundColor: 'rgba(10, 12, 22, 0.9)',
        borderBottom: '1px solid var(--border-glass)',
        padding: '12px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backdropFilter: 'blur(12px)'
      }}>
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          onClick={() => setViewMode('select')}
        >
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #6366f1, #ec4899)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '1.1rem'
          }}>
            ⚡
          </div>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.2rem', color: '#fff' }}>
            BuzzerX Live
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn ${viewMode === 'host' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.85rem' }}
            onClick={() => setViewMode('host')}
          >
            <Shield size={15} /> Host Screen
          </button>

          <button
            className={`btn ${viewMode === 'stage' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.85rem' }}
            onClick={() => setViewMode('stage')}
          >
            <MonitorPlay size={15} /> Projector Stage
          </button>

          <button
            className={`btn ${viewMode === 'player' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.85rem' }}
            onClick={() => setViewMode('player')}
          >
            <Smartphone size={15} /> Player View
          </button>

          <button
            className="btn btn-secondary"
            style={{ padding: '6px 10px', fontSize: '0.85rem' }}
            onClick={openPlayerWindow}
            title="Open a new Player window to test multi-tab / multi-screen sync"
          >
            <ExternalLink size={15} /> Player Window
          </button>
        </div>
      </nav>

      {/* Main View Router */}
      <main style={{ minHeight: 'calc(100vh - 60px)' }}>
        {viewMode === 'select' && (
          <div style={{ maxWidth: '900px', margin: '60px auto', padding: '0 20px', textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex',
              padding: '12px',
              borderRadius: '20px',
              background: 'rgba(99, 102, 241, 0.15)',
              marginBottom: '20px'
            }}>
              <Radio size={48} color="#6366f1" />
            </div>

            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '12px', color: '#fff' }}>
              Online Real-Time Event Buzzer
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '650px', margin: '0 auto 40px auto' }}>
              Host quiz shows, event competitions, and trivia games with dynamic team names, millisecond-accurate timestamp logging, and live multi-device synchronization.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
              {/* Host Screen Choice */}
              <div 
                className="glass-panel" 
                style={{ padding: '28px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s ease' }}
                onClick={() => setViewMode('host')}
              >
                <Shield size={36} color="#6366f1" style={{ marginBottom: '14px' }} />
                <h2 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>Host Control Hub</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
                  Manage dynamic teams, control buzzer rounds, view live millisecond timestamps, and award scores with keyboard shortcuts.
                </p>
                <button className="btn btn-primary" style={{ width: '100%' }}>
                  Launch Host Dashboard &rarr;
                </button>
              </div>

              {/* Projector / Stage View Choice */}
              <div 
                className="glass-panel" 
                style={{ padding: '28px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s ease' }}
                onClick={() => setViewMode('stage')}
              >
                <MonitorPlay size={36} color="#f59e0b" style={{ marginBottom: '14px' }} />
                <h2 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>Projector Stage Display</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
                  Cinematic full-screen view for big screens, TVs, and stage projectors showcasing huge 1st place gold winner cards.
                </p>
                <button className="btn btn-primary" style={{ width: '100%', background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                  Launch Stage Display &rarr;
                </button>
              </div>

              {/* Player View Choice */}
              <div 
                className="glass-panel" 
                style={{ padding: '28px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s ease' }}
                onClick={() => setViewMode('player')}
              >
                <Smartphone size={36} color="#10b981" style={{ marginBottom: '14px' }} />
                <h2 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>Player / Team Buzzer</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
                  Select or enter your dynamic team name, press the giant tactile 3D buzzer, and see your rank in real time.
                </p>
                <button className="btn btn-success" style={{ width: '100%' }}>
                  Open Player Buzzer &rarr;
                </button>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'host' && (
          <HostDashboard
            state={state}
            socket={socket}
            onAddTeam={handleAddTeam}
            onUpdateTeam={handleUpdateTeam}
            onDeleteTeam={handleDeleteTeam}
            onUpdateScore={handleUpdateScore}
            onResetBuzzer={handleResetBuzzer}
            onToggleLock={handleToggleLock}
            onStartCountdown={handleStartCountdown}
            onOpenStageView={openStageWindow}
          />
        )}

        {viewMode === 'stage' && (
          <StageView state={state} />
        )}

        {viewMode === 'player' && (
          <PlayerView
            state={state}
            socket={socket}
            onPressBuzzer={handlePressBuzzer}
            onAddTeam={handleAddTeam}
          />
        )}
      </main>
    </div>
  );
}
