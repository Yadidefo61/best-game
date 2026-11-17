// Boss fights: the Dusk Warden on wave 5 and the Night King on wave 10.
// A boss is one big enemy with its own clock: it chases slowly, fires
// radial bursts of ember bolts, summons wisps, and enrages below half
// health. It arrives only after the rest of its wave is cleared, so it
// is always the wave's climax. Bosses are slowed by the lantern's light
// like everything else, but never knocked back.
import { ARENA_MARGIN, ENEMY_KINDS, VIEW_HEIGHT, VIEW_WIDTH } from './config.js';
import { burst, ringBurst } from './particles.js';
import { lightSlow } from './light.js';
import { rand } from './rng.js';

export function makeBoss(state, wave) {
  const def = ENEMY_KINDS.boss;
  const final = wave >= 10;
  const hp = def.hp * (final ? 1.6 : 1);
  return {
    kind: 'boss',
    isBoss: true,
    name: final ? 'The Night King' : 'The Dusk Warden',
    x: 640,
    y: 120,
    vx: 0,
    vy: 0,
    radius: def.radius,
    hp,
    maxHp: hp,
    speed: def.speed,
    damage: def.damage,
    score: def.score + (final ? 1000 : 0),
    color: def.color,
    shootTimer: 2.0,
    chargeTimer: 1.6,
    charging: false,
    chargeX: 0,
    chargeY: 0,
    telegraph: 0,
    hitFlash: 0,
    wobble: 0,
    inLight: false,
    burstTimer: 2.4,
    summonTimer: 6,
    enraged: false,
  };
}

export function spawnBoss(state) {
  const boss = makeBoss(state, state.wave);
  state.enemies.push(boss);
  state.banner = boss.name.toUpperCase();
  state.bannerTimer = 2.4;
  state.shake = Math.max(state.shake, 8);
  state.sound.bossRoar();
  ringBurst(state, boss.x, boss.y, '#b5179e');
  burst(state, boss.x, boss.y, '#b5179e', 30, 320);
}

// One summoned wisp, built the same way makeEnemy builds one, so the
// summon never drifts from the wisp's own definition.
function summonWisp(state) {
  const def = ENEMY_KINDS.wisp;
  const hpScale = 1 + (state.wave - 1) * 0.16;
  const a = rand(state.rng, 0, Math.PI * 2);
  state.enemies.push({
    kind: 'wisp',
    x: Math.max(80, Math.min(1200, state.player.x + Math.cos(a) * 320)),
    y: Math.max(80, Math.min(640, state.player.y + Math.sin(a) * 320)),
    vx: 0,
    vy: 0,
    radius: def.radius,
    hp: def.hp * hpScale,
    maxHp: def.hp * hpScale,
    speed: def.speed,
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
  });
}

export function updateBoss(state, boss, dt) {
  const p = state.player;
  boss.hitFlash -= dt;
  boss.wobble += dt * 3;

  if (!boss.enraged && boss.hp < boss.maxHp * 0.5) {
    boss.enraged = true;
    boss.speed *= 1.35;
    state.banner = 'THE WARDEN RAGES!';
    state.bannerTimer = 1.6;
    state.sound.bossRoar();
    burst(state, boss.x, boss.y, '#ff5964', 26, 300);
  }

  const dx = p.x - boss.x;
  const dy = p.y - boss.y;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = dx / dist;
  const ny = dy / dist;
  const slow = lightSlow(state, boss);
  boss.inLight = slow < 1;
  boss.vx = nx * boss.speed * slow;
  boss.vy = ny * boss.speed * slow;

  // Radial burst of ember bolts.
  boss.burstTimer -= dt;
  if (boss.burstTimer <= 0) {
    boss.burstTimer = boss.enraged ? 1.6 : 2.4;
    const n = boss.enraged ? 10 : 8;
    for (let i = 0; i < n; i += 1) {
      const a = (Math.PI * 2 * i) / n + boss.wobble;
      state.enemyBullets.push({
        x: boss.x,
        y: boss.y,
        vx: Math.cos(a) * 170,
        vy: Math.sin(a) * 170,
        radius: 8,
        damage: 14,
        life: 5,
        color: '#e07aff',
      });
    }
    state.sound.tone(160, 0.2, 'sawtooth', 0.07, 90);
  }

  // Call wisps while the arena still has room for them.
  boss.summonTimer -= dt;
  if (boss.summonTimer <= 0 && state.enemies.length < 14) {
    boss.summonTimer = boss.enraged ? 5 : 7;
    summonWisp(state);
    summonWisp(state);
    state.sound.tone(240, 0.15, 'triangle', 0.05, 420);
  }

  boss.x += boss.vx * dt;
  boss.y += boss.vy * dt;
  boss.x = Math.max(ARENA_MARGIN + boss.radius * 0.5, Math.min(VIEW_WIDTH - ARENA_MARGIN - boss.radius * 0.5, boss.x));
  boss.y = Math.max(ARENA_MARGIN + boss.radius * 0.5, Math.min(VIEW_HEIGHT - ARENA_MARGIN - boss.radius * 0.5, boss.y));
}
