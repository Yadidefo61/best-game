// Bootstrap for Emberlight Arena: canvas setup, the fixed-timestep loop,
// and the ?shot= staging used to take the entry's screenshots. In normal
// play the loop runs at a fixed 1/60s step; in shot mode one scene is
// staged, drawn once, and window.__shotReady tells the screenshot tool
// the frame is final.
import { STEP } from './config.js';
import { createGame, drawGameState, stepGame } from './game.js';
import { attachInput, createInput } from './input.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');
const state = createGame();
const input = createInput();
// Exposed for local play-testing only (read the screen and score back).
window.__emberlight = state;

function scaleOf() {
  return canvas.getBoundingClientRect().width / 1280;
}

attachInput(input, canvas, scaleOf);

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number(params.get('seed'));
if (Number.isFinite(seedParam) && seedParam > 0) state.seed = seedParam;

if (shot) {
  state.sound.silent = true;
  const staged = stageShot(shot, state);
  drawGameState(ctx, state);
  if (status) status.textContent = `Emberlight Arena, ${staged.screen} screen. Score ${state.score}.`;
  window.__shotReady = true;
} else {
  let last = performance.now();
  let accumulator = 0;
  let lastScreen = state.screen;
  const announce = {
    title: 'Emberlight Arena. Title screen. Press Enter to play.',
    play: 'Playing. Wave 1.',
    upgrade: 'Wave cleared. Choose an upgrade.',
    pause: 'Paused.',
    over: 'Game over.',
    win: 'Victory. The light holds.',
  };
  function frame(now) {
    const elapsed = Math.min(0.25, (now - last) / 1000);
    last = now;
    accumulator += elapsed;
    let steps = 0;
    while (accumulator >= STEP && steps < 5) {
      stepGame(state, input, STEP);
      accumulator -= STEP;
      steps += 1;
    }
    if (steps === 5) accumulator = 0;
    drawGameState(ctx, state);
    if (state.screen !== lastScreen) {
      lastScreen = state.screen;
      if (status) status.textContent = announce[state.screen] || '';
    }
    input.beginFrame();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
