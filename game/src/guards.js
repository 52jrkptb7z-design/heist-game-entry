// The watchers: guards who walk their patrols and cameras that sweep their
// arcs, plus the one question both answer every frame — can I see the thief
// right now? A guard walks waypoint to waypoint, pauses at each to look
// around, and turns to stare at the thief the moment he is in the open.

import { CAMERA, GUARD, ALARM } from './config.js';
import { blockers } from './level.js';
import { angleDifference, canSee } from './vision.js';

export function createGuards(patrolDefs) {
  return patrolDefs.map((def, index) => ({
    kind: 'guard',
    x: def.waypoints[0][0],
    y: def.waypoints[0][1],
    r: GUARD.radius,
    waypoints: def.waypoints,
    target: 1 % def.waypoints.length,
    speed: def.speed,
    pauseFor: def.pause,
    pauseT: 0,
    angle: 0,
    scanPhase: index * 2.1,
    sees: false,
  }));
}

export function createCameras(cameraDefs) {
  return cameraDefs.map((def) => ({
    kind: 'camera',
    x: def.x,
    y: def.y,
    baseAngle: def.baseAngle,
    sweepAmp: def.sweepAmp,
    period: def.period,
    phase: def.phase,
    angle: def.baseAngle,
    sees: false,
  }));
}

function updateOneGuard(state, guard, dt) {
  const goal = guard.waypoints[guard.target];
  if (guard.pauseT > 0) {
    guard.pauseT -= dt;
    // Standing still is not standing idle: the head sweeps back and forth.
    guard.angle = guard.lookAngle + Math.sin(state.time * 1.5 + guard.scanPhase) * 0.55;
    return;
  }
  const dx = goal[0] - guard.x;
  const dy = goal[1] - guard.y;
  const dist = Math.hypot(dx, dy);
  const hurry = state.alarm.value >= ALARM.alertThreshold ? GUARD.alertSpeedBonus : 1;
  const step = guard.speed * hurry * dt;
  if (dist <= step) {
    guard.x = goal[0];
    guard.y = goal[1];
    guard.lookAngle = guard.angle;
    guard.pauseT = guard.pauseFor;
    guard.target = (guard.target + 1) % guard.waypoints.length;
  } else {
    guard.x += (dx / dist) * step;
    guard.y += (dy / dist) * step;
    guard.angle = Math.atan2(dy, dx);
  }
}

export function updateWatchers(state, dt) {
  for (let i = 0; i < state.guards.length; i += 1) updateOneGuard(state, state.guards[i], dt);
  for (let i = 0; i < state.cameras.length; i += 1) {
    const cam = state.cameras[i];
    const sweep = Math.sin((state.time * Math.PI * 2) / cam.period + cam.phase);
    cam.angle = cam.baseAngle + sweep * cam.sweepAmp;
  }
}

/**
 * Every watcher that can see the thief this frame, with the distance.
 * Guards who see him turn to face him. Cameras count for nothing while an
 * EMP has them down. The result feeds the alarm meter.
 */
export function computeSeers(state) {
  const solids = blockers(state.level);
  const p = state.player;
  const seers = [];
  for (let i = 0; i < state.guards.length; i += 1) {
    const g = state.guards[i];
    g.sees = canSee(g.x, g.y, g.angle, GUARD.visionHalfAngle, GUARD.visionRange, p.x, p.y, solids);
    if (g.sees) {
      g.angle = Math.atan2(p.y - g.y, p.x - g.x);
      seers.push({ watcher: g, dist: Math.hypot(p.x - g.x, p.y - g.y), range: GUARD.visionRange });
    }
  }
  const camerasDown = state.cameraDownT > 0;
  for (let i = 0; i < state.cameras.length; i += 1) {
    const c = state.cameras[i];
    c.sees = !camerasDown && canSee(c.x, c.y, c.angle, CAMERA.visionHalfAngle, CAMERA.visionRange, p.x, p.y, solids);
    if (c.sees) seers.push({ watcher: c, dist: Math.hypot(p.x - c.x, p.y - c.y), range: CAMERA.visionRange });
  }
  state.spotted = seers.length > 0;
  return seers;
}

/** How far a guard's heading is from the thief, for the "?" hints. */
export function guardSuspicion(state, guard) {
  const p = state.player;
  const toPlayer = Math.atan2(p.y - guard.y, p.x - guard.x);
  return Math.abs(angleDifference(toPlayer, guard.angle));
}
