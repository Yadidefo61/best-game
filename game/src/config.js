// Tunable constants for Emberlight Arena: arena size, player base stats,
// the four enemy kinds, the upgrade pool and the palette. Nothing here
// reads the network or the clock; the game logic only ever uses these
// numbers plus the seeded RNG, so balance changes stay in one file.
export const VIEW_WIDTH = 1280;
export const VIEW_HEIGHT = 720;
export const ARENA_MARGIN = 46;
export const STEP = 1 / 60;
export const WIN_WAVE = 10;
export const SHOT_SEED = 7;

export const LIGHT_BASE_RADIUS = 230;
export const LIGHT_LOW_HP_RADIUS = 165;
export const LIGHT_SLOW = 0.72;
export const LIGHT_SEAR = 1.25;

export const COLORS = {
  background: '#0d0a1a',
  backgroundEdge: '#17112e',
  grid: '#241b45',
  ember: '#ffb347',
  emberHot: '#ff7847',
  lantern: '#ffe9a3',
  player: '#ffd166',
  playerCore: '#fff3c4',
  wisp: '#ff9f43',
  spitter: '#c77dff',
  brute: '#ff5964',
  dasher: '#4cc9f0',
  mote: '#7dff8a',
  weaver: '#2ec4b6',
  boss: '#b5179e',
  bullet: '#ffe66d',
  enemyBullet: '#e07aff',
  heart: '#ff5d8f',
  shard: '#7ef0c1',
  shield: '#6ee7ff',
  text: '#f4ead8',
  dimText: '#b9aed6',
  danger: '#ff5964',
};

export const PLAYER_BASE = {
  radius: 16,
  speed: 250,
  maxHp: 100,
  fireInterval: 0.22,
  damage: 22,
  bulletSpeed: 560,
  projectiles: 1,
  spread: 0.09,
  pierce: 0,
  magnetRadius: 90,
  dashCooldown: 2.2,
  dashSpeed: 720,
  dashTime: 0.16,
};

export const ENEMY_KINDS = {
  wisp: {
    name: 'Ember Wisp',
    radius: 15,
    hp: 30,
    speed: 118,
    damage: 10,
    score: 50,
    color: COLORS.wisp,
    firstWave: 1,
  },
  spitter: {
    name: 'Cinder Spitter',
    radius: 17,
    hp: 46,
    speed: 82,
    damage: 12,
    score: 100,
    color: COLORS.spitter,
    firstWave: 2,
    shootInterval: 2.4,
    keepDistance: 270,
  },
  brute: {
    name: 'Ash Brute',
    radius: 27,
    hp: 150,
    speed: 52,
    damage: 22,
    score: 200,
    color: COLORS.brute,
    firstWave: 3,
  },
  dasher: {
    name: 'Gale Dasher',
    radius: 14,
    hp: 38,
    speed: 96,
    damage: 14,
    score: 80,
    color: COLORS.dasher,
    firstWave: 4,
    chargeInterval: 2.8,
    chargeSpeed: 460,
  },
  mote: {
    name: 'Gloom Mote',
    radius: 10,
    hp: 12,
    speed: 168,
    damage: 6,
    score: 30,
    color: COLORS.mote,
    firstWave: 2,
  },
  weaver: {
    name: 'Dusk Weaver',
    radius: 18,
    hp: 64,
    speed: 74,
    damage: 12,
    score: 150,
    color: COLORS.weaver,
    firstWave: 5,
    shootInterval: 3.0,
  },
  boss: {
    name: 'Dusk Warden',
    radius: 46,
    hp: 950,
    speed: 44,
    damage: 26,
    score: 1500,
    color: COLORS.boss,
    firstWave: 5,
  },
};

// How many of each kind a wave fields. Counts grow with the wave so the
// pressure rises even before the later kinds join the fight.
export function waveComposition(wave) {
  const list = [];
  list.push({ kind: 'wisp', count: 4 + wave * 2 });
  if (wave >= 2) list.push({ kind: 'mote', count: 2 + wave });
  if (wave >= 2) list.push({ kind: 'spitter', count: 1 + Math.floor(wave / 2) });
  if (wave >= 3) list.push({ kind: 'brute', count: Math.floor(wave / 2) });
  if (wave >= 4) list.push({ kind: 'dasher', count: wave - 2 });
  if (wave >= 5) list.push({ kind: 'weaver', count: 1 + Math.floor((wave - 3) / 2) });
  return list;
}

export const UPGRADES = [
  {
    id: 'rapid',
    name: 'Quick Wick',
    icon: '»',
    description: 'Fire 25% faster. Your lantern spits embers in a hurry.',
    apply(player) { player.fireInterval *= 0.8; },
  },
  {
    id: 'heavy',
    name: 'Heavy Embers',
    icon: '●',
    description: '+35% bullet damage. Each ember hits like a hammer.',
    apply(player) { player.damage *= 1.35; },
  },
  {
    id: 'swift',
    name: 'Wind Soles',
    icon: '≫',
    description: '+15% move speed. Outrun anything the dark sends.',
    apply(player) { player.speed *= 1.15; },
  },
  {
    id: 'twin',
    name: 'Twin Flames',
    icon: '✦',
    description: '+1 projectile per shot. Twice the lantern, twice the light.',
    apply(player) { player.projectiles += 1; },
  },
  {
    id: 'pierce',
    name: 'Lantern Lance',
    icon: '→',
    description: 'Bullets pierce +1 enemy. One ember, two wisps.',
    apply(player) { player.pierce += 1; },
  },
  {
    id: 'heart',
    name: 'Warm Hearth',
    icon: '♥',
    description: '+25 max health and heal 25 now. A hearth that mends.',
    apply(player) { player.maxHp += 25; player.hp = Math.min(player.maxHp, player.hp + 25); },
  },
  {
    id: 'dash',
    name: 'Flicker Step',
    icon: '↯',
    description: 'Dash recharges 35% faster. Blink through the dark.',
    apply(player) { player.dashCooldown *= 0.65; },
  },
  {
    id: 'magnet',
    name: 'Ember Charm',
    icon: '◎',
    description: 'Pickups fly to you from much further away.',
    apply(player) { player.magnetRadius *= 1.9; },
  },
  {
    id: 'ward',
    name: 'Glass Ward',
    icon: '⬡',
    description: 'Gain a ward that blocks one hit. It returns each wave.',
    apply(player) { player.ward = true; player.hasWard = true; },
  },
  {
    id: 'flare',
    name: 'Wide Wick',
    icon: '◉',
    description: '+35% lantern light radius. Your safe ground grows wider.',
    apply(player) {
      player.lightRadius *= 1.35;
      if (player.lightDamageBonus > 0) player.lightRadius *= 1.1;
    },
  },
  {
    id: 'burn',
    name: 'Searing Light',
    icon: '☀',
    description: 'Enemies inside your light take +50% damage. The light bites.',
    apply(player) {
      player.lightDamageBonus += 0.5;
      if (player.lightRadius > LIGHT_BASE_RADIUS) player.lightDamageBonus += 0.25;
    },
  },
  {
    id: 'chain',
    name: 'Ember Chain',
    icon: '⛓',
    description: 'Combo window +1.5s and +1 multiplier cap. Keep the chain alive.',
    apply(player) { player.comboWindow += 1.5; player.comboCap += 1; },
  },
  {
    id: 'nova',
    name: 'Lantern Nova',
    icon: '✺',
    description: 'Your dash erupts in a nova that burns nearby enemies.',
    apply(player) { player.nova = true; player.novaDamage += 40; },
  },
  {
    id: 'regen',
    name: 'Kindled Heart',
    icon: '♨',
    description: 'Regenerate 1.5 health every second. The lantern mends you.',
    apply(player) { player.regen += 1.5; },
  },
];

export const PICKUP_KINDS = {
  heart: { color: COLORS.heart, radius: 11, score: 0 },
  shard: { color: COLORS.shard, radius: 9, score: 25 },
  ward: { color: COLORS.shield, radius: 11, score: 0 },
};
