/* =====================================================
 *  CENÁRIO: PLATAFORMAS — o CHÃO do jogo.
 *  Pré-renderizado na "foto" (levelLayer) — PERF.
 *  Inclui a colina (2150→2400), os letreiros MARCOS e
 *  PORTFOLIO e o aviso do abismo.
 *  O.S. 002 FRAGMENTAÇÃO — movido de engine.ts, idêntico.
 * ===================================================== */
import {
  G, caches, nameBlocks, titleBlocks, nameBounds, LEVEL_WIDTH, type Rect,
} from '../state';

/* altura do chão da colina naquele x (ou null fora dela) */
export function hillY(x: number): number | null {
  if (x < 2150 || x > 2400) return null;
  return 350 - ((x - 2150) / 250) * 45;
}

function paintPlatform(g: CanvasRenderingContext2D, p: Rect, off: number): void {
  const sx = p.x - off;
  const isGround = p.h === 100, isSmall = p.w <= 60;
  if (isGround) {
    g.fillStyle = '#5dbb63'; g.fillRect(sx, p.y, p.w, 10);
    g.fillStyle = '#3a8c41'; g.fillRect(sx, p.y + 10, p.w, 6);
    const dg = g.createLinearGradient(0, p.y + 16, 0, p.y + p.h);
    dg.addColorStop(0, '#6B3F2A'); dg.addColorStop(1, '#3d2010');
    g.fillStyle = dg; g.fillRect(sx, p.y + 16, p.w, p.h - 16);
    for (let x = 0; x < p.w; x += 34) {
      const h = (x * 2654435761) >>> 28;
      g.fillStyle = '#55331f'; g.fillRect(sx + x + 6, p.y + 30 + (h % 3) * 14, 10, 6);
      g.fillStyle = '#7a4a30'; g.fillRect(sx + x + 18, p.y + 24 + (h % 4) * 10, 7, 5);
    }
    for (let x = 8; x < p.w; x += 52) {
      g.fillStyle = '#4aa552'; g.fillRect(sx + x, p.y - 4, 2, 5); g.fillRect(sx + x + 3, p.y - 6, 2, 7);
    }
  } else if (isSmall) {
    g.fillStyle = '#c0392b'; g.fillRect(sx, p.y, p.w, p.h);
    g.fillStyle = '#e74c3c'; g.fillRect(sx + 2, p.y + 2, p.w - 4, p.h - 4);
  } else {
    g.fillStyle = '#8B5E3C'; g.fillRect(sx, p.y, p.w, p.h);
    g.fillStyle = '#c8945a'; g.fillRect(sx, p.y, p.w, 5);
    g.fillStyle = 'rgba(60,30,10,0.55)'; g.fillRect(sx, p.y + p.h - 3, p.w, 3); g.fillRect(sx + p.w - 3, p.y + 5, 3, p.h - 8);
    g.fillStyle = 'rgba(255,220,170,0.25)'; g.fillRect(sx, p.y + 5, 3, p.h - 8);
    g.fillStyle = 'rgba(70,40,15,0.35)'; g.fillRect(sx + 10, p.y + 8, p.w - 20, 2); g.fillRect(sx + 6, p.y + 13, p.w - 12, 1);
  }
}

/* "fotografa" o chão uma vez (e após qualquer mudança de plataforma) */
export function buildLevelLayer(): void {
  caches.levelLayer = document.createElement('canvas');
  caches.levelLayer.width = LEVEL_WIDTH; caches.levelLayer.height = 450;
  const g = caches.levelLayer.getContext('2d')!;
  for (let i = 0; i < G.platforms.length; i++) paintPlatform(g, G.platforms[i], 0);
  /* colina */
  g.beginPath(); g.moveTo(2150, 350);
  for (let x = 2150; x <= 2400; x += 5) g.lineTo(x, hillY(x)!);
  g.lineTo(2400, 450); g.lineTo(2150, 450); g.closePath();
  const hg = g.createLinearGradient(0, 300, 0, 450);
  hg.addColorStop(0, '#6B3F2A'); hg.addColorStop(1, '#3d2010');
  g.fillStyle = hg; g.fill();
  for (let x = 2150; x < 2400; x += 8) {
    const y = hillY(x + 4)!;
    g.fillStyle = '#5dbb63'; g.fillRect(x, y, 8, 8);
    g.fillStyle = '#3a8c41'; g.fillRect(x, y + 8, 8, 5);
    if ((x * 2654435761) >>> 31) { g.fillStyle = '#4aa552'; g.fillRect(x + 3, y - 4, 2, 5); g.fillRect(x + 6, y - 6, 2, 7); }
  }
}

export function drawPlatforms(ctx: CanvasRenderingContext2D): void {
  if (caches.levelLayer) {
    const sx = Math.max(0, Math.min(LEVEL_WIDTH - ctx.canvas.width, Math.floor(G.camera.x)));
    ctx.drawImage(caches.levelLayer, sx, 0, ctx.canvas.width, ctx.canvas.height, 0, 0, ctx.canvas.width, ctx.canvas.height);
  }
  /* letreiro MARCOS (dourado, brilha) */
  nameBlocks.forEach((b) => {
    const sx = b.x - G.camera.x;
    if (sx + b.w < -10 || sx > ctx.canvas.width + 10) return;
    const gl = Math.sin(G.frameCount * 0.03 + b.x * 0.01) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(255,215,0,${gl})`; ctx.fillRect(sx, b.y, b.w, b.h);
    ctx.fillStyle = '#B8860B'; ctx.fillRect(sx, b.y, 1, b.h); ctx.fillRect(sx, b.y, b.w, 1);
  });
  /* letreiro PORTFOLIO (prata) */
  titleBlocks.forEach((b) => {
    const sx = b.x - G.camera.x;
    if (sx + b.w < -10 || sx > ctx.canvas.width + 10) return;
    const gl = Math.sin(G.frameCount * 0.04 + b.x * 0.02) * 0.2 + 0.8;
    ctx.fillStyle = `rgba(200,200,220,${gl})`; ctx.fillRect(sx, b.y, b.w, b.h);
  });
  /* aura de cura sobre o nome */
  if (!G.player.healedByName && G.player.lives < G.player.maxLives) {
    const sx = nameBounds.x - G.camera.x;
    if (sx > -400 && sx < ctx.canvas.width + 400) {
      ctx.fillStyle = `rgba(0,255,100,${Math.sin(G.frameCount * 0.1) * 0.15 + 0.15})`;
      ctx.fillRect(sx, nameBounds.y, nameBounds.w, nameBounds.h);
    }
  }
  drawAbyssWarning(ctx, 750, 950);
}

function drawAbyssWarning(ctx: CanvasRenderingContext2D, start: number, end: number): void {
  const sx = start - G.camera.x, w = end - start;
  if (sx + w < 0 || sx > ctx.canvas.width) return;
  const grad = ctx.createLinearGradient(0, 350, 0, 450);
  grad.addColorStop(0, 'rgba(0,0,0,0)'); grad.addColorStop(1, 'rgba(0,0,0,0.8)');
  ctx.fillStyle = grad; ctx.fillRect(sx, 350, w, 100);
}
