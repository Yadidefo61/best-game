// All canvas drawing for Emberlight Arena: the arena and its drifting
// embers, every entity, the HUD, and the title / draft / pause /
// game-over / victory screens. Nothing here changes game state except
// recording where the upgrade cards were drawn, so clicks can find them.
import { ARENA_MARGIN, COLORS, VIEW_HEIGHT, VIEW_WIDTH, WIN_WAVE } from './config.js';
import { darknessLevel, lightFlicker, lightRadius } from './light.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawBackground(ctx, state) {
  const grad = ctx.createRadialGradient(640, 360, 80, 640, 360, 760);
  grad.addColorStop(0, '#1b1236');
  grad.addColorStop(1, COLORS.background);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

  // Stone-tile floor: a checker of faint warm tiles under the grid.
  for (let ty = ARENA_MARGIN; ty < VIEW_HEIGHT - ARENA_MARGIN; ty += 64) {
    for (let tx = ARENA_MARGIN; tx < VIEW_WIDTH - ARENA_MARGIN; tx += 64) {
      const cx = Math.round((tx - ARENA_MARGIN) / 64);
      const cy = Math.round((ty - ARENA_MARGIN) / 64);
      if ((cx + cy) % 2 === 0) {
        ctx.fillStyle = 'rgba(255, 179, 71, 0.03)';
        ctx.fillRect(tx, ty, 64, 64);
      }
    }
  }

  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.5;
  for (let x = ARENA_MARGIN; x <= VIEW_WIDTH - ARENA_MARGIN; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, ARENA_MARGIN);
    ctx.lineTo(x, VIEW_HEIGHT - ARENA_MARGIN);
    ctx.stroke();
  }
  for (let y = ARENA_MARGIN; y <= VIEW_HEIGHT - ARENA_MARGIN; y += 64) {
    ctx.beginPath();
    ctx.moveTo(ARENA_MARGIN, y);
    ctx.lineTo(VIEW_WIDTH - ARENA_MARGIN, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Drifting ember motes, placed once per game from the seeded RNG.
  for (const s of state.stars) {
    const tw = 0.35 + 0.3 * Math.sin(state.time * s.tw + s.phase);
    ctx.globalAlpha = Math.max(0.05, tw);
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(s.x, s.y + Math.sin(state.time * 0.4 + s.phase) * 6, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.strokeStyle = '#3d2b66';
  ctx.lineWidth = 3;
  ctx.strokeRect(ARENA_MARGIN, ARENA_MARGIN, VIEW_WIDTH - ARENA_MARGIN * 2, VIEW_HEIGHT - ARENA_MARGIN * 2);

  // Corner braziers: little bowls of fire that light the arena's edges.
  const corners = [
    [ARENA_MARGIN + 26, ARENA_MARGIN + 26],
    [VIEW_WIDTH - ARENA_MARGIN - 26, ARENA_MARGIN + 26],
    [ARENA_MARGIN + 26, VIEW_HEIGHT - ARENA_MARGIN - 26],
    [VIEW_WIDTH - ARENA_MARGIN - 26, VIEW_HEIGHT - ARENA_MARGIN - 26],
  ];
  corners.forEach(([bx, by], i) => {
    const flick = 1 + Math.sin(state.time * 6 + i * 1.7) * 0.15;
    const glow = ctx.createRadialGradient(bx, by, 2, bx, by, 46 * flick);
    glow.addColorStop(0, 'rgba(255, 179, 71, 0.35)');
    glow.addColorStop(1, 'rgba(255, 179, 71, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(bx, by, 46 * flick, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4a2c12';
    ctx.beginPath();
    ctx.arc(bx, by + 4, 10, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = '#ffb347';
    ctx.beginPath();
    ctx.arc(bx, by - 2, 6 * flick, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe9a3';
    ctx.beginPath();
    ctx.arc(bx, by - 3, 3 * flick, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawPlayer(ctx, state) {
  const p = state.player;
  if (p.invulnTimer > 0 && Math.floor(state.time * 14) % 2 === 0 && state.screen === 'play') {
    ctx.globalAlpha = 0.45;
  }
  // Lantern glow.
  const glow = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, 64);
  glow.addColorStop(0, 'rgba(255, 233, 163, 0.55)');
  glow.addColorStop(1, 'rgba(255, 233, 163, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 64, 0, Math.PI * 2);
  ctx.fill();

  // Body: a little keeper with a lantern.
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.playerCore;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius * 0.55, 0, Math.PI * 2);
  ctx.fill();
  // Aim tick.
  ctx.strokeStyle = COLORS.lantern;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(p.x + Math.cos(p.angle) * (p.radius + 2), p.y + Math.sin(p.angle) * (p.radius + 2));
  ctx.lineTo(p.x + Math.cos(p.angle) * (p.radius + 12), p.y + Math.sin(p.angle) * (p.radius + 12));
  ctx.stroke();
  // Dash readiness ring.
  if (p.dashLeft > 0) {
    ctx.strokeStyle = 'rgba(110, 231, 255, 0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius + 7, -Math.PI / 2, -Math.PI / 2 + (1 - p.dashLeft / p.dashCooldown) * Math.PI * 2);
    ctx.stroke();
  }
  // Ward ring.
  if (p.hasWard) {
    ctx.strokeStyle = COLORS.shield;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius + 11, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawEnemy(ctx, state, e) {
  const flash = e.hitFlash > 0;
  ctx.fillStyle = flash ? '#ffffff' : e.color;
  ctx.strokeStyle = flash ? '#ffffff' : e.color;
  if (e.kind === 'wisp') {
    const flick = 1 + Math.sin(state.time * 9 + e.wobble) * 0.12;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius * flick, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius * 0.45, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.kind === 'spitter') {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(Math.sin(state.time * 2 + e.wobble) * 0.3);
    ctx.beginPath();
    ctx.moveTo(0, -e.radius);
    ctx.lineTo(e.radius, 0);
    ctx.lineTo(0, e.radius);
    ctx.lineTo(-e.radius, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#2a1140';
    ctx.beginPath();
    ctx.arc(e.x, e.y, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.kind === 'brute') {
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const a = (Math.PI / 3) * i + 0.3;
      const px = e.x + Math.cos(a) * e.radius;
      const py = e.y + Math.sin(a) * e.radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3d0a12';
    ctx.beginPath();
    ctx.arc(e.x - 8, e.y - 5, 4, 0, Math.PI * 2);
    ctx.arc(e.x + 8, e.y - 5, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.kind === 'mote') {
    // A small bright diamond, pulsing as it swerves.
    const pulse = 1 + Math.sin(state.time * 12 + e.wobble) * 0.18;
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(state.time * 2 + e.wobble);
    ctx.beginPath();
    ctx.moveTo(0, -e.radius * pulse);
    ctx.lineTo(e.radius * pulse, 0);
    ctx.lineTo(0, e.radius * pulse);
    ctx.lineTo(-e.radius * pulse, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#eaffea';
    ctx.beginPath();
    ctx.arc(e.x, e.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.kind === 'weaver') {
    // A teal hexagon strung with a web.
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const a = (Math.PI / 3) * i + state.time * 0.6;
      const px = e.x + Math.cos(a) * e.radius;
      const py = e.y + Math.sin(a) * e.radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(e.x - e.radius, e.y);
    ctx.lineTo(e.x + e.radius, e.y);
    ctx.moveTo(e.x, e.y - e.radius);
    ctx.lineTo(e.x, e.y + e.radius);
    ctx.stroke();
    ctx.fillStyle = '#0d2b28';
    ctx.beginPath();
    ctx.arc(e.x, e.y, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.kind === 'boss') {
    // The Warden / Night King: a huge horned orb with burning eyes.
    const enraged = e.enraged;
    if (enraged) {
      ctx.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(state.time * 10));
    }
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    // Horns.
    ctx.beginPath();
    ctx.moveTo(e.x - e.radius * 0.7, e.y - e.radius * 0.55);
    ctx.lineTo(e.x - e.radius * 1.15, e.y - e.radius * 1.25);
    ctx.lineTo(e.x - e.radius * 0.25, e.y - e.radius * 0.85);
    ctx.closePath();
    ctx.moveTo(e.x + e.radius * 0.7, e.y - e.radius * 0.55);
    ctx.lineTo(e.x + e.radius * 1.15, e.y - e.radius * 1.25);
    ctx.lineTo(e.x + e.radius * 0.25, e.y - e.radius * 0.85);
    ctx.closePath();
    ctx.fill();
    // Burning eyes.
    ctx.fillStyle = enraged ? '#ff5964' : '#ffe9a3';
    ctx.beginPath();
    ctx.arc(e.x - 15, e.y - 8, 6, 0, Math.PI * 2);
    ctx.arc(e.x + 15, e.y - 8, 6, 0, Math.PI * 2);
    ctx.fill();
    // Grinning maw.
    ctx.strokeStyle = '#2a0640';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(e.x, e.y + 8, 16, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  } else {
    // Dasher: a sharp triangle, flashing white while it telegraphs.
    if (e.charging) {
      ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(state.time * 18));
    }
    const ang = Math.atan2(e.vy, e.vx);
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(e.radius + 6, 0);
    ctx.lineTo(-e.radius, e.radius * 0.85);
    ctx.lineTo(-e.radius * 0.4, 0);
    ctx.lineTo(-e.radius, -e.radius * 0.85);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
  }
  // Health bar for hurt enemies.
  if (e.hp < e.maxHp) {
    const w = e.radius * 2;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(e.x - w / 2, e.y - e.radius - 10, w, 5);
    ctx.fillStyle = '#7ef0c1';
    ctx.fillRect(e.x - w / 2, e.y - e.radius - 10, w * Math.max(0, e.hp / e.maxHp), 5);
  }
  // A golden ring marks enemies standing inside the lantern's light,
  // where they are slowed and seared.
  if (e.inLight) {
    ctx.strokeStyle = 'rgba(255, 233, 163, 0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius + 5, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawHud(ctx, state) {
  const p = state.player;
  ctx.fillStyle = 'rgba(10, 6, 24, 0.72)';
  roundRect(ctx, 12, 10, 360, 52, 10);
  ctx.fill();
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 22px "Trebuchet MS", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`SCORE ${state.score}`, 26, 28);
  ctx.font = '15px "Trebuchet MS", system-ui, sans-serif';
  ctx.fillStyle = COLORS.dimText;
  ctx.fillText(`WAVE ${state.wave} / ${WIN_WAVE}    KILLS ${state.kills}    BEST ${state.best}`, 26, 50);

  // Health bar, top right.
  const bw = 260;
  const bx = VIEW_WIDTH - bw - 26;
  ctx.fillStyle = 'rgba(10, 6, 24, 0.72)';
  roundRect(ctx, bx - 14, 10, bw + 28, 52, 10);
  ctx.fill();
  ctx.fillStyle = '#3d0a12';
  roundRect(ctx, bx, 22, bw, 16, 8);
  ctx.fill();
  ctx.fillStyle = p.hp / p.maxHp > 0.35 ? '#ff5d8f' : COLORS.danger;
  if (p.hp > 0) {
    roundRect(ctx, bx, 22, bw * (p.hp / p.maxHp), 16, 8);
    ctx.fill();
  }
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 14px "Trebuchet MS", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`HP ${Math.ceil(Math.max(0, p.hp))} / ${p.maxHp}${p.hasWard ? '   ⬡ WARD' : ''}`, bx + bw / 2, 50);

  // Dash hint, bottom left.
  ctx.textAlign = 'left';
  ctx.font = '14px "Trebuchet MS", system-ui, sans-serif';
  ctx.fillStyle = COLORS.dimText;
  ctx.fillText('WASD move  •  Mouse aim  •  Hold click to shoot  •  SPACE dash  •  P pause  •  M mute', 26, VIEW_HEIGHT - 18);

  // Combo chain, under the score panel.
  if (state.combo.count >= 2) {
    ctx.textAlign = 'left';
    ctx.font = 'bold 17px "Trebuchet MS", system-ui, sans-serif';
    ctx.fillStyle = state.combo.mult > 1 ? COLORS.ember : COLORS.dimText;
    ctx.fillText(`COMBO x${state.combo.count}  •  SCORE x${state.combo.mult.toFixed(1)}`, 26, 82);
  }

  // Boss health bar, top centre.
  const boss = state.enemies.find((e) => e.isBoss);
  if (boss) {
    const bw2 = 420;
    const bx2 = (VIEW_WIDTH - bw2) / 2;
    ctx.textAlign = 'center';
    ctx.fillStyle = boss.enraged ? COLORS.danger : '#e0aaff';
    ctx.font = 'bold 15px "Trebuchet MS", system-ui, sans-serif';
    ctx.fillText(boss.name.toUpperCase(), VIEW_WIDTH / 2, 28);
    ctx.fillStyle = 'rgba(10, 6, 24, 0.72)';
    roundRect(ctx, bx2 - 6, 34, bw2 + 12, 14, 7);
    ctx.fill();
    ctx.fillStyle = '#3d0a12';
    roundRect(ctx, bx2, 37, bw2, 8, 4);
    ctx.fill();
    ctx.fillStyle = boss.enraged ? COLORS.danger : '#b5179e';
    if (boss.hp > 0) {
      roundRect(ctx, bx2, 37, bw2 * Math.max(0, boss.hp / boss.maxHp), 8, 4);
      ctx.fill();
    }
  }

  // Wave banner.
  if (state.bannerTimer > 0) {
    ctx.globalAlpha = Math.min(1, state.bannerTimer);
    ctx.fillStyle = COLORS.ember;
    ctx.font = 'bold 44px "Trebuchet MS", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.banner, VIEW_WIDTH / 2, 150);
    ctx.globalAlpha = 1;
  }
}

function dimScreen(ctx) {
  ctx.fillStyle = 'rgba(8, 5, 20, 0.72)';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
}

function drawTitle(ctx, state) {
  dimScreen(ctx);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.ember;
  ctx.font = 'bold 76px "Trebuchet MS", system-ui, sans-serif';
  ctx.fillText('EMBERLIGHT', VIEW_WIDTH / 2, 210);
  ctx.fillStyle = COLORS.lantern;
  ctx.font = 'bold 44px "Trebuchet MS", system-ui, sans-serif';
  ctx.fillText('A R E N A', VIEW_WIDTH / 2, 262);
  ctx.fillStyle = COLORS.text;
  ctx.font = '20px "Trebuchet MS", system-ui, sans-serif';
  ctx.fillText('Keep the last lantern burning. Survive all 10 waves of the dark.', VIEW_WIDTH / 2, 320);
  ctx.fillStyle = COLORS.dimText;
  ctx.font = '18px "Trebuchet MS", system-ui, sans-serif';
  ctx.fillText('WASD / arrows — move      Mouse — aim      Hold click — shoot', VIEW_WIDTH / 2, 372);
  ctx.fillText('SPACE — dash through danger      1 / 2 / 3 — pick an upgrade', VIEW_WIDTH / 2, 400);
  ctx.fillText('Between waves, choose a blessing. Chain kills for combo score.', VIEW_WIDTH / 2, 428);
  ctx.fillStyle = COLORS.ember;
  ctx.font = '18px "Trebuchet MS", system-ui, sans-serif';
  ctx.fillText('Fight inside your light: it slows and sears the dark. Bosses wait on waves 5 and 10.', VIEW_WIDTH / 2, 456);
  ctx.fillStyle = COLORS.emberHot;
  ctx.font = 'bold 26px "Trebuchet MS", system-ui, sans-serif';
  ctx.fillText(state.best > 0 ? `BEST SCORE ${state.best}  —  PRESS ENTER OR CLICK TO PLAY` : 'PRESS ENTER OR CLICK TO PLAY', VIEW_WIDTH / 2, 500);
}

function drawUpgrade(ctx, state) {
  dimScreen(ctx);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.ember;
  ctx.font = 'bold 40px "Trebuchet MS", system-ui, sans-serif';
  ctx.fillText(`WAVE ${state.wave} CLEARED!`, VIEW_WIDTH / 2, 120);
  ctx.fillStyle = COLORS.text;
  ctx.font = '22px "Trebuchet MS", system-ui, sans-serif';
  ctx.fillText('Choose a blessing for the next wave — click a card or press 1, 2 or 3.', VIEW_WIDTH / 2, 162);
  const cardW = 300;
  const cardH = 240;
  const gap = 36;
  const total = cardW * 3 + gap * 2;
  const startX = (VIEW_WIDTH - total) / 2;
  const y = 220;
  state.upgradeRects = [];
  state.upgradeChoices.forEach((choice, i) => {
    const x = startX + i * (cardW + gap);
    state.upgradeRects.push({ x, y, w: cardW, h: cardH });
    ctx.fillStyle = '#1d1535';
    roundRect(ctx, x, y, cardW, cardH, 14);
    ctx.fill();
    ctx.strokeStyle = COLORS.ember;
    ctx.lineWidth = 2;
    roundRect(ctx, x, y, cardW, cardH, 14);
    ctx.stroke();
    ctx.fillStyle = COLORS.ember;
    ctx.font = 'bold 44px "Trebuchet MS", system-ui, sans-serif';
    ctx.fillText(choice.icon, x + cardW / 2, y + 62);
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 22px "Trebuchet MS", system-ui, sans-serif';
    ctx.fillText(choice.name, x + cardW / 2, y + 108);
    ctx.fillStyle = COLORS.dimText;
    ctx.font = '16px "Trebuchet MS", system-ui, sans-serif';
    wrapText(ctx, choice.description, x + cardW / 2, y + 140, cardW - 36, 22);
    ctx.fillStyle = COLORS.emberHot;
    ctx.font = 'bold 18px "Trebuchet MS", system-ui, sans-serif';
    ctx.fillText(`[${i + 1}]`, x + cardW / 2, y + cardH - 24);
  });
}

function wrapText(ctx, text, cx, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  lines.forEach((l, i) => ctx.fillText(l, cx, y + i * lineHeight));
}

function drawEndScreen(ctx, state, won) {
  dimScreen(ctx);
  ctx.textAlign = 'center';
  if (won) {
    ctx.fillStyle = COLORS.lantern;
    ctx.font = 'bold 64px "Trebuchet MS", system-ui, sans-serif';
    ctx.fillText('THE LIGHT HOLDS!', VIEW_WIDTH / 2, 200);
    ctx.fillStyle = COLORS.text;
    ctx.font = '22px "Trebuchet MS", system-ui, sans-serif';
    ctx.fillText('All 10 waves are scattered. The Emberlight burns on — because of you.', VIEW_WIDTH / 2, 250);
  } else {
    ctx.fillStyle = COLORS.danger;
    ctx.font = 'bold 64px "Trebuchet MS", system-ui, sans-serif';
    ctx.fillText('THE LIGHT FADES…', VIEW_WIDTH / 2, 200);
    ctx.fillStyle = COLORS.text;
    ctx.font = '22px "Trebuchet MS", system-ui, sans-serif';
    ctx.fillText(`The dark took the lantern on wave ${state.wave}.`, VIEW_WIDTH / 2, 250);
  }
  ctx.fillStyle = COLORS.ember;
  ctx.font = 'bold 34px "Trebuchet MS", system-ui, sans-serif';
  ctx.fillText(`SCORE ${state.score}`, VIEW_WIDTH / 2, 330);
  ctx.fillStyle = COLORS.dimText;
  ctx.font = '20px "Trebuchet MS", system-ui, sans-serif';
  ctx.fillText(`Waves cleared: ${won ? WIN_WAVE : state.wave - 1}    •    Enemies beaten: ${state.kills}    •    Best: ${state.best}`, VIEW_WIDTH / 2, 378);
  ctx.fillStyle = COLORS.emberHot;
  ctx.font = 'bold 26px "Trebuchet MS", system-ui, sans-serif';
  ctx.fillText('PRESS ENTER OR CLICK TO PLAY AGAIN', VIEW_WIDTH / 2, 460);
}

export function drawGame(ctx, state) {
  ctx.save();
  if (state.shake > 0) {
    // Time-based wobble, not Math.random: a staged scene must render the same frame every time.
    ctx.translate(Math.sin(state.time * 91.7) * state.shake * 0.5, Math.cos(state.time * 113.3) * state.shake * 0.5);
  }
  drawBackground(ctx, state);

  for (const pk of state.pickups) {
    const bobY = pk.y + Math.sin(pk.bob) * 3;
    ctx.globalAlpha = pk.life < 3 ? 0.4 + 0.6 * Math.abs(Math.sin(state.time * 6)) : 1;
    ctx.fillStyle = pk.color;
    ctx.beginPath();
    ctx.arc(pk.x, bobY, pk.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(pk.kind === 'heart' ? '♥' : pk.kind === 'shard' ? '◆' : '⬡', pk.x, bobY + 0.5);
    ctx.globalAlpha = 1;
  }

  for (const e of state.enemies) drawEnemy(ctx, state, e);

  if (state.screen !== 'title') drawPlayer(ctx, state);

  for (const b of state.bullets) {
    ctx.fillStyle = COLORS.bullet;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 230, 109, 0.35)';
    ctx.beginPath();
    ctx.arc(b.x - b.vx * 0.012, b.y - b.vy * 0.012, b.radius * 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const b of state.enemyBullets) {
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const pt of state.particles) {
    ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
    if (pt.kind === 'ring') {
      ctx.strokeStyle = pt.color;
      ctx.lineWidth = pt.size;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  for (const t of state.texts) {
    ctx.globalAlpha = Math.max(0, t.life / t.maxLife);
    ctx.fillStyle = t.color;
    ctx.font = 'bold 17px "Trebuchet MS", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(t.text, t.x, t.y);
  }
  ctx.globalAlpha = 1;

  // The lantern's light and the closing dark: a hole of light around the
  // keeper, darkness thickening toward the edges as the waves climb.
  if (state.screen === 'play' || state.screen === 'pause' || state.screen === 'upgrade') {
    const p = state.player;
    const lr = lightRadius(state) * lightFlicker(state);
    const dark = darknessLevel(state);
    const hole = ctx.createRadialGradient(p.x, p.y, lr * 0.35, p.x, p.y, lr * 1.9);
    hole.addColorStop(0, 'rgba(6, 4, 16, 0)');
    hole.addColorStop(0.55, `rgba(6, 4, 16, ${dark * 0.45})`);
    hole.addColorStop(1, `rgba(6, 4, 16, ${dark})`);
    ctx.fillStyle = hole;
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    ctx.strokeStyle = 'rgba(255, 233, 163, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, lr, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (state.screen === 'play' || state.screen === 'pause' || state.screen === 'upgrade') drawHud(ctx, state);

  if (state.screen === 'title') drawTitle(ctx, state);
  else if (state.screen === 'upgrade') drawUpgrade(ctx, state);
  else if (state.screen === 'pause') {
    dimScreen(ctx);
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 52px "Trebuchet MS", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', VIEW_WIDTH / 2, 340);
    ctx.fillStyle = COLORS.dimText;
    ctx.font = '20px "Trebuchet MS", system-ui, sans-serif';
    ctx.fillText('Press P or click to keep fighting', VIEW_WIDTH / 2, 392);
  } else if (state.screen === 'over') drawEndScreen(ctx, state, false);
  else if (state.screen === 'win') drawEndScreen(ctx, state, true);

  if (state.flash > 0) {
    ctx.fillStyle = `rgba(255, 40, 60, ${state.flash * 0.35})`;
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  }
  ctx.restore();
}
