// Dropped pickups: heart shards mend the keeper, ember shards are score,
// and glass wards block one hit. Pickups drift, bob, and — once the
// keeper is close enough — fly to them under the magnet radius.
import { PICKUP_KINDS } from './config.js';
import { addText, burst } from './particles.js';

export function spawnPickup(state, x, y, kind) {
  state.pickups.push({
    kind,
    x: Math.max(60, Math.min(1220, x)),
    y: Math.max(60, Math.min(660, y)),
    vx: 0,
    vy: 0,
    radius: PICKUP_KINDS[kind].radius,
    color: PICKUP_KINDS[kind].color,
    life: 12,
    bob: 0,
  });
}

export function updatePickups(state, dt) {
  const p = state.player;
  for (let i = state.pickups.length - 1; i >= 0; i -= 1) {
    const pk = state.pickups[i];
    pk.life -= dt;
    pk.bob += dt * 4;
    const dx = p.x - pk.x;
    const dy = p.y - pk.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist < p.magnetRadius + 40) {
      const pull = 520 * (1 - dist / (p.magnetRadius + 60));
      pk.vx += (dx / dist) * pull * dt * 4;
      pk.vy += (dy / dist) * pull * dt * 4;
    }
    pk.vx *= 0.86;
    pk.vy *= 0.86;
    pk.x += pk.vx * dt;
    pk.y += pk.vy * dt;
    if (pk.life <= 0) {
      state.pickups.splice(i, 1);
      continue;
    }
    if (dist < p.radius + pk.radius + 4) {
      collectPickup(state, pk);
      state.pickups.splice(i, 1);
    }
  }
}

function collectPickup(state, pk) {
  const p = state.player;
  if (pk.kind === 'heart') {
    p.hp = Math.min(p.maxHp, p.hp + 30);
    addText(state, p.x, p.y - 28, '+30 HP', '#ff5d8f');
    state.sound.heart();
    burst(state, p.x, p.y, '#ff5d8f', 8, 150);
  } else if (pk.kind === 'shard') {
    state.score += PICKUP_KINDS.shard.score;
    addText(state, p.x, p.y - 28, `+${PICKUP_KINDS.shard.score}`, '#7ef0c1');
    state.sound.pickup();
    burst(state, p.x, p.y, '#7ef0c1', 6, 130);
  } else if (pk.kind === 'ward') {
    p.hasWard = true;
    addText(state, p.x, p.y - 28, 'WARD!', '#6ee7ff');
    state.sound.pickup();
    burst(state, p.x, p.y, '#6ee7ff', 8, 150);
  }
}
