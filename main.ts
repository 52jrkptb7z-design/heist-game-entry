// Midnight Vault — hand-in program (Node 22, standard library only).
//
// The game itself is the static site in game/ (open game/index.html in a desktop
// browser, no build step, no network). This program is only the courier: it
// copies game/ and screenshots/ into the output directory and writes the
// dossier the judge reads, using the kit's own vendored library so the bytes
// match what the gate rebuilds on its side.
//
// Run it the way the kit describes:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// MAKEFUN_OUTPUT_DIR stands in for /output outside the grader's container.

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The gate's caps, mirrored so a local run refuses anything the scorer would.
const GATE_CAPS = {
  text_max_bytes: 163_840,
  screenshots: { max: 4, max_bytes: 262_144 },
  game_max_files: 993,
  game_max_bytes: 50_331_648,
  game_path_max_bytes: 1_000,
};

function copyTree(from: string, to: string): void {
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}

copyTree(join(repoRoot, 'game'), join(outputDir, 'game'));

const shotsDir = join(repoRoot, 'screenshots');
if (existsSync(shotsDir)) {
  copyTree(shotsDir, join(outputDir, 'screenshots'));
} else {
  mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
}

const dossier = buildDossier(outputDir, GATE_CAPS);
writeFileSync(join(outputDir, 'dossier.json'), dossier);

const shotCount = existsSync(join(outputDir, 'screenshots'))
  ? readdirSync(join(outputDir, 'screenshots')).length
  : 0;
console.log(`Midnight Vault handed in: ${shotCount} screenshots, dossier ${dossier.length} bytes -> ${outputDir}`);
