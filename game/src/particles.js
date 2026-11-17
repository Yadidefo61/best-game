// Particles, floating score text and screen shake: the feedback layer.
// Every burst is spawned from the seeded RNG so replays stay identical,
// and every particle fades out on its own life clock.
import { rand } from './rng.js';

export function burst(state, x, y, color, count, speed) {
  const rng = state.rng;
  for (let i = 0; i < count; i += 1) {
    const angle = rand(rng, 0, Math.PI * 2);
    const spd = rand(rng, speed * 0.3, speed);
    state.particles.push({
      kind: 'dot',
      x,
      y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      life: rand(rng, 0.25, 0.6),
      maxLife: 0.6,
      radius: rand(rng, 2, 4.5),
      color,
      size: 0,
    });
  }
}

export function ringBurst(state, x, y, color) {
  state.particles.push({
    kind: 'ring', x, y, vx: 0, vy: 0, life: 0.35, maxLife: 0.35,
    radius: 10, color, size: 3,
  });
}

export function addText(state, x, y, text, color) {
  state.texts.push({ x, y, text, color, life: 0.9, maxLife: 0.9 });
}

export function updateParticles(state, dt) {
  for (let i = state.particles.length - 1; i >= 0; i -= 1) {
    const pt = state.particles[i];
    pt.life -= dt;
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.vx *= 0.92;
    pt.vy *= 0.92;
    if (pt.kind === 'ring') pt.radius += 260 * dt;
    if (pt.life <= 0) state.particles.splice(i, 1);
  }
  for (let i = state.texts.length - 1; i >= 0; i -= 1) {
    const t = state.texts[i];
    t.life -= dt;
    t.y -= 34 * dt;
    if (t.life <= 0) state.texts.splice(i, 1);
  }
  state.shake *= 0.86;
  if (state.shake < 0.2) state.shake = 0;
  state.flash *= 0.86;
  if (state.flash < 0.02) state.flash = 0;
}
