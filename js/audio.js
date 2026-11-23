let ctx = null;
let enabled = true;

export function initAudio() {
  if (ctx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (AC) ctx = new AC();
}

export function setSound(on) { enabled = on; }
export function isSoundOn() { return enabled; }

function beep(freq, duration, type = 'sine', gain = 0.1) {
  if (!enabled || !ctx) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(gain, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(g).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export const sfx = {
  tap: () => beep(600, 0.05, 'square', 0.05),
  connect: () => beep(880, 0.08, 'sine', 0.08),
  switchClick: () => beep(400, 0.06, 'square', 0.08),
  success: () => {
    beep(660, 0.12, 'sine', 0.1);
    setTimeout(() => beep(880, 0.15, 'sine', 0.1), 100);
    setTimeout(() => beep(1100, 0.2, 'sine', 0.1), 200);
  },
  shortCircuit: () => {
    beep(120, 0.3, 'sawtooth', 0.15);
    setTimeout(() => beep(80, 0.2, 'sawtooth', 0.12), 80);
  },
  error: () => beep(200, 0.2, 'square', 0.1),
};
