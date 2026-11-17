// Deterministic screenshot scenes behind ?shot=start|play|end. Each scene
// plays the real rules forward from a fresh world with a fixed seed,
// steered by a simple autopilot (keep a safe distance, shoot the nearest
// enemy, dash out of trouble), so the frame is what a short game really
// looks like and the same seed always gives the same frame. The 'end'
// scene fights well for a while, then stops shooting and walks into the
// dark, so it ends on a real game-over screen with a real score.
import { SHOT_SEED, STEP } from './config.js';
import { resetGame, startGame, stepGame } from './game.js';

function pilotInput() {
  const input = {
    keys: new Set(),
    justPressed: new Set(),
    mouseX: 640,
    mouseY: 360,
    mouseDown: false,
    clicked: false,
    clickX: 0,
    clickY: 0,
    vx: 0,
    vy: 0,
    down(code) { return this.keys.has(code); },
    pressed(code) { return this.justPressed.has(code); },
    moveVector() { return { x: this.vx, y: this.vy }; },
    beginFrame() { this.justPressed.clear(); this.clicked = false; },
  };
  return input;
}

function nearestEnemy(state) {
  let best = null;
  let bestDist = Infinity;
  for (const e of state.enemies) {
    const dx = e.x - state.player.x;
    const dy = e.y - state.player.y;
    const d = dx * dx + dy * dy;
    if (d < bestDist) {
      bestDist = d;
      best = e;
    }
  }
  return best;
}

// Fill the pilot input for one step. 'play' fights; 'end' walks into the
// nearest enemy without shooting, as a tired player would.
function decide(state, input, mode) {
  input.justPressed.clear();
  const p = state.player;
  const e = nearestEnemy(state);
  if (!e) {
    input.vx = 0;
    input.vy = 0;
    input.mouseX = 640;
    input.mouseY = 200;
    input.mouseDown = false;
    return;
  }
  const dx = e.x - p.x;
  const dy = e.y - p.y;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = dx / dist;
  const ny = dy / dist;
  input.mouseX = e.x + e.vx * 0.12;
  input.mouseY = e.y + e.vy * 0.12;
  if (mode === 'end') {
    input.vx = nx;
    input.vy = ny;
    input.mouseDown = false;
    return;
  }
  input.mouseDown = dist < 560;
  if (dist < 130) {
    input.vx = -nx;
    input.vy = -ny;
  } else if (dist > 280) {
    input.vx = nx;
    input.vy = ny;
  } else {
    const s = Math.sin(state.time * 2.1) >= 0 ? 1 : -1;
    input.vx = -ny * s;
    input.vy = nx * s;
  }
  if (dist < 80 && p.dashLeft <= 0) input.justPressed.add('Space');
}

function pressDigit(input, code) {
  input.justPressed.clear();
  input.justPressed.add(code);
}

// Set `state` to the named scene and return the screen it shows.
export function stageShot(name, state) {
  state.sound.silent = true;
  const input = pilotInput();
  resetGame(state, SHOT_SEED);
  startGame(state);

  if (name !== 'play' && name !== 'end' && name !== 'upgrade') {
    // Start scene (and any unknown name): a lively arena behind the title.
    for (let i = 0; i < 5 / STEP; i += 1) {
      if (state.screen !== 'play') break;
      decide(state, input, 'play');
      stepGame(state, input, STEP);
    }
    state.screen = 'title';
    return { screen: 'title', best: state.best };
  }

  if (name === 'upgrade') {
    // Fight until the first wave is cleared and the draft opens.
    for (let i = 0; i < 120 / STEP; i += 1) {
      if (state.screen === 'upgrade') break;
      if (state.screen === 'over' || state.screen === 'win') {
        startGame(state);
        continue;
      }
      decide(state, input, 'play');
      stepGame(state, input, STEP);
    }
    return { screen: state.screen, best: state.best };
  }

  if (name === 'play') {
    for (let i = 0; i < 20 / STEP; i += 1) {
      if (state.screen === 'over' || state.screen === 'win') {
        startGame(state);
        i = 0;
        continue;
      }
      if (state.screen === 'upgrade') {
        pressDigit(input, 'Digit2');
        stepGame(state, input, STEP);
        continue;
      }
      decide(state, input, 'play');
      stepGame(state, input, STEP);
    }
    if (state.screen === 'upgrade') {
      pressDigit(input, 'Digit2');
      stepGame(state, input, STEP);
      for (let i = 0; i < 30; i += 1) {
        decide(state, input, 'play');
        stepGame(state, input, STEP);
      }
    }
    return { screen: state.screen, best: state.best };
  }

  // End scene: fight well for 12 seconds, then stop shooting and walk in.
  for (let i = 0; i < 12 / STEP; i += 1) {
    if (state.screen !== 'play') break;
    decide(state, input, 'play');
    stepGame(state, input, STEP);
    if (state.screen === 'upgrade') {
      pressDigit(input, 'Digit2');
      stepGame(state, input, STEP);
    }
  }
  for (let i = 0; i < 300 / STEP; i += 1) {
    if (state.screen === 'over' || state.screen === 'win') break;
    if (state.screen === 'upgrade') {
      pressDigit(input, 'Digit2');
      stepGame(state, input, STEP);
      continue;
    }
    decide(state, input, 'end');
    stepGame(state, input, STEP);
  }
  if (state.screen !== 'over') {
    state.player.hp = 0;
    input.justPressed.clear();
    input.mouseDown = false;
    stepGame(state, input, STEP);
  }
  return { screen: state.screen, best: state.best };
}
