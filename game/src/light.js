// The lantern's light: the arena's core mechanic. The keeper carries a
// circle of light; inside it enemies are slowed and seared, outside it
// the dark presses in. The radius grows with Wide Wick, shrinks when the
// keeper is badly hurt, and the darkness thickens as the waves climb.
import { LIGHT_BASE_RADIUS, LIGHT_LOW_HP_RADIUS, LIGHT_SEAR, LIGHT_SLOW } from './config.js';

export function lightRadius(state) {
  const p = state.player;
  let r = p.lightRadius;
  if (p.hp < p.maxHp * 0.35) {
    r = Math.min(r, LIGHT_LOW_HP_RADIUS * (p.lightRadius / LIGHT_BASE_RADIUS));
  }
  return r;
}

// How dark the arena is outside the light, 0 to about 0.6.
export function darknessLevel(state) {
  const wavePart = 0.22 + state.wave * 0.03;
  const hpPart = state.player.hp < state.player.maxHp * 0.35 ? 0.12 : 0;
  return Math.min(0.62, wavePart + hpPart);
}

export function inLight(state, x, y) {
  const dx = x - state.player.x;
  const dy = y - state.player.y;
  const r = lightRadius(state);
  return dx * dx + dy * dy <= r * r;
}

// Speed multiplier for an enemy at its position: slowed inside the light.
export function lightSlow(state, enemy) {
  return inLight(state, enemy.x, enemy.y) ? LIGHT_SLOW : 1;
}

// Damage multiplier for a hit on an enemy at its position: seared
// inside the light, more so with the Searing Light blessing.
export function searMult(state, enemy) {
  if (!inLight(state, enemy.x, enemy.y)) return 1;
  return LIGHT_SEAR * (1 + state.player.lightDamageBonus);
}

// A small breathing flicker for the light's edge, time-based only so
// staged scenes stay deterministic.
export function lightFlicker(state) {
  return 1 + Math.sin(state.time * 7.3) * 0.03 + Math.sin(state.time * 13.7) * 0.02;
}
