import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Trophy, RotateCcw, Lock, Unlock, Play, Users, 
  Clock, QrCode, Volume2, VolumeX, Plus, Award, Smartphone, Copy, Check, Keyboard, MonitorPlay
} from 'lucide-react';
import TeamManagerModal from './TeamManagerModal';
import { playSound } from '../utils/sound';

export default function HostDashboard({
  state,
  socket,
  onAddTeam,
  onUpdateTeam,
  onDeleteTeam,
  onUpdateScore,
  onResetBuzzer,
  onToggleLock,
  onStartCountdown,
  onOpenStageView
}) {
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  const { buzzerOpen, buzzerPresses, teams, roundId, countdown, localUrl, qrCodeDataUrl } = state;

  // Host Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input/textarea
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      const code = e.code;

      if (code === 'Space') {
        e.preventDefault();
        handleReset();
      } else if (code === 'KeyC') {
        e.preventDefault();
        onStartCountdown(30);
      } else if (code === 'KeyL') {
        e.preventDefault();
        onToggleLock(!buzzerOpen);
      } else if (code === 'KeyM') {
        e.preventDefault();
        setSoundEnabled(prev => !prev);
      } else if (code === 'KeyQ') {
        e.preventDefault();
        setShowQrModal(prev => !prev);
      } else if (code === 'Digit1' && buzzerPresses.length > 0) {
        e.preventDefault();
        onUpdateScore(buzzerPresses[0].teamId, 10);
      } else if (code === 'Digit2' && buzzerPresses.length > 0) {
        e.preventDefault();
        onUpdateScore(buzzerPresses[0].teamId, 5);
      } else if (code === 'Slash' && e.shiftKey) { // Shift + ?
        e.preventDefault();
        setShowKeyModal(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [buzzerOpen, buzzerPresses, countdown]);

  // Trigger sound & confetti when a team hits buzzer first
  useEffect(() => {
    if (buzzerPresses.length === 1 && soundEnabled) {
      playSound('winner');
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } else if (buzzerPresses.length > 1 && soundEnabled) {
      playSound('buzzer-subsequent');
    }
  }, [buzzerPresses.length]);

  const handleReset = () => {
    if (soundEnabled) playSound('reset');
    onResetBuzzer();
  };

  const copyLocalUrl = () => {
    if (localUrl) {
      navigator.clipboard.writeText(localUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Top Navbar Header */}
      <header style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '2rem', color: '#fff', fontWeight: 800 }}>BuzzerX Live</h1>
            <span className="live-pill">
              <span className="live-pill-dot" /> HOST CONTROL HUB
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '4px' }}>
            Round #{roundId} &bull; High Precision Timestamp Logger & Scoreboard
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Stage View Button */}
          <button className="btn btn-primary" onClick={onOpenStageView} title="Open TV / Projector Display">
            <MonitorPlay size={18} />
            <span>Projector Stage View</span>
          </button>

          {/* Keyboard Shortcuts Button */}
          <button className="btn btn-secondary" onClick={() => setShowKeyModal(true)} title="Keyboard Hotkeys">
            <Keyboard size={18} color="#f59e0b" />
            <span>Shortcuts</span>
          </button>

          {/* Sound Toggle Button */}
          <button className="btn btn-secondary" onClick={() => setSoundEnabled(!soundEnabled)} title="Toggle Sound">
            {soundEnabled ? <Volume2 size={18} color="#10b981" /> : <VolumeX size={18} color="#ef4444" />}
            <span>{soundEnabled ? 'Audio ON' : 'Audio OFF'}</span>
          </button>

          {/* QR Code Button */}
          <button className="btn btn-secondary" onClick={() => setShowQrModal(true)}>
            <QrCode size={18} color="#6366f1" />
            <span>QR Join Link</span>
          </button>

          {/* Manage Teams Button */}
          <button className="btn btn-secondary" onClick={() => setIsTeamModalOpen(true)}>
            <Users size={18} />
            <span>Teams ({teams.length})</span>
          </button>
        </div>
      </header>

      {/* Main Control Panel & Live Results Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Left Column: Live Buzzer Controls & Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Status & Reset Control Box */}
          <div className="glass-panel" style={{ padding: '28px', textAlign: 'center' }}>
            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                BUZZER STATUS
              </span>
              <div style={{
                fontSize: '1.8rem',
                fontWeight: 800,
                marginTop: '6px',
                color: countdown !== null ? '#f59e0b' : buzzerOpen ? '#10b981' : '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                {countdown !== null ? (
                  <span>⏳ COUNTDOWN: {countdown}s</span>
                ) : buzzerOpen ? (
                  <>
                    <Unlock size={28} /> BUZZER OPEN!
                  </>
                ) : (
                  <>
                    <Lock size={28} /> BUZZER LOCKED
                  </>
                )}
              </div>
            </div>

            {/* Giant Reset / Start Next Round Button */}
            <button
              className="btn btn-success btn-lg"
              style={{
                width: '100%',
                fontSize: '1.25rem',
                padding: '18px',
                boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)',
                marginBottom: '16px'
              }}
              onClick={handleReset}
            >
              <RotateCcw size={24} /> RESET BUZZER (Press Spacebar)
            </button>

            {/* Sub Controls: Lock/Unlock & 3s Countdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                className={`btn ${buzzerOpen ? 'btn-danger' : 'btn-secondary'}`}
                onClick={() => onToggleLock(!buzzerOpen)}
              >
                {buzzerOpen ? <Lock size={16} /> : <Unlock size={16} />}
                {buzzerOpen ? 'Lock Buzzers (L)' : 'Open Buzzers (L)'}
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => onStartCountdown(30)}
                disabled={countdown !== null}
              >
                <Play size={16} /> 30s Countdown (C)
              </button>
            </div>

            {/* Quick Countdown Presets */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '10px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Presets:</span>
              {[30, 20, 15, 10, 5].map((sec) => (
                <button
                  key={sec}
                  className="btn btn-secondary"
                  style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                  onClick={() => onStartCountdown(sec)}
                  disabled={countdown !== null}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>

          {/* Teams Scoreboard Panel */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={20} color="#f59e0b" />
                <h3 style={{ fontSize: '1.2rem' }}>Live Scoreboard</h3>
              </div>
              <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.85rem' }} onClick={() => setIsTeamModalOpen(true)}>
                <Plus size={14} /> Add Team
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {teams.map((t) => (
                <div
                  key={t.id}
                  className="glass-card"
                  style={{
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      backgroundColor: t.color || '#6366f1'
                    }} />
                    <span style={{ fontWeight: 600 }}>{t.name}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f59e0b', minWidth: '36px', textAlign: 'right' }}>
                      {t.score || 0} pts
                    </span>

                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.8rem' }} onClick={() => onUpdateScore(t.id, 10)}>
                        +10
                      </button>
                      <button className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.8rem' }} onClick={() => onUpdateScore(t.id, 5)}>
                        +5
                      </button>
                      <button className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.8rem', color: '#ef4444' }} onClick={() => onUpdateScore(t.id, -5)}>
                        -5
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Timestamped Buzzer Order Results */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={24} color="#6366f1" />
              <h2 style={{ fontSize: '1.4rem' }}>Round #{roundId} Buzzer Order</h2>
            </div>

            {buzzerPresses.length > 0 && (
              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={handleReset}>
                <RotateCcw size={14} /> Clear Order
              </button>
            )}
          </div>

          {buzzerPresses.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: 'var(--text-muted)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Trophy size={32} opacity={0.4} />
              </div>
              <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>Waiting for teams to buzz in...</p>
              <p style={{ fontSize: '0.85rem', maxWidth: '300px' }}>
                When buzzers are open, the first team to hit the buzzer will be highlighted in gold with millisecond timestamp precision!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {buzzerPresses.map((press, index) => {
                const isWinner = index === 0;
                return (
                  <div
                    key={press.teamId + '_' + press.timestampMs}
                    className="glass-card"
                    style={{
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: isWinner ? '2px solid #f59e0b' : '1px solid var(--border-glass)',
                      background: isWinner 
                        ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(18, 22, 41, 0.8) 100%)' 
                        : 'var(--bg-glass-card)',
                      boxShadow: isWinner ? '0 0 25px rgba(245, 158, 11, 0.3)' : 'none',
                      transform: isWinner ? 'scale(1.02)' : 'scale(1)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      {/* Rank Badge */}
                      <span className={`rank-badge ${index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : 'rank-other'}`}>
                        {index === 0 ? '1' : index === 1 ? '2' : index === 2 ? '3' : index + 1}
                      </span>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 800, fontSize: '1.2rem', color: isWinner ? '#fef08a' : '#fff' }}>
                            {press.teamName}
                          </span>
                          {isWinner && <Trophy size={18} color="#f59e0b" />}
                          {press.isFalseStart && (
                            <span style={{
                              fontSize: '0.75rem',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(239, 68, 68, 0.2)',
                              color: '#ef4444',
                              fontWeight: 700
                            }}>
                              FALSE START
                            </span>
                          )}
                        </div>

                        {/* Exact Millisecond Timestamp */}
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          Exact Time: <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#6366f1' }}>{press.formattedTime}</span>
                        </div>
                      </div>
                    </div>

                    {/* Relative Time Difference & Award Score Buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                      <span style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        color: isWinner ? '#10b981' : 'var(--text-muted)'
                      }}>
                        {isWinner ? 'FIRST (0ms)' : `+${press.timeDiffMs}ms`}
                      </span>

                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          className="btn btn-success"
                          style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                          onClick={() => onUpdateScore(press.teamId, 10)}
                          title="Award +10 pts (Press '1')"
                        >
                          +10 pts {isWinner && '(Key 1)'}
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                          onClick={() => onUpdateScore(press.teamId, 5)}
                          title="Award +5 pts (Press '2')"
                        >
                          +5 pts {isWinner && '(Key 2)'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Team Manager Modal */}
      <TeamManagerModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        teams={teams}
        onAddTeam={onAddTeam}
        onUpdateTeam={onUpdateTeam}
        onDeleteTeam={onDeleteTeam}
      />

      {/* Keyboard Shortcuts Help Modal */}
      {showKeyModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Keyboard size={24} color="#f59e0b" />
                <h3 style={{ fontSize: '1.4rem' }}>Host Keyboard Shortcuts</h3>
              </div>
              <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={() => setShowKeyModal(false)}>
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="glass-card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600 }}>Reset Round & Unlock</span>
                <kbd style={{ backgroundColor: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>Spacebar</kbd>
              </div>
              <div className="glass-card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600 }}>Start 30s Countdown</span>
                <kbd style={{ backgroundColor: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>C</kbd>
              </div>
              <div className="glass-card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600 }}>Toggle Lock / Unlock</span>
                <kbd style={{ backgroundColor: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>L</kbd>
              </div>
              <div className="glass-card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600 }}>Award +10 pts to 1st Team</span>
                <kbd style={{ backgroundColor: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>1</kbd>
              </div>
              <div className="glass-card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600 }}>Award +5 pts to 1st Team</span>
                <kbd style={{ backgroundColor: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>2</kbd>
              </div>
              <div className="glass-card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600 }}>Toggle Audio Mute</span>
                <kbd style={{ backgroundColor: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>M</kbd>
              </div>
              <div className="glass-card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600 }}>Open QR Code Join Overlay</span>
                <kbd style={{ backgroundColor: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>Q</kbd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code & Join Link Modal */}
      {showQrModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '28px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Smartphone size={22} color="#6366f1" />
                <h3 style={{ fontSize: '1.3rem' }}>Scan to Join on Mobile</h3>
              </div>
              <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={() => setShowQrModal(false)}>
                ✕
              </button>
            </div>

            {qrCodeDataUrl ? (
              <div style={{
                background: '#fff',
                padding: '16px',
                borderRadius: '16px',
                display: 'inline-block',
                marginBottom: '20px',
                boxShadow: '0 8px 25px rgba(0,0,0,0.5)'
              }}>
                <img src={qrCodeDataUrl} alt="QR Code to Join" style={{ width: '220px', height: '220px', display: 'block' }} />
              </div>
            ) : (
              <div style={{ padding: '4px', color: 'var(--text-muted)' }}>Generating QR Code...</div>
            )}

            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Connect your smartphone or device to the same Wi-Fi network and scan the QR code above or open the link below:
            </p>

            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                readOnly
                value={localUrl || window.location.href}
                className="form-input"
                style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
              />
              <button className="btn btn-primary" onClick={copyLocalUrl}>
                {copiedLink ? <Check size={16} /> : <Copy size={16} />}
                {copiedLink ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
