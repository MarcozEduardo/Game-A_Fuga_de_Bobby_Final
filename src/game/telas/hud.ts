/* =====================================================
 *  TELAS: HUD — pontos, tempo, vidas (corações), contador
 *  de bombas, aviso +BOMB e a marca d'água do portfólio.
 *  O.S. 002 FRAGMENTAÇÃO — movido de engine.ts, idêntico.
 * ===================================================== */
import { G, caches, HUD_HEIGHT } from '../state';

function drawHeartHUD(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, filled: boolean): void {
  const s = size;
  ctx.fillStyle = filled ? '#ff0066' : '#333';
  ctx.fillRect(x + 1 * s, y, 2 * s, s); ctx.fillRect(x + 4 * s, y, 2 * s, s);
  ctx.fillRect(x, y + 1 * s, 7 * s, s); ctx.fillRect(x, y + 2 * s, 7 * s, s);
  ctx.fillRect(x + 1 * s, y + 3 * s, 5 * s, s); ctx.fillRect(x + 2 * s, y + 4 * s, 3 * s, s);
  ctx.fillRect(x + 3 * s, y + 5 * s, 1 * s, s);
  if (filled) { ctx.fillStyle = '#ff88aa'; ctx.fillRect(x + 1 * s, y + 1 * s, s, s); }
}

function drawMiniBomb(ctx: CanvasRenderingContext2D, x: number, y: number, on: boolean): void {
  ctx.globalAlpha = on ? 1 : 0.25;
  ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#555'; ctx.fillRect(x - 4, y - 4, 3, 3);
  ctx.fillStyle = '#8a5a2a'; ctx.fillRect(x - 1, y - 10, 2, 4);
  ctx.fillStyle = on ? '#ffcc00' : '#666'; ctx.fillRect(x - 2, y - 12, 3, 3);
  ctx.globalAlpha = 1;
}

export function drawHUD(ctx: CanvasRenderingContext2D): void {
  /* PERF — gradiente criado uma única vez */
  if (!caches.hudGrad) {
    caches.hudGrad = ctx.createLinearGradient(0, 0, 0, HUD_HEIGHT);
    caches.hudGrad.addColorStop(0, '#1a1a2e');
    caches.hudGrad.addColorStop(1, '#16213e');
  }
  ctx.fillStyle = caches.hudGrad; ctx.fillRect(0, 0, ctx.canvas.width, HUD_HEIGHT);
  ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, HUD_HEIGHT); ctx.lineTo(ctx.canvas.width, HUD_HEIGHT); ctx.stroke();

  ctx.fillStyle = '#ffd700'; ctx.font = 'bold 16px "Courier New", monospace';
  ctx.fillText('PONTOS:', 12, 24);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 22px "Courier New", monospace';
  ctx.fillText(String(G.score), 12, 48);

  const tc = G.timeLeft < 30 ? '#ff4444' : '#00ff88';
  ctx.fillStyle = tc; ctx.font = 'bold 16px "Courier New", monospace';
  ctx.textAlign = 'center'; ctx.fillText('TEMPO', ctx.canvas.width / 2, 24);
  ctx.font = 'bold 26px "Courier New", monospace';
  if (G.timeLeft < 30 && Math.floor(G.frameCount / 10) % 2 === 0) ctx.fillStyle = '#ffff00';
  ctx.fillText(String(Math.ceil(G.timeLeft)), ctx.canvas.width / 2, 50);
  ctx.textAlign = 'right';

  ctx.fillStyle = '#ff6b6b'; ctx.font = 'bold 14px "Courier New", monospace';
  ctx.fillText('VIDAS:', ctx.canvas.width - 10, 22);
  for (let i = 0; i < G.player.maxLives; i++) drawHeartHUD(ctx, ctx.canvas.width - 78 + i * 26, 28, 3, i < G.player.lives);

  /* contador de bombas */
  for (let i = 0; i < 3; i++) drawMiniBomb(ctx, ctx.canvas.width - 130 - i * 20, 40, i < G.bombs);
  if (G.bombNotice > 0) {
    G.bombNotice--;
    ctx.textAlign = 'center';
    ctx.globalAlpha = Math.min(1, G.bombNotice / 40);
    ctx.fillStyle = '#00ffff'; ctx.font = 'bold 16px "Courier New", monospace';
    ctx.fillText('+BOMB', ctx.canvas.width / 2, 90);
    ctx.globalAlpha = 1; ctx.textAlign = 'left';
  }
  ctx.textAlign = 'left';
}

export function drawWatermark(ctx: CanvasRenderingContext2D): void {
  ctx.globalAlpha = 0.4 + Math.sin(G.frameCount * 0.02) * 0.1;
  ctx.fillStyle = '#ffd700'; ctx.font = 'bold 11px "Courier New", monospace';
  ctx.textAlign = 'right';
  if (G.gameState === 'GAME') {
    ctx.fillText('© Marcos Eduardo - 2026', ctx.canvas.width - 10, ctx.canvas.height - 10);
    ctx.font = '9px "Courier New", monospace'; ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.3;
    ctx.fillText('Dev with Bobby IA', ctx.canvas.width - 10, ctx.canvas.height - 22);
  }
  ctx.globalAlpha = 1; ctx.textAlign = 'left';
}
