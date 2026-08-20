/* =====================================================
 *  TELAS: CARDS — derrota (mundo + tela), tela final de
 *  vitória, cards brancos arredondados com faixa colorida,
 *  botão do LinkedIn DENTRO dos cards e utilidades de
 *  clique/toque.
 *  O.S. 002 FRAGMENTAÇÃO — movido de engine.ts, idêntico.
 * ===================================================== */
import {
  BOBBY_FACE, BOBBY_KNEEL, PAL_HERO_1, PAL_BOBBY, ENEMY_FRAMES, PAL_ENEMY,
  drawPixelArt, drawSingleFrame,
} from '../sprites';
import { SOUNDS } from '../audio';
import { G, roundRect, isTouch } from '../state';

/* ---------- utilidades compartilhadas com o engine ---------- */
export function toCanvasPoint(ctx: CanvasRenderingContext2D, clientX: number, clientY: number) {
  const r = ctx.canvas.getBoundingClientRect();
  return { x: ((clientX - r.left) / r.width) * ctx.canvas.width, y: ((clientY - r.top) / r.height) * ctx.canvas.height };
}
export function hitLinkedinButton(x: number, y: number): boolean {
  return G.liBtn.active && x >= G.liBtn.x && x <= G.liBtn.x + G.liBtn.w && y >= G.liBtn.y && y <= G.liBtn.y + G.liBtn.h;
}

function drawLinkedinCardButton(ctx: CanvasRenderingContext2D, cx: number, y: number): void {
  const w = 250, h = 34;
  G.liBtn.x = cx - w / 2; G.liBtn.y = y; G.liBtn.w = w; G.liBtn.h = h; G.liBtn.active = true;
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#00a0dc'); g.addColorStop(1, '#0077B5');
  ctx.fillStyle = g; roundRect(ctx, cx - w / 2, y, w, h, 10); ctx.fill();
  ctx.strokeStyle = '#66ccff'; ctx.lineWidth = 1.5; roundRect(ctx, cx - w / 2, y, w, h, 10); ctx.stroke();
  ctx.fillStyle = '#fff'; roundRect(ctx, cx - w / 2 + 10, y + 7, 20, 20, 4); ctx.fill();
  ctx.fillStyle = '#0077B5'; ctx.font = 'bold 13px "Courier New", monospace';
  ctx.textAlign = 'center'; ctx.fillText('in', cx - w / 2 + 20, y + 22);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 14px "Courier New", monospace';
  ctx.fillText('Conhecer o Marcos', cx + 16, y + 22);
  ctx.textAlign = 'left';
}

function drawPopupCard(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, stripe: [string, string], title: string): void {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 6;
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#eef1f6');
  ctx.fillStyle = g; roundRect(ctx, x, y, w, h, 18); ctx.fill();
  ctx.restore();
  const sg = ctx.createLinearGradient(x, 0, x + w, 0);
  sg.addColorStop(0, stripe[0]); sg.addColorStop(1, stripe[1]);
  ctx.fillStyle = sg;
  roundRect(ctx, x, y, w, 46, 18); ctx.fill();
  ctx.fillRect(x, y + 24, w, 22);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 18px "Courier New", monospace';
  ctx.textAlign = 'center'; ctx.fillText(title, x + w / 2, y + 30);
  ctx.textAlign = 'left';
}

function drawActionPill(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, text: string): void {
  const pulse = Math.sin(G.frameCount * 0.1) * 0.15 + 0.85;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#ffd700';
  roundRect(ctx, cx - w / 2, cy - 18, w, 36, 18); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#1f2430'; ctx.font = 'bold 15px "Courier New", monospace';
  ctx.textAlign = 'center'; ctx.fillText(text, cx, cy + 5);
  ctx.textAlign = 'left';
}

/* ---------- derrota ---------- */
export function drawDefeatWorld(ctx: CanvasRenderingContext2D): void {
  const sx = G.player.x - G.camera.x;
  if (G.defeatPhase < 2) {
    drawSingleFrame(ctx, BOBBY_KNEEL, PAL_HERO_1, sx, G.player.y - 10, 3, G.player.dir === -1);
    G.enemies.forEach((e) => {
      const esx = e.x - G.camera.x;
      if (esx > -50 && esx < ctx.canvas.width + 50) {
        const lookDir = G.player.x > e.x ? 1 : -1;
        drawPixelArt(ctx, ENEMY_FRAMES, 0, PAL_ENEMY, esx, e.y, 3, lookDir === -1);
      }
    });
  }
  G.defeatExplosions.forEach((exp) => {
    ctx.globalAlpha = Math.max(0, exp.life / 30);
    ctx.fillStyle = exp.size % 2 > 1 ? '#ff6600' : '#ffaa00';
    ctx.beginPath(); ctx.arc(exp.x - G.camera.x, exp.y, exp.size, 0, Math.PI * 2); ctx.fill();
  });
  ctx.globalAlpha = 1;
  if (G.defeatPhase === 2) {
    const sz = G.defeatTimer * 5;
    ctx.globalAlpha = Math.max(0, 1 - G.defeatTimer / 60);
    ctx.fillStyle = '#ff4400';
    ctx.beginPath(); ctx.arc(sx + G.player.w / 2, G.player.y + G.player.h / 2, sz, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
}

export function drawDefeatScreen(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  /* "Não desista!" durante a explosão do Bobby */
  if (G.defeatPhase >= 1 && G.defeatPhase <= 2) {
    const a = 0.55 + 0.45 * Math.sin(G.frameCount * 0.15);
    ctx.globalAlpha = a; ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700'; ctx.font = 'bold 26px "Courier New", monospace';
    ctx.fillText('Não desista!', ctx.canvas.width / 2, 120);
    ctx.fillStyle = '#e6e6e6'; ctx.font = '15px "Courier New", monospace';
    ctx.fillText('Tente de novo...', ctx.canvas.width / 2, 148);
    ctx.globalAlpha = 1; ctx.textAlign = 'left';
  }
  if (G.defeatPhase >= 3) {
    const pw = Math.min(470, ctx.canvas.width - 24), ph = 276;
    const px = ctx.canvas.width / 2 - pw / 2, py = G.defeatSignY;
    drawPopupCard(ctx, px, py, pw, ph, ['#e74c3c', '#c0392b'], 'GAME OVER');
    drawPixelArt(ctx, BOBBY_FACE, 0, ['#95a5a6', '#4a5568', '#fff', '#cbd5e0', '#2d3748'], px + 28, py + 80, 3, false);
    ctx.fillStyle = '#1f2430'; ctx.font = 'bold 22px "Courier New", monospace';
    ctx.fillText('VOCÊ FOI DERROTADO', px + 100, py + 100);
    ctx.fillStyle = '#5a6478'; ctx.font = '15px "Courier New", monospace';
    ctx.fillText(`Pontuação: ${G.score}`, px + 100, py + 128);
    ctx.fillText('O projeto não pode parar...', px + 100, py + 150);
    if (G.defeatPhase >= 4) {
      drawActionPill(ctx, ctx.canvas.width / 2, py + 192, 300, isTouch ? '[ TOQUE ] TENTAR DE NOVO' : '[ ESPAÇO ] TENTAR DE NOVO');
      ctx.fillStyle = '#8a93a8'; ctx.font = '13px "Courier New", monospace';
      ctx.textAlign = 'center'; ctx.fillText('Não desista! Tente de novo ou...', ctx.canvas.width / 2, py + 224);
      drawLinkedinCardButton(ctx, ctx.canvas.width / 2, py + 233);
      ctx.textAlign = 'left';
    } else G.liBtn.active = false;
  } else G.liBtn.active = false;
}

export function updateDefeat(): void {
  G.defeatTimer++;
  if (G.defeatPhase === 0) { if (G.defeatTimer > 60) { G.defeatPhase = 1; G.defeatTimer = 0; } }
  else if (G.defeatPhase === 1) {
    if (G.defeatTimer % 15 === 0) {
      G.defeatExplosions.push({ x: G.player.x + Math.random() * G.player.w, y: G.player.y + Math.random() * G.player.h, size: 5 + Math.random() * 10, life: 30 });
      SOUNDS.hit();
    }
    if (G.defeatTimer > 90) { G.defeatPhase = 2; G.defeatTimer = 0; SOUNDS.explosion(); }
  } else if (G.defeatPhase === 2) { if (G.defeatTimer > 60) { G.defeatPhase = 3; G.defeatTimer = 0; } }
  else if (G.defeatPhase === 3) {
    G.defeatSignY += 8;
    if (G.defeatSignY >= 70) { G.defeatSignY = 70; G.defeatPhase = 4; }
  }
  for (let i = G.defeatExplosions.length - 1; i >= 0; i--) {
    G.defeatExplosions[i].life--; G.defeatExplosions[i].size += 0.5;
    if (G.defeatExplosions[i].life <= 0) G.defeatExplosions.splice(i, 1);
  }
}

/* ---------- tela final de vitória ---------- */
export function drawVictoryScreen(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  const confettiColors = ['#ff0066', '#ffd700', '#00ff88', '#00aaff', '#ff8800', '#ff00ff', '#00ffff', '#ffff00'];
  for (let i = 0; i < 8; i++) {
    const fx = 80 + i * (ctx.canvas.width - 160) / 7;
    const fy = 60 + Math.sin(G.frameCount * 0.08 + i) * 30;
    ctx.fillStyle = confettiColors[i];
    ctx.globalAlpha = 0.3 + Math.sin(G.frameCount * 0.1 + i) * 0.2;
    ctx.beginPath(); ctx.arc(fx, fy, 12 + Math.sin(G.frameCount * 0.15 + i) * 8, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  const pw = Math.min(520, ctx.canvas.width - 24), ph = 346;
  const px = ctx.canvas.width / 2 - pw / 2, py = 52;
  drawPopupCard(ctx, px, py, pw, ph, ['#2ecc71', '#f1c40f'], 'MISSÃO CUMPRIDA');
  drawPixelArt(ctx, BOBBY_FACE, Math.floor(G.frameCount / 15) % 2, PAL_BOBBY, ctx.canvas.width / 2 - 34, py + 56, 4, false);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#2ecc71'; ctx.font = 'bold 36px "Courier New", monospace';
  ctx.fillText('VITÓRIA!', ctx.canvas.width / 2, py + 152);
  ctx.fillStyle = '#1f2430'; ctx.font = 'bold 19px "Courier New", monospace';
  ctx.fillText(`PONTUAÇÃO FINAL: ${G.score}`, ctx.canvas.width / 2, py + 184);
  ctx.fillStyle = '#5a6478'; ctx.font = '15px "Courier New", monospace';
  ctx.fillText('Projeto entregue com sucesso!', ctx.canvas.width / 2, py + 210);
  ctx.fillStyle = '#8a93a8'; ctx.font = '13px "Courier New", monospace';
  ctx.fillText('- Bobby IA, Portfolio do Marcão', ctx.canvas.width / 2, py + 230);
  drawActionPill(ctx, ctx.canvas.width / 2, py + 262, 300, isTouch ? '[ TOQUE ] JOGAR DE NOVO' : '[ ESPAÇO ] JOGAR DE NOVO');
  ctx.fillStyle = '#8a93a8'; ctx.font = '13px "Courier New", monospace';
  ctx.fillText('Curtiu a jornada? Vamos conversar!', ctx.canvas.width / 2, py + 296);
  drawLinkedinCardButton(ctx, ctx.canvas.width / 2, py + 305);
  ctx.textAlign = 'left';
}
