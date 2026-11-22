// Sight, as geometry: who can see the thief, and the exact shape of each
// vision cone once the walls and the furniture have bitten pieces out of it.
// Everything here is segment-versus-rectangle work, no rendering, no state.

/** Smallest signed difference between two headings, in (-PI, PI]. */
export function angleDifference(a, b) {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** Does segment (x1,y1)-(x2,y2) cross rectangle b (touching an edge counts)? */
export function segmentHitsRect(x1, y1, x2, y2, b) {
  if (x1 >= b.x && x1 <= b.x + b.w && y1 >= b.y && y1 <= b.y + b.h) return true;
  if (x2 >= b.x && x2 <= b.x + b.w && y2 >= b.y && y2 <= b.y + b.h) return true;
  const edges = [
    [b.x, b.y, b.x + b.w, b.y],
    [b.x + b.w, b.y, b.x + b.w, b.y + b.h],
    [b.x + b.w, b.y + b.h, b.x, b.y + b.h],
    [b.x, b.y + b.h, b.x, b.y],
  ];
  for (let i = 0; i < edges.length; i += 1) {
    const e = edges[i];
    if (segmentsCross(x1, y1, x2, y2, e[0], e[1], e[2], e[3])) return true;
  }
  return false;
}

function segmentsCross(ax, ay, bx, by, cx, cy, dx, dy) {
  const d1 = direction(cx, cy, dx, dy, ax, ay);
  const d2 = direction(cx, cy, dx, dy, bx, by);
  const d3 = direction(ax, ay, bx, by, cx, cy);
  const d4 = direction(ax, ay, bx, by, dx, dy);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function direction(px, py, qx, qy, rx, ry) {
  return (qx - px) * (ry - py) - (qy - py) * (rx - px);
}

/** Is the straight line between two points free of every blocker? */
export function lineOfSightClear(x1, y1, x2, y2, solids) {
  for (let i = 0; i < solids.length; i += 1) {
    if (segmentHitsRect(x1, y1, x2, y2, solids[i])) return false;
  }
  return true;
}

/**
 * Can a watcher at (ox, oy), facing `angle`, see the point (tx, ty)?
 * In range, inside the cone, and with nothing solid in between.
 */
export function canSee(ox, oy, angle, halfAngle, range, tx, ty, solids) {
  const dx = tx - ox;
  const dy = ty - oy;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  if (dist > 1 && Math.abs(angleDifference(Math.atan2(dy, dx), angle)) > halfAngle) return false;
  return lineOfSightClear(ox, oy, tx, ty, solids);
}

/**
 * Distance a ray from (ox, oy) along `angle` travels before it meets a
 * blocker or runs out of range — the slab test against every rectangle.
 */
export function rayDistance(ox, oy, angle, range, solids) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  let best = range;
  for (let i = 0; i < solids.length; i += 1) {
    const b = solids[i];
    let tmin = 0;
    let tmax = best;
    if (Math.abs(dx) < 1e-9) {
      if (ox < b.x || ox > b.x + b.w) continue;
    } else {
      let t1 = (b.x - ox) / dx;
      let t2 = (b.x + b.w - ox) / dx;
      if (t1 > t2) { const swap = t1; t1 = t2; t2 = swap; }
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmax < tmin) continue;
    }
    if (Math.abs(dy) < 1e-9) {
      if (oy < b.y || oy > b.y + b.h) continue;
    } else {
      let t1 = (b.y - oy) / dy;
      let t2 = (b.y + b.h - oy) / dy;
      if (t1 > t2) { const swap = t1; t1 = t2; t2 = swap; }
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmax < tmin) continue;
    }
    if (tmin > 0 && tmin < best) best = tmin;
  }
  return best;
}

/**
 * The visible shape of a cone: a fan of rays from edge to edge, each stopped
 * by the first thing it hits. Returns the polygon points, watcher first.
 */
export function conePolygon(ox, oy, angle, halfAngle, range, solids) {
  const steps = 40;
  const points = [[ox, oy]];
  for (let i = 0; i <= steps; i += 1) {
    const a = angle - halfAngle + (2 * halfAngle * i) / steps;
    const d = rayDistance(ox, oy, a, range, solids);
    points.push([ox + Math.cos(a) * d, oy + Math.sin(a) * d]);
  }
  return points;
}
