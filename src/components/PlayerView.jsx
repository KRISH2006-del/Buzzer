import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Zap, Trophy, Shield, RotateCcw, AlertTriangle, CheckCircle, Smartphone } from 'lucide-react';
import { playSound } from '../utils/sound';

export default function PlayerView({ state, socket, onPressBuzzer, onAddTeam }) {
  const { buzzerOpen, buzzerPresses, teams, roundId, countdown } = state;

  // Selected Team State (loaded from localStorage or default)
  const [selectedTeamId, setSelectedTeamId] = useState(() => {
    return localStorage.getItem('buzzerx_my_team_id') || '';
  });

  const [customTeamName, setCustomTeamName] = useState('');
  const [isJoiningCustom, setIsJoiningCustom] = useState(false);

  // Find currently selected team object
  const currentTeam = teams.find(t => t.id === selectedTeamId);

  // Check if current team already buzzed in this round
  const myPress = buzzerPresses.find(p => p.teamId === selectedTeamId);
  const myRank = myPress ? myPress.rank : null;
  const isFirstPlace = myRank === 1;

  // Save selected team to localStorage
  useEffect(() => {
    if (selectedTeamId) {
      localStorage.setItem('buzzerx_my_team_id', selectedTeamId);
    }
  }, [selectedTeamId]);

  // Spacebar hotkey to press buzzer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      if (e.code === 'Space' && selectedTeamId && !myPress) {
        e.preventDefault();
        handleBuzzerClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTeamId, myPress, buzzerOpen]);

  // Victory celebration when team gets 1st place
  useEffect(() => {
    if (isFirstPlace) {
      playSound('winner');
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 }
      });
    }
  }, [isFirstPlace]);

  const handleBuzzerClick = () => {
    if (!selectedTeamId) return;

    // Mobile vibration API
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }

    if (!buzzerOpen) {
      playSound('false-start');
    }

    onPressBuzzer({
      teamId: selectedTeamId,
      teamName: currentTeam ? currentTeam.name : 'Unknown Team'
    });
  };

  const handleJoinCustomTeam = (e) => {
    e.preventDefault();
    if (!customTeamName.trim()) return;
    const newTeamData = { name: customTeamName.trim(), color: '#6366f1' };
    onAddTeam(newTeamData);
    setCustomTeamName('');
    setIsJoiningCustom(false);
  };

  // If no team is selected yet, render Team Selection Screen
  if (!selectedTeamId || !currentTeam) {
    return (
      <div style={{ maxWidth: '500px', margin: '40px auto', padding: '24px 16px' }}>
        <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <Shield size={32} color="#6366f1" />
          </div>

          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>Select Your Team</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '24px' }}>
            Choose an existing team or enter your dynamic team name to join the live buzzer round.
          </p>

          {!isJoiningCustom ? (
            <>
              {teams.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                  {teams.map((t) => (
                    <button
                      key={t.id}
                      className="glass-card"
                      style={{
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        textAlign: 'left',
                        border: '1px solid var(--border-glass)',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => setSelectedTeamId(t.id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          backgroundColor: t.color || '#6366f1'
                        }} />
                        <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#fff' }}>{t.name}</span>
                      </div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Score: {t.score || 0} pts &rarr;</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>No teams created yet by host.</p>
              )}

              <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => setIsJoiningCustom(true)}>
                + Create & Join Custom Team Name
              </button>
            </>
          ) : (
            <form onSubmit={handleJoinCustomTeam}>
              <div style={{ marginBottom: '16px', textAlign: 'left' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                  Enter Dynamic Team Name
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Phoenix Rising"
                  value={customTeamName}
                  onChange={(e) => setCustomTeamName(e.target.value)}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsJoiningCustom(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Join Game
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Render Buzzer Button Screen for selected team
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px', textAlign: 'center' }}>
      {/* Team Info Bar Header */}
      <div className="glass-panel" style={{ padding: '16px 24px', marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: currentTeam.color || '#6366f1',
            boxShadow: `0 0 10px ${currentTeam.color}`
          }} />
          <div style={{ textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>{currentTeam.name}</h3>
            <span style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: 600 }}>Score: {currentTeam.score || 0} pts</span>
          </div>
        </div>

        <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setSelectedTeamId('')}>
          Switch Team
        </button>
      </div>

      {/* Round & Countdown Status Header */}
      <div style={{ marginBottom: '20px' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          ROUND #{roundId}
        </span>

        <h2 style={{
          fontSize: '1.6rem',
          fontWeight: 800,
          marginTop: '4px',
          color: countdown !== null ? '#f59e0b' : myPress ? (isFirstPlace ? '#f59e0b' : '#38bdf8') : buzzerOpen ? '#22c55e' : '#ef4444'
        }}>
          {countdown !== null ? (
            `⏳ Get Ready: ${countdown}s`
          ) : myPress ? (
            isFirstPlace ? '⚡ YOU BUZZED FIRST!' : `🥈 YOU BUZZED #${myRank}`
          ) : buzzerOpen ? (
            '🟢 PRESS BUZZER NOW!'
          ) : (
            '🔴 WAITING FOR HOST'
          )}
        </h2>
      </div>

      {/* Tactile 3D Buzzer Button */}
      <div className="buzzer-container">
        <div
          className={`buzzer-btn-outer ${
            myRank === 1 ? 'pressed-1st' : myPress ? 'pressed-subsequent' : buzzerOpen ? 'ready' : 'locked'
          }`}
          onClick={handleBuzzerClick}
        >
          <div className="buzzer-btn-inner">
            <Zap size={56} style={{ marginBottom: '8px' }} />
            <span style={{ fontSize: '1.4rem', fontWeight: 900 }}>
              {myPress ? `RANK #${myRank}` : buzzerOpen ? 'BUZZ!' : 'LOCKED'}
            </span>
          </div>
        </div>
      </div>

      {/* Buzzer Feedback Result Card */}
      {myPress && (
        <div className="glass-panel" style={{
          padding: '20px',
          marginTop: '28px',
          border: isFirstPlace ? '2px solid #f59e0b' : '1px solid var(--border-glass)',
          background: isFirstPlace ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255, 255, 255, 0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '8px' }}>
            {isFirstPlace ? <Trophy size={28} color="#f59e0b" /> : <CheckCircle size={28} color="#38bdf8" />}
            <h3 style={{ fontSize: '1.4rem', color: isFirstPlace ? '#fef08a' : '#fff' }}>
              {isFirstPlace ? 'Congratulations! 1st Place!' : `Buzzed #${myRank}`}
            </h3>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Timestamp: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#6366f1' }}>{myPress.formattedTime}</span>
            {!isFirstPlace && <span style={{ marginLeft: '8px', color: '#94a3b8' }}>(+{myPress.timeDiffMs}ms delay)</span>}
          </p>
        </div>
      )}

      {/* Help text */}
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '24px' }}>
        💡 Tip: You can press Spacebar or tap the screen to hit the buzzer!
      </p>
    </div>
  );
}
