// Sound from nothing: a handful of WebAudio bleeps, synthesised on the spot,
// so the game ships no audio files. Everything is wrapped in try/catch and
// the context only wakes on a real user gesture, so headless screenshot
// runs and browsers without audio simply play in silence.

let context = null;

export function ensureAudio() {
  try {
    if (!context) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return;
      context = new Ctor();
    }
    if (context.state === 'suspended') context.resume();
  } catch {
    context = null;
  }
}

function tone(freq, delay, duration, type = 'sine', volume = 0.045) {
  if (!context) return;
  try {
    const start = context.currentTime + delay;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain).connect(context.destination);
    osc.start(start);
    osc.stop(start + duration);
  } catch {
    /* silence is fine */
  }
}

export const sfx = {
  pickup() {
    tone(880, 0, 0.09, 'triangle');
    tone(1318, 0.07, 0.12, 'triangle');
  },
  emp() {
    tone(160, 0, 0.28, 'sawtooth', 0.05);
    tone(90, 0.05, 0.3, 'sawtooth', 0.04);
  },
  spotted() {
    tone(1174, 0, 0.07, 'square', 0.03);
  },
  caught() {
    tone(392, 0, 0.18, 'square', 0.05);
    tone(311, 0.16, 0.18, 'square', 0.05);
    tone(233, 0.32, 0.34, 'square', 0.05);
  },
  win() {
    tone(523, 0, 0.12, 'triangle');
    tone(659, 0.1, 0.12, 'triangle');
    tone(784, 0.2, 0.12, 'triangle');
    tone(1046, 0.3, 0.24, 'triangle');
  },
};
