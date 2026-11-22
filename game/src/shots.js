// The screenshot scenes behind ?shot=cover|vault|alarm|escape. Each one
// drives the real game state with a fixed timestep — patrols walk, cameras
// sweep, the meter is filled by the real detection code — then poses the
// thief for the frame. Same scene, same frame, every run: the pictures in
// screenshots/ are renders of this code and nothing else.

import { updateAlarm } from './alarm.js';
import { computeSeers, updateWatchers } from './guards.js';
import { resetState } from './state.js';

const STEP = 1 / 60;

/** Let the building live for a while with the thief tucked out of sight. */
function letPatrolsRun(state, seconds) {
  state.player.x = 380;
  state.player.y = 762; // the office's far corner: no patrol, no camera reaches it
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    state.time += STEP;
    updateWatchers(state, STEP);
  }
}

function takeLoot(state, names, carried) {
  for (let i = 0; i < state.lootItems.length; i += 1) {
    if (names.includes(state.lootItems[i].name)) state.lootItems[i].taken = true;
  }
  state.player.loot = carried;
  state.player.lootCount = names.length;
}

function stageCover(state) {
  letPatrolsRun(state, 26);
  state.player.x = 250;
  state.player.y = 215;
  state.player.angle = 0.35;
  state.screen = 'title';
}

function stageVault(state) {
  letPatrolsRun(state, 9);
  takeLoot(state, ['Lobby Painting', 'Gold Watch', 'Gold Bars'], 1250);
  state.player.x = 1108;
  state.player.y = 384;
  state.player.angle = 0;
  state.alarm.value = 42;
  state.alarm.peak = 42;
  state.runTime = 96;
  state.screen = 'play';
}

function stageAlarm(state) {
  letPatrolsRun(state, 9);
  // Stand the thief in front of the nearest guard and hold the stare: the
  // guard stops, turns, and the real meter does the rest.
  const guard = state.guards[0];
  guard.pauseT = 30;
  guard.x = 640;
  guard.y = 250;
  state.player.x = 640;
  state.player.y = 370;
  state.player.angle = -Math.PI / 2;
  for (let i = 0; i < 240 && state.alarm.value < 76; i += 1) {
    state.time += STEP;
    guard.angle = Math.atan2(state.player.y - guard.y, state.player.x - guard.x);
    const seers = computeSeers(state);
    updateAlarm(state, seers, STEP);
  }
  state.runTime = 131;
  state.screen = 'play';
}

function stageEscape(state) {
  letPatrolsRun(state, 14);
  takeLoot(state, ['Lobby Painting', 'Gold Watch', 'Jewel Case', 'Gold Bars', 'Gold Bars', 'Ruby Necklace', 'Emerald Ring', 'Sunfire Diamond'], 4900);
  state.player.x = 58;
  state.player.y = 668;
  state.player.angle = Math.PI;
  state.alarm.value = 24;
  state.alarm.peak = 58;
  state.runTime = 233;
  state.screen = 'play';
}

const SCENES = { cover: stageCover, vault: stageVault, alarm: stageAlarm, escape: stageEscape };

/** Reset the state and pose it as the named scene. Unknown names get the cover. */
export function stageShot(name, state) {
  resetState(state);
  (SCENES[name] ?? stageCover)(state);
  return state;
}
