// Kill chains: every kill feeds a combo that multiplies the score.
// The chain lasts as long as the keeper keeps killing inside the combo
// window; every five chained kills raise the multiplier half a step, up
// to the cap. Taking a hit breaks the chain.
import { addText } from './particles.js';

export function createCombo() {
  return { count: 0, timer: 0, mult: 1 };
}

export function comboMultiplier(state) {
  return state.combo.mult;
}

// Score one kill: advance the chain and return the multiplied score.
export function registerKill(state, baseScore) {
  const c = state.combo;
  c.count += 1;
  c.timer = state.player.comboWindow;
  const step = Math.floor(c.count / 5);
  const next = Math.min(state.player.comboCap, 1 + step * 0.5);
  if (next > c.mult) {
    c.mult = next;
    addText(state, state.player.x, state.player.y - 52, `COMBO x${c.mult.toFixed(1)}!`, '#ffb347');
    state.sound.comboUp();
  }
  return Math.round(baseScore * c.mult);
}

// Let the chain's window run down; a lapsed window drops the multiplier.
export function updateCombo(state, dt) {
  const c = state.combo;
  if (c.timer > 0) {
    c.timer -= dt;
    if (c.timer <= 0) {
      c.count = 0;
      c.mult = 1;
    }
  }
}

export function breakCombo(state) {
  const c = state.combo;
  if (c.count >= 5) {
    addText(state, state.player.x, state.player.y - 52, 'COMBO LOST', '#ff5964');
  }
  c.count = 0;
  c.timer = 0;
  c.mult = 1;
}
