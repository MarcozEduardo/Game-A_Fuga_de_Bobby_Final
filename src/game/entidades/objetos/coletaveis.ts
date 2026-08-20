/* =====================================================
 *  OBJETOS: COLETÁVEIS — moedas, estrelas, corações,
 *  escudo, super munição e a CHAVE DOURADA (+ coleta).
 *  O.S. 002 FRAGMENTAÇÃO — movido de engine.ts, idêntico.
 * ===================================================== */
import {
  COIN_FRAMES, STAR_FRAMES, HEALTH_FRAMES, PAL_COIN, PAL_STAR, PAL_HEALTH, drawPixelArt,
} from '../../sprites';
import { SOUNDS } from '../../audio';
import {
  G, PIXEL, drawGlow, spawnParticles, takeDamage, grantBomb, type Rect,
} from '../../state';

export function drawCollectibles(ctx: CanvasRenderingContext2D): void {
  G.coins.forEach((coin, idx) => {
    if (coin.collected) return;
    const sx = coin.x - G.camera.x;
    if (sx + coin.w < -50 || sx > ctx.canvas.width + 50) return;
    if (coin.type === 'coin') {
      ctx.globalAlpha = 0.4; drawGlow(ctx, '#ffd700', sx + coin.w / 2, coin.y + coin.h / 2, coin.w * 1.4); ctx.globalAlpha = 1;
      drawPixelArt(ctx, COIN_FRAMES, Math.floor((G.frameCount + idx * 7) / 7) % 4, PAL_COIN, sx, coin.y, PIXEL, false);
    } else {
      ctx.globalAlpha = 0.45; drawGlow(ctx, '#ff8800', sx + coin.w / 2, coin.y + coin.h / 2, coin.w * 1.4); ctx.globalAlpha = 1;
      ctx.save(); ctx.translate(sx + coin.w / 2, coin.y + coin.h / 2); ctx.rotate((G.frameCount + idx * 10) * 0.02);
      drawPixelArt(ctx, STAR_FRAMES, 0, PAL_STAR, -coin.w / 2, -coin.h / 2, PIXEL, false);
      ctx.restore();
    }
  });
  const drawHeart = (item: { x: number; y: number; w: number; h: number; collected: boolean }) => {
    if (item.collected) return;
    const sx = item.x - G.camera.x;
    if (sx < -50 || sx > ctx.canvas.width + 50) return;
    const pulse = Math.sin(G.frameCount * 0.1) * 0.2 + 1;
    ctx.globalAlpha = 0.5; drawGlow(ctx, '#ff0066', sx + item.w / 2, item.y + item.h / 2, 40); ctx.globalAlpha = 1;
    ctx.save(); ctx.translate(sx + item.w / 2, item.y + item.h / 2); ctx.scale(pulse, pulse);
    drawPixelArt(ctx, HEALTH_FRAMES, 0, PAL_HEALTH, -item.w / 2, -item.h / 2, PIXEL, false);
    ctx.restore();
  };
  drawHeart(G.healthItem);
  drawHeart(G.chamberHeart);
  if (!G.shieldItem.collected) {
    const sx = G.shieldItem.x - G.camera.x;
    if (sx >= -50 && sx <= ctx.canvas.width + 50) {
      const pulse = Math.sin(G.frameCount * 0.08) * 0.15 + 1;
      ctx.save(); ctx.translate(sx + G.shieldItem.w / 2, G.shieldItem.y + G.shieldItem.h / 2); ctx.scale(pulse, pulse);
      ctx.fillStyle = '#0088ff'; ctx.fillRect(-12, -12, 24, 24);
      ctx.fillStyle = '#00aaff'; ctx.fillRect(-10, -10, 20, 20);
      ctx.fillStyle = '#fff'; ctx.fillRect(-4, -8, 8, 4); ctx.fillRect(-2, -4, 4, 12);
      ctx.restore();
    }
  }
  if (G.superAmmo.spawned && !G.superAmmo.collected) {
    const sx = G.superAmmo.x - G.camera.x;
    if (sx >= -50 && sx <= ctx.canvas.width + 50) {
      const pulse = Math.sin(G.frameCount * 0.15) * 0.3 + 1;
      ctx.globalAlpha = 0.5; drawGlow(ctx, '#00ffff', sx + 18, G.superAmmo.y + 18, 50); ctx.globalAlpha = 1;
      ctx.save(); ctx.translate(sx + 18, G.superAmmo.y + 18); ctx.scale(pulse, pulse); ctx.rotate(G.frameCount * 0.05);
      ctx.fillStyle = '#00ffff'; ctx.fillRect(-14, -6, 28, 12);
      ctx.fillStyle = '#fff'; ctx.fillRect(-10, -4, 20, 8);
      ctx.fillStyle = '#ffff00'; ctx.fillRect(-6, -2, 12, 4);
      ctx.restore();
    }
  }
}

/* chave dourada (aparece quando o chefão explode o portão) */
export function drawGoldenKey(ctx: CanvasRenderingContext2D): void {
  if (!G.goldenKey.active || G.goldenKey.collected) return;
  G.goldenKey.bobT += 0.06;
  let kx = G.goldenKey.x - G.camera.x;
  let ky = G.goldenKey.y + Math.sin(G.goldenKey.bobT) * 8;
  if (G.keyFlyT >= 0) {
    const t = Math.min(1, G.keyFlyT / 60);
    kx = G.goldenKey.x + (G.player.x + G.player.w / 2 - G.goldenKey.x) * t - G.camera.x;
    ky = G.goldenKey.y + (G.player.y - G.goldenKey.y) * t;
  }
  ctx.globalAlpha = 0.6; drawGlow(ctx, '#ffd700', kx + 20, ky + 20, 55); ctx.globalAlpha = 1;
  ctx.fillStyle = '#ffd700';
  ctx.fillRect(kx + 6, ky, 28, 4); ctx.fillRect(kx + 2, ky + 4, 4, 16); ctx.fillRect(kx + 34, ky + 4, 4, 16);
  ctx.fillRect(kx + 6, ky + 20, 28, 4); ctx.fillRect(kx + 16, ky + 24, 8, 20);
  ctx.fillRect(kx + 24, ky + 32, 8, 4); ctx.fillRect(kx + 24, ky + 40, 8, 4);
  ctx.fillStyle = '#fff8a0'; ctx.fillRect(kx + 10, ky + 6, 8, 8);
  if (G.victoryPhase === 2 && G.keyFlyT < 0 && Math.floor(G.frameCount / 12) % 2 === 0) {
    ctx.fillStyle = '#ffd700'; ctx.font = 'bold 24px "Courier New", monospace';
    ctx.textAlign = 'center'; ctx.fillText('PEGUE A CHAVE!', ctx.canvas.width / 2, 120);
    ctx.textAlign = 'left';
  }
}

/* coleta de tudo (+ dano de contato dos inimigos) */
export function checkCollections(): void {
  const player = G.player;
  if (G.victoryPhase >= 3) return;
  G.coins.forEach((c) => {
    if (c.collected) return;
    if (player.x < c.x + c.w && player.x + player.w > c.x && player.y < c.y + c.h && player.y + player.h > c.y) {
      c.collected = true; G.score += c.points;
      if (c.type === 'coin') {
        SOUNDS.coin();
        spawnParticles(c.x + c.w / 2, c.y + c.h / 2, ['#ffd700', '#fff', '#ffa500'], 12);
        G.coinsCollected++;
        if (G.coinsCollected % 10 === 0) grantBomb();
      } else {
        SOUNDS.star();
        spawnParticles(c.x + c.w / 2, c.y + c.h / 2, ['#ffd700', '#ff8800', '#fff'], 25);
        G.starsCollected++;
        if (G.starsCollected % 3 === 0) grantBomb();
      }
    }
  });
  const collectHeart = (item: Rect & { collected: boolean }) => {
    if (!item.collected && player.x < item.x + item.w && player.x + player.w > item.x && player.y < item.y + item.h && player.y + player.h > item.y) {
      item.collected = true;
      player.lives = Math.min(player.maxLives, player.lives + 1);
      SOUNDS.heal();
      spawnParticles(item.x + item.w / 2, item.y + item.h / 2, ['#ff0066', '#ff3388', '#fff'], 30);
    }
  };
  collectHeart(G.healthItem);
  collectHeart(G.chamberHeart);
  if (!G.shieldItem.collected && player.x < G.shieldItem.x + G.shieldItem.w && player.x + player.w > G.shieldItem.x && player.y < G.shieldItem.y + G.shieldItem.h && player.y + player.h > G.shieldItem.y) {
    G.shieldItem.collected = true; player.hasShield = true; player.shieldTimer = 900;
    SOUNDS.shield();
    spawnParticles(G.shieldItem.x + G.shieldItem.w / 2, G.shieldItem.y + G.shieldItem.h / 2, ['#0088ff', '#00aaff', '#fff'], 20);
  }
  if (G.superAmmo.spawned && !G.superAmmo.collected && player.x < G.superAmmo.x + G.superAmmo.w && player.x + player.w > G.superAmmo.x && player.y < G.superAmmo.y + G.superAmmo.h && player.y + player.h > G.superAmmo.y) {
    G.superAmmo.collected = true; player.hasSuperAmmo = true; player.superShots = 2;
    SOUNDS.superAmmo();
    spawnParticles(G.superAmmo.x + 18, G.superAmmo.y + 18, ['#00ffff', '#fff', '#ffff00'], 30);
  }
  if (!player.invulnerable && !player.hasShield) {
    G.enemies.forEach((e) => {
      if (player.x + 6 < e.x + e.w - 6 && player.x + player.w - 6 > e.x + 6 && player.y + player.h > e.y + e.h * 0.5 && player.y + 6 < e.y + e.h && player.velY <= 0) takeDamage();
    });
  }
  /* CHAVE DOURADA */
  if (G.goldenKey.active && !G.goldenKey.collected) {
    const kx = G.goldenKey.x, ky = G.goldenKey.y;
    if (player.x + player.w > kx && player.x < kx + G.goldenKey.w && player.y + player.h > ky && player.y < ky + G.goldenKey.h) {
      G.goldenKey.collected = true;
      SOUNDS.keyGet();
      spawnParticles(kx + 20, ky + 20, ['#ffd700', '#fff', '#fff8a0'], 40);
      G.victoryPhase = 3; G.cutsceneTimer = 0; G.keyFlyT = -1;
      player.shooting = false;
    }
  }
}
