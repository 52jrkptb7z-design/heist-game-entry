// The thief: one quiet figure with a bag, a set of EMP charges and a good
// pair of shoes. Movement is plain keyboard walking with wall sliding; the
// interesting verbs are sneaking (slow, but the meter barely notices you),
// grabbing whatever glitters within reach, and burning an EMP charge to
// blind every camera in the building for a few seconds — at the price of a
// little noise on the meter.

import { ALARM, EMP, PLAYER } from './config.js';
import { EXIT_ZONE, PLAYER_START, slideMove } from './level.js';
import { sfx } from './audio.js';

export function createPlayer() {
  return {
    x: PLAYER_START.x,
    y: PLAYER_START.y,
    r: PLAYER.radius,
    angle: 0,
    sneaking: false,
    loot: 0,
    lootCount: 0,
    emps: PLAYER.startEmp,
  };
}

/**
 * One frame of the thief. `input` is {x, y, sneak, empPressed} with x/y in
 * {-1, 0, 1}. Returns an event string ('loot', 'emp', 'exit') or null.
 */
export function updatePlayer(state, input, dt) {
  const p = state.player;
  p.sneaking = Boolean(input.sneak);
  const speed = p.sneaking ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
  if (input.x !== 0 || input.y !== 0) {
    const len = Math.hypot(input.x, input.y);
    slideMove(state.level, p, (input.x / len) * speed * dt, (input.y / len) * speed * dt);
    p.angle = Math.atan2(input.y, input.x);
  }

  if (input.empPressed) fireEmp(state);

  for (let i = 0; i < state.lootItems.length; i += 1) {
    const item = state.lootItems[i];
    if (item.taken) continue;
    if (Math.hypot(item.x - p.x, item.y - p.y) < p.r + item.r + 4) {
      item.taken = true;
      p.loot += item.value;
      p.lootCount += 1;
      state.toast = { text: `${item.name}  +$${item.value}`, t: 2.2 };
      sfx.pickup();
      return 'loot';
    }
  }

  if (p.x > EXIT_ZONE.x && p.x < EXIT_ZONE.x + EXIT_ZONE.w + p.r && p.y > EXIT_ZONE.y && p.y < EXIT_ZONE.y + EXIT_ZONE.h) {
    return 'exit';
  }
  return null;
}

/** Blind the cameras for a few seconds. Costs a charge, makes a noise. */
export function fireEmp(state) {
  const p = state.player;
  if (p.emps <= 0 || state.cameraDownT > 0) return false;
  p.emps -= 1;
  state.cameraDownT = EMP.cameraDownSeconds;
  state.alarm.value = Math.min(ALARM.max, state.alarm.value + ALARM.empNoise);
  state.toast = { text: 'EMP — cameras down', t: 2.2 };
  sfx.emp();
  return true;
}
