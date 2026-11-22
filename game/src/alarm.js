// The alarm meter: the single number the whole night hangs on. It climbs
// while any watcher has eyes on the thief — faster the closer the watcher
// is, slower while he sneaks — and it drains away again in the quiet. Fill
// it to the top and the night is over.

import { ALARM } from './config.js';

export function createAlarm() {
  return { value: 0, peak: 0 };
}

/**
 * Advance the meter. `seers` is the list computeSeers produced this frame.
 * Returns true on the frame the meter tops out.
 */
export function updateAlarm(state, seers, dt) {
  const alarm = state.alarm;
  if (seers.length === 0) {
    alarm.value = Math.max(0, alarm.value - ALARM.decayRate * dt);
  } else {
    let fill = 0;
    for (let i = 0; i < seers.length; i += 1) {
      const closeness = 1.3 - seers[i].dist / seers[i].range;
      fill += ALARM.fillRate * Math.max(0.25, closeness);
    }
    if (state.player.sneaking) fill *= ALARM.sneakFactor;
    alarm.value = Math.min(ALARM.max, alarm.value + fill * dt);
  }
  if (alarm.value > alarm.peak) alarm.peak = alarm.value;
  return alarm.value >= ALARM.max;
}

/** The meter's mood, for the colour of the bar and the cones' urgency. */
export function alarmMood(value) {
  if (value >= 75) return 'critical';
  if (value >= 40) return 'rising';
  if (value > 0) return 'warm';
  return 'calm';
}
