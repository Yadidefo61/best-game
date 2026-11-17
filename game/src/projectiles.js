// Projectiles: the keeper's ember bolts and the spitters' return fire.
// Firing fans the keeper's shots by their projectile count and spread;
// the update pass moves every bolt and resolves every hit — bullets
// against enemies (with pierce), enemy bolts against the keeper.
import { COLORS } from './config.js';
import { chance, rand } from './rng.js';
import { burst, addText } from './particles.js';
import { damagePlayer } from './player.js';
import { spawnPickup } from './pickups.js';

export function spawnPlayerBullets(state) {
  const p = state.player;
  const n = p.projectiles;
  for (let i = 0; i < n; i += 1) {
    const offset = n === 1 ? 0 : (i - (n - 1) / 2) * p.spread;
    const angle = p.angle + offset;
    state.bullets.push({
      x: p.x + Math.cos(angle) * (p.radius + 6),
      y: p.y + Math.sin(angle) * (p.radius + 6),
      vx: Math.cos(angle) * p.bulletSpeed,
      vy: Math.sin(angle) * p.bulletSpeed,
      radius: 6,
      damage: p.damage,
      pierce: p.pierce,
      life: 1.1,
      hitSet: new Set(),
    });
  }
}

function killEnemy(state, index) {
  const e = state.enemies[index];
  state.enemies.splice(index, 1);
  state.score += e.score;
  state.kills += 1;
  state.sound.enemyDie();
  burst(state, e.x, e.y, e.color, 14, 260);
  state.shake = Math.max(state.shake, e.kind === 'brute' ? 7 : 3);
  addText(state, e.x, e.y - 14, `+${e.score}`, '#ffe66d');
  const rng = state.rng;
  if (chance(rng, 0.16)) spawnPickup(state, e.x, e.y, 'shard');
  else if (chance(rng, 0.07)) spawnPickup(state, e.x, e.y, 'heart');
  else if (chance(rng, 0.04)) spawnPickup(state, e.x, e.y, 'ward');
}

export function updateBullets(state, dt) {
  // Keeper bolts vs enemies.
  for (let bi = state.bullets.length - 1; bi >= 0; bi -= 1) {
    const b = state.bullets[bi];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    let dead = b.life <= 0 || b.x < 0 || b.x > 1280 || b.y < 0 || b.y > 720;
    if (!dead) {
      for (let ei = state.enemies.length - 1; ei >= 0; ei -= 1) {
        const e = state.enemies[ei];
        if (b.hitSet.has(e)) continue;
        const dx = b.x - e.x;
        const dy = b.y - e.y;
        const rr = b.radius + e.radius;
        if (dx * dx + dy * dy > rr * rr) continue;
        b.hitSet.add(e);
        e.hp -= b.damage;
        e.hitFlash = 0.12;
        state.sound.enemyHit();
        burst(state, b.x, b.y, COLORS.ember, 4, 140);
        if (e.hp <= 0) {
          killEnemy(state, ei);
        }
        if (b.pierce > 0) {
          b.pierce -= 1;
        } else {
          dead = true;
        }
        break;
      }
    }
    if (dead) state.bullets.splice(bi, 1);
  }

  // Enemy bolts vs the keeper.
  const p = state.player;
  for (let i = state.enemyBullets.length - 1; i >= 0; i -= 1) {
    const b = state.enemyBullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    let dead = b.life <= 0 || b.x < -20 || b.x > 1300 || b.y < -20 || b.y > 740;
    if (!dead) {
      const dx = b.x - p.x;
      const dy = b.y - p.y;
      const rr = b.radius + p.radius - 4;
      if (dx * dx + dy * dy <= rr * rr) {
        damagePlayer(state, b.damage);
        burst(state, p.x, p.y, '#e07aff', 8, 180);
        dead = true;
      }
    }
    if (dead) state.enemyBullets.splice(i, 1);
  }
}

// Enemy bodies vs the keeper: a touch costs health and knocks the enemy
// back a little so one body cannot drain the keeper in a single frame.
export function resolveBodyCollisions(state) {
  const p = state.player;
  for (const e of state.enemies) {
    const dx = p.x - e.x;
    const dy = p.y - e.y;
    const rr = p.radius + e.radius - 2;
    if (dx * dx + dy * dy > rr * rr) continue;
    const taken = damagePlayer(state, e.damage);
    if (taken > 0) {
      const dist = Math.hypot(dx, dy) || 1;
      e.x -= (dx / dist) * 34;
      e.y -= (dy / dist) * 34;
      burst(state, p.x, p.y, COLORS.danger, 10, 220);
    }
  }
}
