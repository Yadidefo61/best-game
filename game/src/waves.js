// Waves and the upgrade draft: what a wave fields, how it trickles in,
// and the three upgrade cards the keeper chooses from between waves.
// Clearing wave 10 wins the game; clearing any earlier wave opens the draft.
import { UPGRADES, WIN_WAVE, waveComposition } from './config.js';
import { shuffle } from './rng.js';
import { spawnEnemy } from './enemies.js';
import { spawnBoss } from './boss.js';
import { addText } from './particles.js';

export function startWave(state, wave) {
  state.wave = wave;
  state.waveState = 'fighting';
  state.spawnQueue = [];
  for (const group of waveComposition(wave)) {
    for (let i = 0; i < group.count; i += 1) state.spawnQueue.push(group.kind);
  }
  state.spawnQueue = shuffle(state.rng, state.spawnQueue);
  state.spawnTimer = 0.4;
  state.banner = `WAVE ${wave}`;
  state.bannerTimer = 1.6;
  state.sound.waveStart();
  // Waves 5 and 10 end with a boss, held back until the wave is cleared.
  state.bossPending = wave === 5 || wave === WIN_WAVE;
  if (state.player.hasWard || state.player.ward) {
    state.player.hasWard = true;
  }
}

// When the arena is empty and the queue is spent, a pending boss walks
// in instead of the wave clearing. Returns true when a boss spawned.
export function maybeSpawnBoss(state) {
  if (!state.bossPending) return false;
  if (state.spawnQueue.length > 0 || state.enemies.length > 0) return false;
  state.bossPending = false;
  spawnBoss(state);
  return true;
}

// Trickle the queue into the arena, a few at a time so the wave builds
// instead of arriving all at once.
export function updateSpawning(state, dt) {
  if (state.waveState !== 'fighting' || state.spawnQueue.length === 0) return;
  state.spawnTimer -= dt;
  if (state.spawnTimer > 0) return;
  const batch = state.wave <= 2 ? 1 : 2;
  for (let i = 0; i < batch && state.spawnQueue.length > 0; i += 1) {
    spawnEnemy(state, state.spawnQueue.shift());
  }
  state.spawnTimer = state.wave <= 3 ? 0.55 : 0.42;
}

// Called when the arena is empty and the queue is spent.
export function onWaveCleared(state) {
  const bonus = 100 * state.wave;
  state.score += bonus;
  addText(state, state.player.x, state.player.y - 40, `WAVE BONUS +${bonus}`, '#ffe66d');
  state.sound.waveClear();
  if (state.wave >= WIN_WAVE) {
    state.screen = 'win';
    state.best = Math.max(state.best, state.score);
    state.sound.victory();
    return;
  }
  state.waveState = 'draft';
  state.screen = 'upgrade';
  state.upgradeChoices = shuffle(state.rng, UPGRADES.slice()).slice(0, 3);
  state.upgradeRects = [];
}

export function applyUpgradeChoice(state, index) {
  const choice = state.upgradeChoices[index];
  if (!choice) return;
  choice.apply(state.player);
  state.sound.upgrade();
  addText(state, state.player.x, state.player.y - 40, choice.name, '#7ef0c1');
  state.upgradeChoices = [];
  startWave(state, state.wave + 1);
  state.screen = 'play';
}
