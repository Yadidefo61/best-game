// The enemy kinds of Emberlight Arena. Each kind is one behaviour:
// wisps chase, motes swarm in swerves, spitters hold their distance and
// shoot, weavers strafe and fire three-way spreads, brutes lumber in and
// soak damage, dashers telegraph and then charge. Spawning picks a point
// on the arena edge, away from the player. Bosses are steered by boss.js.
import { ARENA_MARGIN, ENEMY_KINDS, VIEW_HEIGHT, VIEW_WIDTH } from './config.js';
import { rand } from './rng.js';
import { lightSlow } from './light.js';
import { updateBoss } from './boss.js';

export function makeEnemy(kind, x, y, wave) {
  const def = ENEMY_KINDS[kind];
  const hpScale = 1 + (wave - 1) * 0.16;
  const speedScale = 1 + Math.min(0.35, (wave - 1) * 0.03);
  return {
    kind,
    x,
    y,
    vx: 0,
    vy: 0,
    radius: def.radius,
    hp: def.hp * hpScale,
    maxHp: def.hp * hpScale,
    speed: def.speed * speedScale,
    damage: def.damage,
    score: def.score,
    color: def.color,
    shootTimer: 1.2,
    chargeTimer: 1.6,
    charging: false,
    chargeX: 0,
    chargeY: 0,
    telegraph: 0,
    hitFlash: 0,
    wobble: 0,
    inLight: false,
  };
}

// A point on the arena edge at least 260px from the player.
export function edgeSpawnPoint(state) {
  const rng = state.rng;
  for (let tries = 0; tries < 12; tries += 1) {
    const side = Math.floor(rng() * 4);
    let x;
    let y;
    if (side === 0) { x = rand(rng, ARENA_MARGIN, VIEW_WIDTH - ARENA_MARGIN); y = ARENA_MARGIN + 10; }
    else if (side === 1) { x = rand(rng, ARENA_MARGIN, VIEW_WIDTH - ARENA_MARGIN); y = VIEW_HEIGHT - ARENA_MARGIN - 10; }
    else if (side === 2) { x = ARENA_MARGIN + 10; y = rand(rng, ARENA_MARGIN, VIEW_HEIGHT - ARENA_MARGIN); }
    else { x = VIEW_WIDTH - ARENA_MARGIN - 10; y = rand(rng, ARENA_MARGIN, VIEW_HEIGHT - ARENA_MARGIN); }
    const dx = x - state.player.x;
    const dy = y - state.player.y;
    if (dx * dx + dy * dy > 260 * 260) return { x, y };
  }
  return { x: ARENA_MARGIN + 10, y: ARENA_MARGIN + 10 };
}

export function spawnEnemy(state, kind) {
  const at = edgeSpawnPoint(state);
  state.enemies.push(makeEnemy(kind, at.x, at.y, state.wave));
}

// Steer every enemy for one fixed step. Spitters fire ember bolts;
// dashers wind up, flash, then charge. Contact damage is resolved by
// the collision pass in game.js, not here.
export function updateEnemies(state, dt) {
  const p = state.player;
  const rng = state.rng;
  for (const e of state.enemies) {
    // Bosses steer themselves in boss.js.
    if (e.isBoss) {
      updateBoss(state, e, dt);
      continue;
    }
    e.hitFlash -= dt;
    e.wobble += dt * 3;
    const dx = p.x - e.x;
    const dy = p.y - e.y;
    const dist = Math.hypot(dx, dy) || 1;
    const nx = dx / dist;
    const ny = dy / dist;

    if (e.kind === 'wisp') {
      const wob = Math.sin(e.wobble) * 0.35;
      e.vx = (nx - ny * wob) * e.speed;
      e.vy = (ny + nx * wob) * e.speed;
    } else if (e.kind === 'mote') {
      // A fast swerver: it never flies straight, so it is hard to lead.
      const wob = Math.sin(e.wobble * 2.2) * 0.9;
      e.vx = (nx - ny * wob) * e.speed;
      e.vy = (ny + nx * wob) * e.speed;
    } else if (e.kind === 'weaver') {
      const def = ENEMY_KINDS.weaver;
      if (dist > 330) {
        e.vx = nx * e.speed;
        e.vy = ny * e.speed;
      } else if (dist < 220) {
        e.vx = -nx * e.speed * 0.7;
        e.vy = -ny * e.speed * 0.7;
      } else {
        e.vx = -ny * e.speed * 0.5;
        e.vy = nx * e.speed * 0.5;
      }
      e.shootTimer -= dt;
      if (e.shootTimer <= 0 && dist < 520) {
        e.shootTimer = def.shootInterval * rand(rng, 0.85, 1.2);
        const base = Math.atan2(ny, nx);
        for (const off of [-0.28, 0, 0.28]) {
          state.enemyBullets.push({
            x: e.x, y: e.y,
            vx: Math.cos(base + off) * 200, vy: Math.sin(base + off) * 200,
            radius: 6, damage: def.damage, life: 4, color: '#2ec4b6',
          });
        }
        state.sound.tone(420, 0.08, 'sine', 0.03, 240);
      }
    } else if (e.kind === 'spitter') {
      const def = ENEMY_KINDS.spitter;
      if (dist > def.keepDistance + 40) {
        e.vx = nx * e.speed;
        e.vy = ny * e.speed;
      } else if (dist < def.keepDistance - 60) {
        e.vx = -nx * e.speed * 0.7;
        e.vy = -ny * e.speed * 0.7;
      } else {
        e.vx = -ny * e.speed * 0.4;
        e.vy = nx * e.speed * 0.4;
      }
      e.shootTimer -= dt;
      if (e.shootTimer <= 0 && dist < 560) {
        e.shootTimer = def.shootInterval * rand(rng, 0.85, 1.2);
        state.enemyBullets.push({
          x: e.x, y: e.y,
          vx: nx * 230, vy: ny * 230,
          radius: 7, damage: def.damage, life: 4, color: '#e07aff',
        });
        state.sound.tone(300, 0.08, 'sine', 0.03, 180);
      }
    } else if (e.kind === 'brute') {
      e.vx = nx * e.speed;
      e.vy = ny * e.speed;
    } else if (e.kind === 'dasher') {
      const def = ENEMY_KINDS.dasher;
      if (e.charging) {
        e.telegraph -= dt;
        e.vx = e.chargeX * def.chargeSpeed;
        e.vy = e.chargeY * def.chargeSpeed;
        if (e.telegraph <= 0) e.charging = false;
      } else {
        e.chargeTimer -= dt;
        e.vx = nx * e.speed;
        e.vy = ny * e.speed;
        if (e.chargeTimer <= 0 && dist < 420 && dist > 90) {
          e.charging = true;
          e.telegraph = 0.55;
          e.chargeTimer = def.chargeInterval * rand(rng, 0.9, 1.15);
          e.chargeX = nx;
          e.chargeY = ny;
        }
      }
    }

    // The lantern's light slows whatever stands inside it.
    const slow = lightSlow(state, e);
    e.inLight = slow < 1;
    e.vx *= slow;
    e.vy *= slow;

    e.x += e.vx * dt;
    e.y += e.vy * dt;
    e.x = Math.max(ARENA_MARGIN + e.radius * 0.5, Math.min(VIEW_WIDTH - ARENA_MARGIN - e.radius * 0.5, e.x));
    e.y = Math.max(ARENA_MARGIN + e.radius * 0.5, Math.min(VIEW_HEIGHT - ARENA_MARGIN - e.radius * 0.5, e.y));
  }
}
