// The Meridian Trust, after hours: the bank's floor plan as data.
// Walls and cover are axis-aligned rectangles; walls block movement and
// sight, cover (desks, crates, sofas) blocks both too but reads differently
// on screen. Every doorway is a gap left between two wall segments, and the
// hall is split by a counter so there are always two ways through.

export function rect(x, y, w, h, kind = 'wall') {
  return { x, y, w, h, kind };
}

export const ROOMS = [
  { x: 16, y: 16, w: 384, h: 384, tint: '#232936', label: 'LOBBY', labelX: 208, labelY: 222 },
  { x: 16, y: 416, w: 384, h: 368, tint: '#262630', label: 'SECURITY OFFICE', labelX: 208, labelY: 760 },
  { x: 416, y: 16, w: 464, h: 768, tint: '#20242e', label: 'GRAND HALL', labelX: 648, labelY: 428 },
  { x: 896, y: 16, w: 154, h: 768, tint: '#252b33', label: 'VAULT WING', labelX: 973, labelY: 66 },
  { x: 1066, y: 16, w: 198, h: 768, tint: '#2b2438', label: 'THE VAULT', labelX: 1165, labelY: 96 },
];

export function buildWalls() {
  return [
    // The outer shell.
    rect(0, 0, 1280, 16), rect(0, 784, 1280, 16), rect(0, 0, 16, 800), rect(1264, 0, 16, 800),
    // West wall of the hall, with a lobby door (y 180-260) and an office door (y 560-640).
    rect(400, 16, 16, 164), rect(400, 260, 16, 300), rect(400, 640, 16, 144),
    // Lobby / office divider, door at x 160-240.
    rect(16, 400, 144, 16), rect(240, 400, 160, 16),
    // The hall counter: a long low wall with a pass at each end.
    rect(480, 392, 320, 16, 'counter'),
    // Vault wing wall, door at y 340-420.
    rect(880, 16, 16, 324), rect(880, 420, 16, 364),
    // The vault's own wall, its door at y 340-420.
    rect(1050, 16, 16, 324), rect(1050, 420, 16, 364),
  ];
}

export function buildCover() {
  return [
    // Lobby desks and a crate to slip behind.
    rect(120, 150, 120, 36, 'desk'), rect(120, 262, 120, 36, 'desk'), rect(262, 180, 44, 44, 'crate'),
    // Security office desks and a records divider.
    rect(70, 520, 120, 40, 'desk'), rect(70, 650, 120, 40, 'desk'), rect(250, 520, 40, 130, 'crate'),
    // Grand hall desks and crates, north and south of the counter.
    rect(520, 180, 150, 44, 'desk'), rect(520, 570, 150, 44, 'desk'),
    rect(706, 320, 54, 54, 'crate'), rect(706, 440, 54, 54, 'crate'),
    // Vault wing crates.
    rect(936, 190, 50, 50, 'crate'), rect(936, 540, 50, 50, 'crate'),
    // Inside the vault: two bullion carts.
    rect(1096, 170, 64, 38, 'cart'), rect(1180, 566, 64, 38, 'cart'),
  ];
}

export function buildLoot() {
  const item = (x, y, name, value, kind) => ({ x, y, name, value, kind, taken: false, r: 12 });
  return [
    item(300, 140, 'Coin Stack', 150, 'coins'),
    item(140, 66, 'Lobby Painting', 300, 'gem'),
    item(130, 600, 'Bond Folder', 250, 'gem'),
    item(300, 716, 'Cash Drawer', 200, 'coins'),
    item(595, 150, 'Gold Watch', 350, 'gem'),
    item(595, 640, 'Jewel Case', 400, 'gem'),
    item(648, 350, 'Coin Stack', 150, 'coins'),
    item(1010, 215, 'Gold Bars', 600, 'bars'),
    item(1010, 565, 'Gold Bars', 600, 'bars'),
    item(1210, 140, 'Ruby Necklace', 500, 'gem'),
    item(1128, 585, 'Emerald Ring', 450, 'gem'),
    item(1157, 384, 'Sunfire Diamond', 1500, 'diamond'),
  ];
}

export function buildGuardPatrols() {
  const guard = (waypoints, speed, pause) => ({ waypoints, speed, pause });
  return [
    // The lobby loop.
    guard([[70, 90], [340, 90], [340, 340], [70, 340]], 60, 1.1),
    // The grand hall perimeter.
    guard([[470, 110], [830, 110], [830, 700], [470, 700]], 66, 1.4),
    // The vault wing, back and forth past the vault door.
    guard([[950, 300], [1200, 300], [1200, 470], [950, 470]], 58, 1.0),
  ];
}

export function buildCameras() {
  const camera = (x, y, baseAngle, sweepAmp, period, phase) => ({ x, y, baseAngle, sweepAmp, period, phase });
  return [
    camera(392, 44, 2.25, 0.8, 9, 0), // lobby, from the hall wall
    camera(640, 26, Math.PI / 2, 0.95, 11, 1.7), // grand hall, from the ceiling
    camera(36, 436, 0.9, 0.7, 10, 3.9), // security office corner
    camera(1042, 330, Math.PI, 0.65, 8, 0.8), // watching the vault door
    camera(1252, 44, 2.35, 0.6, 9.5, 5.1), // inside the vault, over the diamond
  ];
}

export const PLAYER_START = { x: 60, y: 672 };
export const EXIT_ZONE = { x: 16, y: 616, w: 30, h: 104 };

/** Every rectangle that stops a body or a sight line. */
export function blockers(level) {
  return level.walls.concat(level.cover);
}

/** Does a circle at (x, y) overlap any blocker? */
export function circleHitsBlockers(level, x, y, r) {
  const solids = blockers(level);
  for (let i = 0; i < solids.length; i += 1) {
    const b = solids[i];
    const nearX = Math.max(b.x, Math.min(x, b.x + b.w));
    const nearY = Math.max(b.y, Math.min(y, b.y + b.h));
    const dx = x - nearX;
    const dy = y - nearY;
    if (dx * dx + dy * dy < r * r) return true;
  }
  return false;
}

/**
 * Move a circle by (dx, dy), one axis at a time so it slides along walls
 * instead of sticking to them. Mutates and returns the entity.
 */
export function slideMove(level, entity, dx, dy) {
  if (dx !== 0 && !circleHitsBlockers(level, entity.x + dx, entity.y, entity.r)) entity.x += dx;
  if (dy !== 0 && !circleHitsBlockers(level, entity.x, entity.y + dy, entity.r)) entity.y += dy;
  return entity;
}
