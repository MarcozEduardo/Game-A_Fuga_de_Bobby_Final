/* =====================================================
 *  CENÁRIO: FUNDO — céu, montanhas (parallax), lua/sol,
 *  estrelas e o nascer do sol quando pisa no MARCOS.
 *  O.S. 002 FRAGMENTAÇÃO — movido de engine.ts, idêntico.
 * ===================================================== */
import { G, caches, HUD_HEIGHT, LEVEL_WIDTH, isTouch, drawGlow } from '../state';

function lerpColor(c1: string, c2: string, t: number): string {
  const r1 = parseInt(c1.slice(1, 3), 16), g1 = parseInt(c1.slice(3, 5), 16), b1 = parseInt(c1.slice(5, 7), 16);
  const r2 = parseInt(c2.slice(1, 3), 16), g2 = parseInt(c2.slice(3, 5), 16), b2 = parseInt(c2.slice(5, 7), 16);
  return `rgb(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)})`;
}

function drawMountains(ctx: CanvasRenderingContext2D, factor: number, baseY: number, color: string, amp: number): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, ctx.canvas.height);
  const off = G.camera.x * factor;
  for (let x = 0; x <= ctx.canvas.width + 60; x += 60) {
    const wx = x + off;
    const y = baseY - Math.abs(Math.sin(wx * 0.008) * amp) - Math.abs(Math.sin(wx * 0.003) * amp * 0.6);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(ctx.canvas.width, ctx.canvas.height);
  ctx.closePath();
  ctx.fill();
}

export function drawBackground(ctx: CanvasRenderingContext2D): void {
  if (G.hasSteppedOnMarcos && G.sunriseProgress < 1) G.sunriseProgress += 0.0006;
  let top: string, bot: string;
  if (!G.hasSteppedOnMarcos) { top = '#0a0a1a'; bot = '#1a1a3a'; }
  else if (G.sunriseProgress < 0.5) { const t = G.sunriseProgress * 2; top = lerpColor('#0a0a1a', '#2c3e50', t); bot = lerpColor('#1a1a3a', '#4a69bd', t); }
  else { const t = (G.sunriseProgress - 0.5) * 2; top = lerpColor('#2c3e50', '#87CEEB', t); bot = lerpColor('#4a69bd', '#98D8C8', t); }

  /* PERF — gradiente do céu recriado só quando a cor muda */
  const skyKey = top + '|' + bot;
  if (skyKey !== caches.skyKey) {
    caches.skyGrad = ctx.createLinearGradient(0, HUD_HEIGHT, 0, ctx.canvas.height);
    caches.skyGrad.addColorStop(0, top);
    caches.skyGrad.addColorStop(1, bot);
    caches.skyKey = skyKey;
  }
  ctx.fillStyle = caches.skyGrad!;
  ctx.fillRect(0, HUD_HEIGHT, ctx.canvas.width, ctx.canvas.height - HUD_HEIGHT);

  /* montanhas em parallax */
  drawMountains(ctx, 0.25, 250, '#1a2440', 90);
  drawMountains(ctx, 0.45, 285, '#232f52', 70);

  /* lua (antes do nascer do sol) */
  if (G.sunriseProgress < 0.6) {
    const ma = Math.max(0, 1 - G.sunriseProgress * 1.7);
    const mx = 700 - G.camera.x * 0.1;
    ctx.globalAlpha = ma * 0.5; drawGlow(ctx, '#fffbe6', mx, 100, 55);
    ctx.globalAlpha = ma; ctx.fillStyle = '#fffbe6';
    ctx.beginPath(); ctx.arc(mx, 100, 30, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ddd';
    ctx.beginPath(); ctx.arc(mx - 10, 95, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(mx + 10, 108, 4, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
  /* sol nascendo */
  if (G.sunriseProgress > 0.2) {
    const sa = Math.min(1, (G.sunriseProgress - 0.2) * 2);
    const sy = 450 - G.sunriseProgress * 350;
    const sunX = 100 - G.camera.x * 0.1;
    ctx.globalAlpha = sa * 0.5; drawGlow(ctx, '#FFFACD', sunX, sy, 70);
    ctx.globalAlpha = sa; ctx.fillStyle = '#FFFACD';
    ctx.beginPath(); ctx.arc(sunX, sy, 35, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
  /* estrelas (metade no mobile — PERF, sem tremido) */
  const sta = Math.max(0, 1 - G.sunriseProgress * 1.5);
  if (sta > 0) {
    ctx.fillStyle = `rgba(255,255,255,${sta})`;
    for (let i = 0; i < 80; i++) {
      if (isTouch && i % 2 === 1) continue;
      const sx = (((i * 137 - G.camera.x * 0.3) % LEVEL_WIDTH) + LEVEL_WIDTH) % LEVEL_WIDTH;
      const sy = 70 + ((i * 23) % 200);
      if (sx >= -10 && sx <= ctx.canvas.width + 10) ctx.fillRect(sx, sy, i % 10 === 0 ? 2 : 1.5, 1.5);
    }
  }
}
