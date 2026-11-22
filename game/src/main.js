// Midnight Vault — the loop and the wiring. Owns the canvas, the keyboard
// and the mouse, the fixed set of things that happen every frame (patrols
// move, the thief moves, eyes open or miss him, the meter answers), and the
// three ways a night ends: never started, caught, or gone with the money.

import { CANVAS, SCORE } from './config.js';
import { createState, resetState } from './state.js';
import { updatePlayer } from './player.js';
import { computeSeers, updateWatchers } from './guards.js';
import { updateAlarm } from './alarm.js';
import { render } from './render.js';
import { ensureAudio, sfx } from './audio.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('vault');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS.width;
canvas.height = CANVAS.height;

const state = createState();
const keys = new Set();
const pointer = { x: 0, y: 0, down: false };
let empQueued = false;

function startRun() {
  ensureAudio();
  if (state.screen === 'title') state.screen = 'play';
}

function restart() {
  ensureAudio();
  resetState(state);
  state.screen = 'play';
}

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
  if (key === 'enter') startRun();
  if (key === 'r') restart();
  if (key === 'e') empQueued = true;
  keys.add(key);
});
window.addEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()));
canvas.addEventListener('pointerdown', (event) => {
  pointer.down = true;
  trackPointer(event);
  if (state.screen === 'title') startRun();
});
window.addEventListener('pointerup', () => { pointer.down = false; });
canvas.addEventListener('pointermove', trackPointer);

function trackPointer(event) {
  const box = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - box.left) / box.width) * CANVAS.width;
  pointer.y = ((event.clientY - box.top) / box.height) * CANVAS.height;
}

function currentInput() {
  let x = (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0);
  let y = (keys.has('s') || keys.has('arrowdown') ? 1 : 0) - (keys.has('w') || keys.has('arrowup') ? 1 : 0);
  if (x === 0 && y === 0 && pointer.down) {
    // Held mouse steers: run toward the pointer, in world coordinates.
    const dx = pointer.x - state.player.x;
    const dy = pointer.y - 64 - state.player.y;
    if (Math.hypot(dx, dy) > 10) { x = dx; y = dy; }
  }
  const input = { x, y, sneak: keys.has('shift'), empPressed: empQueued };
  empQueued = false;
  return input;
}

function finishRun(won) {
  if (won) {
    const timePenalty = Math.floor(state.runTime) * SCORE.timePenaltyPerSecond;
    const ghost = state.alarm.peak < SCORE.ghostCeiling ? SCORE.ghostBonus : 0;
    const total = Math.max(0, state.player.loot - timePenalty + ghost);
    const grade = total >= 5200 ? 'S' : total >= 4200 ? 'A' : total >= 3000 ? 'B' : 'C';
    state.result = { loot: state.player.loot, timePenalty, ghost, total, grade };
    state.screen = 'won';
    sfx.win();
  } else {
    state.screen = 'caught';
    sfx.caught();
  }
}

function step(dt) {
  state.time += dt;
  updateWatchers(state, dt);
  if (state.screen !== 'play') return;

  state.runTime += dt;
  if (state.cameraDownT > 0) state.cameraDownT -= dt;
  if (state.toast) {
    state.toast.t -= dt;
    if (state.toast.t <= 0) state.toast = null;
  }
  if (state.spotSoundT > 0) state.spotSoundT -= dt;

  const event = updatePlayer(state, currentInput(), dt);
  if (event === 'exit') {
    finishRun(true);
    return;
  }
  const seers = computeSeers(state);
  if (state.spotted && state.spotSoundT <= 0) {
    sfx.spotted();
    state.spotSoundT = 0.9;
  }
  if (updateAlarm(state, seers, dt)) finishRun(false);
}

// A ?shot= scene is staged once and held: the frame the screenshots show.
const shotName = new URLSearchParams(window.location.search).get('shot');
const shotMode = shotName !== null;
if (shotMode) {
  stageShot(shotName, state);
  document.body.dataset.shotReady = shotName;
}

let lastStamp = performance.now();
function frame(now) {
  const dt = Math.min(0.033, (now - lastStamp) / 1000);
  lastStamp = now;
  if (!shotMode) step(dt);
  render(ctx, state);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
