// High-Energy Web Audio API Sound Synthesizer for BuzzerX Live

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const playSound = (type) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (type === 'buzzer-press' || type === 'winner') {
      // 🏆 High-Energy Game Show Victory Fanfare
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      gain.connect(ctx.destination);

      // Notes: C5 (523.25), E5 (659.25), G5 (783.99), C6 (1046.50), E6 (1318.51)
      const notes = [
        { freq: 523.25, time: 0.00, dur: 0.15 }, // C5
        { freq: 659.25, time: 0.08, dur: 0.15 }, // E5
        { freq: 783.99, time: 0.16, dur: 0.15 }, // G5
        { freq: 1046.50, time: 0.24, dur: 0.50 }, // C6
        { freq: 1318.51, time: 0.32, dur: 0.70 }  // E6
      ];

      notes.forEach((note) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();

        // Brassy triangle + sawtooth mix for high energy TV game show sound
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.freq, now + note.time);

        noteGain.gain.setValueAtTime(0.3, now + note.time);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + note.time + note.dur);

        osc.connect(noteGain);
        noteGain.connect(gain);

        osc.start(now + note.time);
        osc.stop(now + note.time + note.dur);
      });

      // Layered sparkling chime flourish
      const sparkleOsc = ctx.createOscillator();
      const sparkleGain = ctx.createGain();
      sparkleOsc.type = 'sine';
      sparkleOsc.frequency.setValueAtTime(1567.98, now + 0.3); // G6
      sparkleOsc.frequency.exponentialRampToValueAtTime(2093.00, now + 0.6); // C7

      sparkleGain.gain.setValueAtTime(0.2, now + 0.3);
      sparkleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      sparkleOsc.connect(sparkleGain);
      sparkleGain.connect(ctx.destination);

      sparkleOsc.start(now + 0.3);
      sparkleOsc.stop(now + 0.9);

    } else if (type === 'buzzer-subsequent') {
      // 🥈 Energetic Dual Arcade Chime for 2nd/3rd places
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.setValueAtTime(880.00, now + 0.08); // A5

      osc2.frequency.setValueAtTime(293.66, now); // D4
      osc2.frequency.setValueAtTime(440.00, now + 0.08); // A4

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.4);
      osc2.stop(now + 0.4);

    } else if (type === 'false-start') {
      // 🚨 High-Energy Error Alarm
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now); // A3
      osc.frequency.linearRampToValueAtTime(110, now + 0.25); // A2 drop

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);

    } else if (type === 'reset') {
      // 🎺 Ascending Power-Up Swoosh
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.exponentialRampToValueAtTime(950, now + 0.18);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);

    } else if (type === 'tick') {
      // ⏳ Crisp Woodblock Countdown Tick
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);

    } else if (type === 'go') {
      // 🔔 Stadium Bell Chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1046.50, now); // C6
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    }
  } catch (e) {
    console.warn('Audio play error:', e);
  }
};
