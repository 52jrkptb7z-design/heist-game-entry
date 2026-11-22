// Midnight Vault — shared numbers. One place for the size of the world, how
// fast everyone moves and how quickly the alarm climbs, so the other files
// never sprinkle magic constants around.

export const WORLD = { width: 1280, height: 800 };
export const HUD_HEIGHT = 64;
export const CANVAS = { width: WORLD.width, height: WORLD.height + HUD_HEIGHT };

export const PLAYER = {
  radius: 13,
  walkSpeed: 172,
  sneakSpeed: 102,
  startEmp: 3,
};

export const GUARD = {
  radius: 14,
  visionRange: 195,
  visionHalfAngle: 0.56, // about 32 degrees
  alertSpeedBonus: 1.2, // patrols hurry once the meter passes 60
};

export const CAMERA = {
  visionRange: 175,
  visionHalfAngle: 0.42, // about 24 degrees
};

export const ALARM = {
  max: 100,
  fillRate: 55, // per second at point blank, scaled by distance
  decayRate: 15, // per second while nobody sees the thief
  sneakFactor: 0.45, // sneaking fills the meter at less than half speed
  empNoise: 6, // an EMP pulse is loud: the meter jumps a little
  alertThreshold: 60,
};

export const EMP = { cameraDownSeconds: 6 };

export const SCORE = {
  timePenaltyPerSecond: 10,
  ghostBonus: 750,
  ghostCeiling: 55, // never let the meter past this and the bonus is yours
};
