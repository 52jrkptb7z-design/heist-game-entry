// The whole night in one object: the level, the thief, the watchers, the
// meter, the clock. createState builds a fresh run; resetState swaps a used
// state for a fresh one without changing its identity, so every module can
// keep the reference it already holds.

import { buildCameras, buildCover, buildGuardPatrols, buildLoot, buildWalls } from './level.js';
import { createCameras, createGuards } from './guards.js';
import { createPlayer } from './player.js';
import { createAlarm } from './alarm.js';

export function createState() {
  return {
    screen: 'title', // title | play | caught | won
    time: 0, // ambient clock: drives patrol phases and camera sweeps
    runTime: 0, // the heist clock: only runs while the thief is inside
    level: { walls: buildWalls(), cover: buildCover() },
    lootItems: buildLoot(),
    guards: createGuards(buildGuardPatrols()),
    cameras: createCameras(buildCameras()),
    player: createPlayer(),
    alarm: createAlarm(),
    cameraDownT: 0,
    spotted: false,
    toast: null,
    result: null,
    spotSoundT: 0,
  };
}

export function resetState(state) {
  const fresh = createState();
  for (const key of Object.keys(fresh)) state[key] = fresh[key];
  return state;
}
