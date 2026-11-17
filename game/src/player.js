// The lantern keeper: movement, dash, aiming and firing. The player is a
// small glowing keeper carrying the Emberlight; everything about how they
// feel to control lives here, and nothing else in the game moves them.
import { ARENA_MARGIN, LIGHT_BASE_RADIUS, PLAYER_BASE, VIEW_HEIGHT, VIEW_WIDTH } from './config.js';
import { damageEnemy, spawnPlayerBullets } from './projectiles.js';
import { breakCombo } from './combo.js';

export function createPlayer() {
  return {
    x: VIEW_WIDTH / 2,
    y: VIEW_HEIGHT / 2,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2,
    radius: PLAYER_BASE.radius,
    speed: PLAYER_BASE.speed,
    hp: PLAYER_BASE.maxHp,
    maxHp: PLAYER_BASE.maxHp,
    fireInterval: PLAYER_BASE.fireInterval,
    damage: PLAYER_BASE.damage,
    bulletSpeed: PLAYER_BASE.bulletSpeed,
    projectiles: PLAYER_BASE.projectiles,
    spread: PLAYER_BASE.spread,
    pierce: PLAYER_BASE.pierce,
    magnetRadius: PLAYER_BASE.magnetRadius,
    dashCooldown: PLAYER_BASE.dashCooldown,
    dashSpeed: PLAYER_BASE.dashSpeed,
    dashTime: PLAYER_BASE.dashTime,
    fireTimer: 0,
    dashTimer: 0,
    dashLeft: 0,
    invulnTimer: 0,
    hasWard: false,
    ward: false,
    walkCycle: 0,
    lightRadius: LIGHT_BASE_RADIUS,
    lightDamageBonus: 0,
    comboWindow: 2.5,
    comboCap: 4,
    regen: 0,
    nova: false,
    novaDamage: 60,
  };
}

export function resetPlayer(player) {
  const fresh = createPlayer();
  Object.assign(player, fresh);
}

// Move, dash and shoot for one fixed step. Returns true when a shot fired.
export function updatePlayer(state, input, dt) {
  const p = state.player;
  p.fireTimer -= dt;
  p.dashLeft -= dt;
  p.invulnTimer -= dt;

  // Kindled Heart: the lantern slowly mends its keeper.
  if (p.regen > 0 && p.hp > 0) {
    p.hp = Math.min(p.maxHp, p.hp + p.regen * dt);
  }

  const move = input.moveVector();
  p.angle = Math.atan2(input.mouseY - p.y, input.mouseX - p.x);

  const dashing = p.dashTimer > 0;
  if (dashing) {
    p.dashTimer -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  } else {
    const speed = p.speed;
    p.vx = move.x * speed;
    p.vy = move.y * speed;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (move.x !== 0 || move.y !== 0) p.walkCycle += dt * 10;
  }

  // Start a dash: Space or Shift, only when the cooldown has run out.
  if ((input.pressed('Space') || input.pressed('ShiftLeft') || input.pressed('ShiftRight')) && p.dashLeft <= 0) {
    const dirX = move.x !== 0 || move.y !== 0 ? move.x : Math.cos(p.angle);
    const dirY = move.x !== 0 || move.y !== 0 ? move.y : Math.sin(p.angle);
    const len = Math.hypot(dirX, dirY) || 1;
    p.vx = (dirX / len) * p.dashSpeed;
    p.vy = (dirY / len) * p.dashSpeed;
    p.dashTimer = p.dashTime;
    p.dashLeft = p.dashCooldown;
    p.invulnTimer = Math.max(p.invulnTimer, p.dashTime + 0.05);
    state.sound.dash();
    state.particles.push({
      kind: 'ring', x: p.x, y: p.y, vx: 0, vy: 0, life: 0.3, maxLife: 0.3,
      radius: 12, color: '#6ee7ff', size: 3,
    });
    // Lantern Nova: the dash erupts and burns everything close by.
    if (p.nova) {
      state.sound.nova();
      state.particles.push({
        kind: 'ring', x: p.x, y: p.y, vx: 0, vy: 0, life: 0.4, maxLife: 0.4,
        radius: 20, color: '#ffb347', size: 4,
      });
      for (const e of state.enemies.slice()) {
        const dx = e.x - p.x;
        const dy = e.y - p.y;
        if (dx * dx + dy * dy <= 150 * 150) {
          damageEnemy(state, e, p.novaDamage);
        }
      }
    }
  }

  p.x = Math.max(ARENA_MARGIN + p.radius, Math.min(VIEW_WIDTH - ARENA_MARGIN - p.radius, p.x));
  p.y = Math.max(ARENA_MARGIN + p.radius, Math.min(VIEW_HEIGHT - ARENA_MARGIN - p.radius, p.y));

  if (input.mouseDown && p.fireTimer <= 0) {
    p.fireTimer = p.fireInterval;
    spawnPlayerBullets(state);
    state.sound.shoot();
    return true;
  }
  return false;
}

// Hurt the keeper. A ward absorbs one whole hit; invulnerability frames
// (after a dash or a hit) ignore the rest. Returns the damage actually taken.
export function damagePlayer(state, amount) {
  const p = state.player;
  if (p.invulnTimer > 0 || state.screen !== 'play') return 0;
  if (p.hasWard) {
    p.hasWard = false;
    p.invulnTimer = 0.8;
    state.flash = 0.35;
    state.shake = Math.max(state.shake, 6);
    state.texts.push({ x: p.x, y: p.y - 30, text: 'WARD!', color: '#6ee7ff', life: 0.9, maxLife: 0.9 });
    state.sound.enemyHit();
    return 0;
  }
  p.hp -= amount;
  p.invulnTimer = 0.7;
  state.flash = 0.45;
  state.shake = Math.max(state.shake, 10);
  state.sound.playerHurt();
  breakCombo(state);
  return amount;
}
