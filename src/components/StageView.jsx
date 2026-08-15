import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Clock, Lock, Unlock, Play, Radio, Volume2, VolumeX } from 'lucide-react';
import { playSound } from '../utils/sound';

export default function StageView({ state }) {
  const { buzzerOpen, buzzerPresses, teams, roundId, countdown } = state;

  const winner = buzzerPresses.length > 0 ? buzzerPresses[0] : null;

  // Trigger confetti & sound on 1st place press
  useEffect(() => {
    if (buzzerPresses.length === 1) {
      playSound('winner');
      confetti({
        particleCount: 120,
        spread: 100,
        origin: { y: 0.4 }
      });
    }
  }, [buzzerPresses.length]);

  // Sort teams by score for stage leaderboard
  const sortedTeams = [...teams].sort((a, b) => (b.score || 0) - (a.score || 0));

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#070913',
      color: '#fff',
      padding: '40px 24px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Neon Accent Blobs */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '20%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        right: '20%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Top Header Bar for Stage / Projector */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        paddingBottom: '20px',
        zIndex: 2
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1, #ec4899)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.8rem'
          }}>
            ⚡
          </div>
          <div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.03em' }}>
              BUZZERX <span style={{ color: '#6366f1' }}>STAGE DISPLAY</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
              Live Arena Round #{roundId}
            </p>
          </div>
        </div>

        {/* Big Status Indicator */}
        <div style={{
          padding: '10px 24px',
          borderRadius: '999px',
          fontSize: '1.4rem',
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: countdown !== null ? 'rgba(245, 158, 11, 0.2)' : buzzerOpen ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
          border: `2px solid ${countdown !== null ? '#f59e0b' : buzzerOpen ? '#10b981' : '#ef4444'}`,
          color: countdown !== null ? '#f59e0b' : buzzerOpen ? '#10b981' : '#ef4444',
          boxShadow: `0 0 20px ${countdown !== null ? 'rgba(245, 158, 11, 0.4)' : buzzerOpen ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`
        }}>
          {countdown !== null ? (
            <>⏳ COUNTDOWN: {countdown}s</>
          ) : buzzerOpen ? (
            <><Unlock size={24} /> BUZZERS OPEN!</>
          ) : (
            <><Lock size={24} /> BUZZERS LOCKED</>
          )}
        </div>
      </header>

      {/* Main Center Display: Giant Winner Banner / Live Rank Log */}
      <main style={{
        my: 'auto',
        display: 'grid',
        gridTemplateColumns: buzzerPresses.length > 0 ? '1.4fr 1fr' : '1fr',
        gap: '40px',
        alignItems: 'center',
        padding: '30px 0',
        zIndex: 2
      }}>
        {/* Left / Main Section: 1st Place Highlight */}
        <div>
          {buzzerPresses.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 40px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(16px)'
            }}>
              <div style={{
                fontSize: '4rem',
                marginBottom: '16px',
                animation: 'bounce 2s infinite'
              }}>
                📢
              </div>
              <h2 style={{ fontSize: '2.8rem', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>
                READY FOR THE BUZZER!
              </h2>
              <p style={{ fontSize: '1.4rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
                Teams, prepare your buzzers! Press your button as soon as the host opens the round.
              </p>
            </div>
          ) : (
            /* 1st Place Winner Big Stage Card */
            <div style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(18, 22, 41, 0.95) 100%)',
              borderRadius: '28px',
              border: '3px solid #f59e0b',
              padding: '40px',
              boxShadow: '0 0 60px rgba(245, 158, 11, 0.4)',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                fontSize: '8rem',
                opacity: 0.1,
                userSelect: 'none'
              }}>
                🏆
              </div>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 24px',
                borderRadius: '999px',
                backgroundColor: '#f59e0b',
                color: '#000',
                fontWeight: 900,
                fontSize: '1.2rem',
                letterSpacing: '0.08em',
                marginBottom: '20px'
              }}>
                <Trophy size={22} /> 1ST PLACE WINNER
              </div>

              <h2 style={{
                fontSize: '3.8rem',
                fontWeight: 900,
                color: '#fef08a',
                lineHeight: 1.1,
                marginBottom: '16px',
                textShadow: '0 0 30px rgba(245, 158, 11, 0.6)'
              }}>
                {winner.teamName}
              </h2>

              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '24px',
                fontSize: '1.4rem',
                color: 'var(--text-secondary)'
              }}>
                <div>
                  Timestamp: <span style={{ fontFamily: 'monospace', color: '#6366f1', fontWeight: 800 }}>{winner.formattedTime}</span>
                </div>
                <div style={{
                  padding: '4px 16px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  color: '#10b981',
                  fontWeight: 800,
                  fontFamily: 'monospace'
                }}>
                  FIRST (0ms)
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Section: Full Order Rankings */}
        {buzzerPresses.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '1.4rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Full Response Order
            </h3>

            {buzzerPresses.map((press, index) => (
              <div
                key={press.teamId + '_' + press.timestampMs}
                style={{
                  padding: '16px 20px',
                  borderRadius: '16px',
                  backgroundColor: index === 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  border: index === 0 ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transform: index === 0 ? 'scale(1.03)' : 'scale(1)',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span className={`rank-badge ${index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : 'rank-other'}`}>
                    {index + 1}
                  </span>
                  <span style={{ fontWeight: 800, fontSize: '1.3rem', color: index === 0 ? '#fef08a' : '#fff' }}>
                    {press.teamName}
                  </span>
                </div>

                <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1.1rem', color: index === 0 ? '#10b981' : '#94a3b8' }}>
                  {index === 0 ? '0ms' : `+${press.timeDiffMs}ms`}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Bottom Stage Leaderboard Bar */}
      <footer style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        paddingTop: '20px',
        zIndex: 2
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            EVENT OVERALL SCOREBOARD LEADERBOARD
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.max(sortedTeams.length, 1)}, 1fr)`,
          gap: '16px'
        }}>
          {sortedTeams.map((t, idx) => (
            <div
              key={t.id}
              style={{
                padding: '12px 16px',
                borderRadius: '14px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: t.color || '#6366f1'
                }} />
                <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{t.name}</span>
              </div>
              <span style={{ fontWeight: 900, fontSize: '1.2rem', color: '#f59e0b' }}>
                {t.score || 0} pts
              </span>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}
