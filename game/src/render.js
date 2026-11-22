// Every pixel of Midnight Vault. The draw order is the trick: floors and
// room names first, then the loot, the furniture, the vision cones (already
// clipped by the walls, so they pool on the floor and stop at cover), the
// walls themselves, and finally the people. The HUD lives in its own band
// above the world, and the title / busted / getaway screens veil the lot.

import { CAMERA, GUARD, HUD_HEIGHT, WORLD } from './config.js';
import { EXIT_ZONE, ROOMS, blockers } from './level.js';
import { alarmMood } from './alarm.js';
import { conePolygon } from './vision.js';

function drawText(ctx, str, x, y, font, color, align = 'left') {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function fillRect(ctx, r, color) {
  ctx.fillStyle = color;
  ctx.fillRect(r.x, r.y, r.w, r.h);
}

function drawFloor(ctx, state) {
  ctx.fillStyle = '#171a21';
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  for (let i = 0; i < ROOMS.length; i += 1) {
    const room = ROOMS[i];
    ctx.fillStyle = room.tint;
    ctx.fillRect(room.x, room.y, room.w, room.h);
    drawText(ctx, room.label, room.labelX, room.labelY, '600 15px system-ui, sans-serif', 'rgba(255,255,255,0.13)', 'center');
  }
  // A faint carpet grid so movement reads against the floor.
  ctx.fillStyle = 'rgba(255,255,255,0.025)';
  for (let x = 32; x < WORLD.width; x += 32) {
    for (let y = 32; y < WORLD.height; y += 32) ctx.fillRect(x, y, 2, 2);
  }
}

function drawExit(ctx, state) {
  const z = EXIT_ZONE;
  ctx.fillStyle = '#0d2b1d';
  ctx.fillRect(z.x, z.y, z.w + 16, z.h);
  ctx.strokeStyle = '#2fbf71';
  ctx.lineWidth = 2;
  ctx.strokeRect(z.x + 2, z.y + 2, z.w + 12, z.h - 4);
  ctx.save();
  ctx.translate(z.x + 22, z.y + z.h / 2);
  ctx.rotate(-Math.PI / 2);
  const label = state.player.loot > 0 ? 'GETAWAY VAN — GO!' : 'GETAWAY VAN';
  drawText(ctx, label, 0, 0, '700 13px system-ui, sans-serif', '#2fbf71', 'center');
  ctx.restore();
}

function drawCoverPiece(ctx, piece) {
  if (piece.kind === 'desk') {
    fillRect(ctx, piece, '#5b4128');
    ctx.fillStyle = '#77572f';
    ctx.fillRect(piece.x + 3, piece.y + 3, piece.w - 6, piece.h - 6);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(piece.x + 3, piece.y + piece.h / 2 - 1, piece.w - 6, 2);
  } else if (piece.kind === 'cart') {
    fillRect(ctx, piece, '#4a4232');
    ctx.fillStyle = '#c9a227';
    ctx.fillRect(piece.x + 5, piece.y + 6, piece.w - 10, 8);
    ctx.fillRect(piece.x + 5, piece.y + 20, piece.w - 10, 8);
  } else {
    fillRect(ctx, piece, '#3d4a3a');
    ctx.strokeStyle = '#5a6e55';
    ctx.lineWidth = 3;
    ctx.strokeRect(piece.x + 2, piece.y + 2, piece.w - 4, piece.h - 4);
    ctx.beginPath();
    ctx.moveTo(piece.x + 4, piece.y + 4);
    ctx.lineTo(piece.x + piece.w - 4, piece.y + piece.h - 4);
    ctx.moveTo(piece.x + piece.w - 4, piece.y + 4);
    ctx.lineTo(piece.x + 4, piece.y + piece.h - 4);
    ctx.stroke();
  }
}

function drawLootItem(ctx, state, item) {
  if (item.taken) return;
  const pulse = 0.75 + 0.25 * Math.sin(state.time * 3 + item.x);
  if (item.kind === 'diamond') {
    // The pedestal the Sunfire Diamond sits on.
    ctx.fillStyle = '#3a3f4a';
    ctx.fillRect(item.x - 24, item.y - 16, 48, 32);
    ctx.strokeStyle = '#596273';
    ctx.lineWidth = 2;
    ctx.strokeRect(item.x - 24, item.y - 16, 48, 32);
  }
  const glow = ctx.createRadialGradient(item.x, item.y, 2, item.x, item.y, 26);
  glow.addColorStop(0, `rgba(255, 215, 90, ${0.35 * pulse})`);
  glow.addColorStop(1, 'rgba(255, 215, 90, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(item.x - 26, item.y - 26, 52, 52);

  ctx.save();
  ctx.translate(item.x, item.y);
  if (item.kind === 'coins') {
    ctx.fillStyle = '#d9a521';
    for (let row = 0; row < 3; row += 1) {
      ctx.beginPath();
      ctx.ellipse(0, 6 - row * 5, 10 - row, 3.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#f4cd5a';
    ctx.beginPath();
    ctx.ellipse(0, -4, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (item.kind === 'bars') {
    ctx.fillStyle = '#c9a227';
    ctx.fillRect(-13, 0, 26, 8);
    ctx.fillStyle = '#e3bc3f';
    ctx.fillRect(-9, -8, 18, 8);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(-9, -8, 18, 2);
  } else if (item.kind === 'diamond') {
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#b8f1fc';
    ctx.fillRect(-10, -10, 20, 20);
    ctx.strokeStyle = '#e8fbff';
    ctx.lineWidth = 2;
    ctx.strokeRect(-10, -10, 20, 20);
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(10, 0);
    ctx.moveTo(0, -10);
    ctx.lineTo(0, 10);
    ctx.stroke();
  } else {
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#c084fc';
    ctx.fillRect(-7, -7, 14, 14);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(-7, -7, 6, 6);
  }
  ctx.restore();

  // A four-point glint, breathing with the pulse.
  ctx.strokeStyle = `rgba(255, 240, 180, ${0.8 * pulse})`;
  ctx.lineWidth = 1.6;
  const s = 5 + 2 * pulse;
  ctx.beginPath();
  ctx.moveTo(item.x - s, item.y - 14);
  ctx.lineTo(item.x + s, item.y - 14);
  ctx.moveTo(item.x, item.y - 14 - s);
  ctx.lineTo(item.x, item.y - 14 + s);
  ctx.stroke();
}

function drawCone(ctx, points, color) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawCones(ctx, state) {
  const solids = blockers(state.level);
  for (let i = 0; i < state.guards.length; i += 1) {
    const g = state.guards[i];
    const color = g.sees ? 'rgba(255, 70, 50, 0.30)' : 'rgba(255, 176, 66, 0.17)';
    drawCone(ctx, conePolygon(g.x, g.y, g.angle, GUARD.visionHalfAngle, GUARD.visionRange, solids), color);
  }
  const down = state.cameraDownT > 0;
  for (let i = 0; i < state.cameras.length; i += 1) {
    const c = state.cameras[i];
    if (down) continue; // a blind camera throws no cone at all
    const color = c.sees ? 'rgba(255, 70, 50, 0.30)' : 'rgba(64, 200, 255, 0.13)';
    drawCone(ctx, conePolygon(c.x, c.y, c.angle, CAMERA.visionHalfAngle, CAMERA.visionRange, solids), color);
  }
}

function drawWalls(ctx, state) {
  for (let i = 0; i < state.level.walls.length; i += 1) {
    const w = state.level.walls[i];
    if (w.kind === 'counter') {
      fillRect(ctx, w, '#4c4438');
      ctx.fillStyle = '#6b5f49';
      ctx.fillRect(w.x, w.y, w.w, 4);
    } else {
      fillRect(ctx, w, '#39404e');
      ctx.fillStyle = '#59637a';
      ctx.fillRect(w.x, w.y, w.w, 3);
    }
  }
  // The vault door gets its gold trim, open or not.
  ctx.fillStyle = '#c9a227';
  ctx.fillRect(1050, 336, 16, 6);
  ctx.fillRect(1050, 418, 16, 6);
}

function drawCamera(ctx, state, cam) {
  const down = state.cameraDownT > 0;
  ctx.save();
  ctx.translate(cam.x, cam.y);
  ctx.fillStyle = '#20242c';
  ctx.fillRect(-8, -8, 16, 16);
  ctx.rotate(cam.angle);
  ctx.fillStyle = down ? '#565d68' : '#2e3542';
  ctx.fillRect(-4, -6, 18, 12);
  ctx.fillStyle = down ? '#3a3f47' : '#67e8f9';
  ctx.beginPath();
  ctx.arc(15, 0, 3.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = down ? '#6b7280' : cam.sees ? '#ff3b30' : '#ff5147';
  ctx.beginPath();
  ctx.arc(cam.x + 6, cam.y - 6, 2.4, 0, Math.PI * 2);
  ctx.fill();
}

function drawGuard(ctx, state, guard) {
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(guard.x, guard.y + 10, 13, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#274690';
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, guard.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8c39e';
  ctx.beginPath();
  ctx.arc(guard.x, guard.y - 2, 7.5, 0, Math.PI * 2);
  ctx.fill();
  // The cap, with its brim pointing the way he looks.
  const bx = Math.cos(guard.angle);
  const by = Math.sin(guard.angle);
  ctx.fillStyle = '#16295c';
  ctx.beginPath();
  ctx.arc(guard.x, guard.y - 3, 8, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(guard.x + bx * 4 - 2, guard.y - 3 + by * 4 - 2, 10, 4);
  if (guard.sees) {
    ctx.fillStyle = '#ff3b30';
    ctx.beginPath();
    ctx.arc(guard.x + 12, guard.y - 22, 9, 0, Math.PI * 2);
    ctx.fill();
    drawText(ctx, '!', guard.x + 12, guard.y - 21, '800 13px system-ui, sans-serif', '#ffffff', 'center');
  }
}

function drawPlayer(ctx, state) {
  const p = state.player;
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 10, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // The loot sack rides on his back and swells with the take.
  const sackR = 5 + Math.min(6, p.lootCount * 0.8);
  ctx.fillStyle = '#7c5a2e';
  ctx.beginPath();
  ctx.arc(p.x - Math.cos(p.angle) * 13, p.y - Math.sin(p.angle) * 13 + 2, sackR, 0, Math.PI * 2);
  ctx.fill();
  // Cloak and hood: a dark teal figure, quieter colours while sneaking.
  ctx.fillStyle = p.sneaking ? '#0b3f3a' : '#0f766e';
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#083f3a';
  ctx.beginPath();
  ctx.arc(p.x + Math.cos(p.angle) * 3, p.y + Math.sin(p.angle) * 3, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8c39e';
  ctx.beginPath();
  ctx.arc(p.x + Math.cos(p.angle) * 5.5, p.y + Math.sin(p.angle) * 5.5, 3.6, 0, Math.PI * 2);
  ctx.fill();
  if (state.spotted) {
    drawText(ctx, 'SPOTTED', p.x, p.y - 26, '800 11px system-ui, sans-serif', '#ff5147', 'center');
  }
}

function drawHud(ctx, state) {
  ctx.fillStyle = '#0b0d12';
  ctx.fillRect(0, 0, WORLD.width, HUD_HEIGHT);
  ctx.fillStyle = '#1e2531';
  ctx.fillRect(0, HUD_HEIGHT - 2, WORLD.width, 2);

  // The alarm meter, the loudest thing on the band.
  const mood = alarmMood(state.alarm.value);
  const meterColor = mood === 'critical' ? '#ff3b30' : mood === 'rising' ? '#ff9500' : mood === 'warm' ? '#ffd60a' : '#2fbf71';
  drawText(ctx, 'ALARM', 24, HUD_HEIGHT / 2, '800 15px system-ui, sans-serif', '#e8eaf0');
  ctx.fillStyle = '#232a36';
  ctx.fillRect(96, HUD_HEIGHT / 2 - 10, 320, 20);
  ctx.fillStyle = meterColor;
  ctx.fillRect(96, HUD_HEIGHT / 2 - 10, (320 * state.alarm.value) / 100, 20);
  ctx.strokeStyle = '#3a4356';
  ctx.strokeRect(96, HUD_HEIGHT / 2 - 10, 320, 20);
  drawText(ctx, `${Math.floor(state.alarm.value)}`, 430, HUD_HEIGHT / 2, '700 14px system-ui, sans-serif', meterColor);

  drawText(ctx, `LOOT  $${state.player.loot}`, 500, HUD_HEIGHT / 2, '800 17px system-ui, sans-serif', '#f4cd5a');

  // EMP charges as little lightning pips.
  drawText(ctx, 'EMP', 700, HUD_HEIGHT / 2, '800 15px system-ui, sans-serif', '#e8eaf0');
  for (let i = 0; i < 3; i += 1) {
    ctx.fillStyle = i < state.player.emps ? '#67e8f9' : '#2a2f3a';
    ctx.beginPath();
    const cx = 748 + i * 20;
    ctx.moveTo(cx + 4, HUD_HEIGHT / 2 - 10);
    ctx.lineTo(cx - 3, HUD_HEIGHT / 2 + 1);
    ctx.lineTo(cx + 1, HUD_HEIGHT / 2 + 1);
    ctx.lineTo(cx - 3, HUD_HEIGHT / 2 + 10);
    ctx.lineTo(cx + 7, HUD_HEIGHT / 2 - 2);
    ctx.lineTo(cx + 3, HUD_HEIGHT / 2 - 2);
    ctx.closePath();
    ctx.fill();
  }
  if (state.cameraDownT > 0) {
    drawText(ctx, `CAMERAS DOWN ${state.cameraDownT.toFixed(0)}s`, 830, HUD_HEIGHT / 2, '700 13px system-ui, sans-serif', '#67e8f9');
  }

  const mm = String(Math.floor(state.runTime / 60)).padStart(2, '0');
  const ss = String(Math.floor(state.runTime % 60)).padStart(2, '0');
  drawText(ctx, `${mm}:${ss}`, 1010, HUD_HEIGHT / 2, '800 17px system-ui, sans-serif', '#e8eaf0', 'center');

  const diamond = state.lootItems.find((item) => item.kind === 'diamond');
  const objective = diamond && !diamond.taken ? 'TARGET: THE SUNFIRE DIAMOND' : 'NOW GET TO THE VAN';
  drawText(ctx, objective, 1256, HUD_HEIGHT / 2, '700 13px system-ui, sans-serif', '#9fb4d8', 'right');
}

function drawToast(ctx, state) {
  if (!state.toast) return;
  const alpha = Math.min(1, state.toast.t);
  ctx.fillStyle = `rgba(8, 10, 14, ${0.75 * alpha})`;
  const w = 300;
  ctx.fillRect(WORLD.width / 2 - w / 2, 18, w, 34);
  drawText(ctx, state.toast.text, WORLD.width / 2, 35, '700 15px system-ui, sans-serif', `rgba(244, 205, 90, ${alpha})`, 'center');
}

function veil(ctx, color) {
  ctx.fillStyle = color;
  ctx.fillRect(0, -HUD_HEIGHT, WORLD.width, WORLD.height + HUD_HEIGHT);
}

function drawTitle(ctx, state) {
  veil(ctx, 'rgba(4, 6, 10, 0.66)');
  drawText(ctx, 'MIDNIGHT VAULT', WORLD.width / 2, 218, '900 64px system-ui, sans-serif', '#f4cd5a', 'center');
  drawText(ctx, 'One night at the Meridian Trust', WORLD.width / 2, 268, 'italic 22px Georgia, serif', '#dbe4f5', 'center');
  drawText(ctx, 'Cross the floor in the dark. Read the cones. Take the Sunfire Diamond.', WORLD.width / 2, 330, '17px system-ui, sans-serif', '#aeb9cc', 'center');
  drawText(ctx, 'Fill your bag on the way — but every second in a guard\'s cone feeds the alarm.', WORLD.width / 2, 358, '17px system-ui, sans-serif', '#aeb9cc', 'center');
  drawText(ctx, 'WASD / arrows / mouse — move      SHIFT — sneak      E — EMP (blinds cameras, makes noise)', WORLD.width / 2, 420, '700 16px system-ui, sans-serif', '#e8eaf0', 'center');
  drawText(ctx, 'Click or press Enter to begin', WORLD.width / 2, 486, '800 20px system-ui, sans-serif', '#2fbf71', 'center');
}

function drawCaught(ctx, state) {
  veil(ctx, 'rgba(30, 4, 4, 0.72)');
  drawText(ctx, 'BUSTED', WORLD.width / 2, 250, '900 64px system-ui, sans-serif', '#ff5147', 'center');
  drawText(ctx, 'The meter topped out and the vault door slammed behind you.', WORLD.width / 2, 312, '19px system-ui, sans-serif', '#f0d9d9', 'center');
  drawText(ctx, `You had $${state.player.loot} in the bag — the bank keeps it tonight.`, WORLD.width / 2, 366, '17px system-ui, sans-serif', '#c9a9a9', 'center');
  drawText(ctx, `Time inside: ${Math.floor(state.runTime)}s      Peak alarm: ${Math.floor(state.alarm.peak)}`, WORLD.width / 2, 398, '17px system-ui, sans-serif', '#c9a9a9', 'center');
  drawText(ctx, 'Press R to run the night again', WORLD.width / 2, 470, '800 20px system-ui, sans-serif', '#e8eaf0', 'center');
}

function drawWon(ctx, state) {
  const r = state.result;
  veil(ctx, 'rgba(3, 22, 12, 0.74)');
  drawText(ctx, 'CLEAN GETAWAY', WORLD.width / 2, 196, '900 56px system-ui, sans-serif', '#2fbf71', 'center');
  const lines = [
    [`Loot carried out`, `$${r.loot}`],
    [`Time penalty (${Math.floor(state.runTime)}s inside)`, `-$${r.timePenalty}`],
    [`Ghost bonus — meter never passed 55`, r.ghost > 0 ? `+$${r.ghost}` : '—'],
    [`SCORE`, `${r.total}`],
  ];
  lines.forEach(([label, value], i) => {
    const y = 268 + i * 40;
    const last = i === lines.length - 1;
    drawText(ctx, label, WORLD.width / 2 - 190, y, `${last ? '800' : '600'} 18px system-ui, sans-serif`, last ? '#f4cd5a' : '#dbe4f5');
    drawText(ctx, value, WORLD.width / 2 + 190, y, `${last ? '800' : '600'} 18px system-ui, sans-serif`, last ? '#f4cd5a' : '#dbe4f5', 'right');
  });
  drawText(ctx, `GRADE  ${r.grade}`, WORLD.width / 2, 470, '900 34px system-ui, sans-serif', '#f4cd5a', 'center');
  drawText(ctx, 'Press R to run the night again', WORLD.width / 2, 524, '800 18px system-ui, sans-serif', '#e8eaf0', 'center');
}

/** Draw the whole game: HUD band on top, the world beneath it. */
export function render(ctx, state) {
  ctx.save();
  ctx.translate(0, HUD_HEIGHT);
  drawFloor(ctx, state);
  drawExit(ctx, state);
  for (let i = 0; i < state.lootItems.length; i += 1) drawLootItem(ctx, state, state.lootItems[i]);
  for (let i = 0; i < state.level.cover.length; i += 1) drawCoverPiece(ctx, state.level.cover[i]);
  drawCones(ctx, state);
  drawWalls(ctx, state);
  for (let i = 0; i < state.cameras.length; i += 1) drawCamera(ctx, state, state.cameras[i]);
  for (let i = 0; i < state.guards.length; i += 1) drawGuard(ctx, state, state.guards[i]);
  drawPlayer(ctx, state);
  drawToast(ctx, state);
  if (state.screen === 'title') drawTitle(ctx, state);
  if (state.screen === 'caught') drawCaught(ctx, state);
  if (state.screen === 'won') drawWon(ctx, state);
  ctx.restore();
  drawHud(ctx, state);
}
