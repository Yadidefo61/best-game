// Emberlight Arena: the game object. One state holds the screen, the
// keeper, every entity and the run's score; step() advances it one fixed
// 1/60s tick from the input of that tick, and draw() paints it. The
// screens are title -> play -> (upgrade draft between waves) -> play ...
// -> win after wave 10, or over when the keeper's health reaches zero.
import { SHOT_SEED, STEP, VIEW_HEIGHT, VIEW_WIDTH } from './config.js';
import { makeRng, rand } from './rng.js';
import { createSoundBank } from './audio.js';
import { createPlayer, resetPlayer, updatePlayer } from './player.js';
import { updateEnemies } from './enemies.js';
import { resolveBodyCollisions, updateBullets } from './projectiles.js';
import { updatePickups } from './pickups.js';
import { updateParticles } from './particles.js';
import { applyUpgradeChoice, maybeSpawnBoss, onWaveCleared, startWave, updateSpawning } from './waves.js';
import { createCombo, updateCombo } from './combo.js';
import { drawGame } from './render.js';

export { STEP };

function loadBest() {
  try {
    return Number(window.localStorage.getItem('emberlight-best') || 0) || 0;
  } catch {
    return 0;
  }
}

function saveBest(state) {
  try {
    window.localStorage.setItem('emberlight-best', String(state.best));
  } catch {
    // Best score is a nicety; losing it must never break the game.
  }
}

function initStars(state) {
  const rng = state.rng;
  state.stars = [];
  const colors = ['#ffb347', '#c77dff', '#7ef0c1', '#ffe9a3'];
  for (let i = 0; i < 70; i += 1) {
    state.stars.push({
      x: rand(rng, 20, VIEW_WIDTH - 20),
      y: rand(rng, 20, VIEW_HEIGHT - 20),
      r: rand(rng, 0.8, 2.6),
      color: colors[Math.floor(rng() * colors.length)],
      tw: rand(rng, 0.5, 2),
      phase: rand(rng, 0, Math.PI * 2),
    });
  }
}

export function createGame() {
  const state = {
    screen: 'title',
    time: 0,
    wave: 0,
    score: 0,
    kills: 0,
    best: loadBest(),
    player: createPlayer(),
    enemies: [],
    bullets: [],
    enemyBullets: [],
    pickups: [],
    particles: [],
    texts: [],
    spawnQueue: [],
    spawnTimer: 0,
    waveState: 'idle',
    bossPending: false,
    combo: createCombo(),
    upgradeChoices: [],
    upgradeRects: [],
    banner: '',
    bannerTimer: 0,
    shake: 0,
    flash: 0,
    rng: makeRng(SHOT_SEED),
    stars: [],
    sound: createSoundBank(),
    seed: SHOT_SEED,
  };
  initStars(state);
  return state;
}

export function resetGame(state, seed) {
  state.seed = seed;
  state.rng = makeRng(seed);
  state.screen = 'title';
  state.time = 0;
  state.wave = 0;
  state.score = 0;
  state.kills = 0;
  state.enemies = [];
  state.bullets = [];
  state.enemyBullets = [];
  state.pickups = [];
  state.particles = [];
  state.texts = [];
  state.spawnQueue = [];
  state.spawnTimer = 0;
  state.waveState = 'idle';
  state.bossPending = false;
  state.combo = createCombo();
  state.upgradeChoices = [];
  state.upgradeRects = [];
  state.banner = '';
  state.bannerTimer = 0;
  state.shake = 0;
  state.flash = 0;
  resetPlayer(state.player);
  initStars(state);
}

export function startGame(state) {
  resetGame(state, state.seed);
  state.screen = 'play';
  startWave(state, 1);
}

function endRun(state, won) {
  state.screen = won ? 'win' : 'over';
  state.best = Math.max(state.best, state.score);
  saveBest(state);
}

export function stepGame(state, input, dt) {
  state.time += dt;
  if (state.bannerTimer > 0) state.bannerTimer -= dt;

  if (input.pressed('KeyM')) {
    state.sound.muted = !state.sound.muted;
    if (!state.sound.muted) state.sound.ensure();
  }

  if (state.screen === 'title') {
    updateParticles(state, dt);
    if (input.pressed('Enter') || input.pressed('Space') || input.clicked) {
      state.sound.ensure();
      startGame(state);
    }
    return;
  }

  if (state.screen === 'pause') {
    if (input.pressed('KeyP') || input.pressed('Escape') || input.clicked) {
      state.screen = 'play';
    }
    return;
  }

  if (state.screen === 'upgrade') {
    if (input.pressed('Digit1')) applyUpgradeChoice(state, 0);
    else if (input.pressed('Digit2')) applyUpgradeChoice(state, 1);
    else if (input.pressed('Digit3')) applyUpgradeChoice(state, 2);
    else if (input.clicked) {
      for (let i = 0; i < state.upgradeRects.length; i += 1) {
        const r = state.upgradeRects[i];
        if (input.clickX >= r.x && input.clickX <= r.x + r.w && input.clickY >= r.y && input.clickY <= r.y + r.h) {
          applyUpgradeChoice(state, i);
          break;
        }
      }
    }
    updateParticles(state, dt);
    return;
  }

  if (state.screen === 'over' || state.screen === 'win') {
    updateParticles(state, dt);
    if (input.pressed('Enter') || input.pressed('Space') || input.clicked) {
      startGame(state);
    }
    return;
  }

  // Screen is 'play'.
  if (input.pressed('KeyP') || input.pressed('Escape')) {
    state.screen = 'pause';
    return;
  }

  updatePlayer(state, input, dt);
  updateEnemies(state, dt);
  updateSpawning(state, dt);
  updateBullets(state, dt);
  resolveBodyCollisions(state);
  updatePickups(state, dt);
  updateParticles(state, dt);
  updateCombo(state, dt);

  if (state.player.hp <= 0) {
    state.player.hp = 0;
    state.sound.gameOver();
    endRun(state, false);
    return;
  }
  if (state.waveState === 'fighting' && state.spawnQueue.length === 0 && state.enemies.length === 0) {
    if (!maybeSpawnBoss(state)) onWaveCleared(state);
  }
}

export function drawGameState(ctx, state) {
  drawGame(ctx, state);
}
