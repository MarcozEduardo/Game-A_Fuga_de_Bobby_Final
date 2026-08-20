/* =====================================================
 *  TELAS: LOADING + INTRO (terminal do Bobby, com
 *  scroll automático no mobile).
 *  O.S. 002 FRAGMENTAÇÃO — movido de engine.ts, idêntico.
 * ===================================================== */
import { BOBBY_FACE, BOBBY_RUN, PAL_BOBBY, drawPixelArt } from '../sprites';
import { SOUNDS } from '../audio';
import { G, INTRO_FULL_TEXT, isTouch } from '../state';

export function drawLoadingScreen(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  for (let y = 0; y < ctx.canvas.height; y += 4) { ctx.fillStyle = 'rgba(0,255,0,0.03)'; ctx.fillRect(0, y, ctx.canvas.width, 2); }
  ctx.fillStyle = '#00ff44'; ctx.font = 'bold 28px "Courier New", monospace';
  ctx.textAlign = 'center'; ctx.fillText('BOBBY IA', ctx.canvas.width / 2, 120);
  ctx.fillStyle = '#00aa33'; ctx.font = '16px "Courier New", monospace';
  ctx.fillText('Portfolio do Marcão', ctx.canvas.width / 2, 150);
  const bobbyX = ctx.canvas.width * 0.1 + G.loadProgress * (ctx.canvas.width * 0.7) / 100;
  G.bobbyRunFrame = Math.floor(G.frameCount / 6) % 3;
  drawPixelArt(ctx, BOBBY_RUN, G.bobbyRunFrame, PAL_BOBBY, bobbyX, 220, 4, false);
  const barX = ctx.canvas.width * 0.19, barY = 300, barW = ctx.canvas.width * 0.62, barH = 25;
  ctx.strokeStyle = '#00ff44'; ctx.lineWidth = 2; ctx.strokeRect(barX, barY, barW, barH);
  const fillW = barW * (G.loadProgress / 100);
  ctx.fillStyle = '#00ff44'; ctx.fillRect(barX + 2, barY + 2, Math.max(0, fillW - 4), barH - 4);
  ctx.fillStyle = '#00ff44'; ctx.font = 'bold 16px "Courier New", monospace';
  ctx.fillText(`${Math.floor(G.loadProgress)}%`, ctx.canvas.width / 2, barY + barH + 30);
  ctx.textAlign = 'left';
  G.loadProgress += 0.5;
  if (G.loadProgress >= 100) {
    G.loadProgress = 100;
    if (G.frameCount % 50 === 0) { G.gameState = 'INTRO'; G.introTimer = 0; SOUNDS.boot(); }
  }
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, it: number): string[] {
  ctx.font = `${Math.round(14 * it)}px "Courier New", monospace`;
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  words.forEach((word) => {
    const test = line + word + ' ';
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word + ' '; }
    else line = test;
  });
  if (line) lines.push(line);
  return lines;
}

export function drawIntroScreen(ctx: CanvasRenderingContext2D): void {
  const it = isTouch ? 1.4 : 1;
  ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  for (let y = 0; y < ctx.canvas.height; y += 4) { ctx.fillStyle = 'rgba(0,255,0,0.03)'; ctx.fillRect(0, y, ctx.canvas.width, 2); }
  ctx.strokeStyle = '#00ff44'; ctx.lineWidth = 2;
  ctx.strokeRect(20, 14, ctx.canvas.width - 40, ctx.canvas.height - 28);
  ctx.fillStyle = '#002211'; ctx.fillRect(21, 15, ctx.canvas.width - 42, 28);
  ctx.fillStyle = '#00ff44'; ctx.font = `bold ${Math.round(13 * it)}px "Courier New", monospace`;
  ctx.textAlign = 'center'; ctx.fillText('[ BOBBY IA - TERMINAL v1.0 ]', ctx.canvas.width / 2, 36);

  const faceFrame = G.introComplete ? 0 : Math.floor(G.frameCount / 10) % 2;
  drawPixelArt(ctx, BOBBY_FACE, faceFrame, PAL_BOBBY, 40, isTouch ? 52 : 60, isTouch ? 4 : 4, false);
  ctx.fillStyle = '#00ff44'; ctx.font = `bold ${Math.round(17 * it)}px "Courier New", monospace`;
  ctx.textAlign = 'left'; ctx.fillText('Bobby IA', 115, isTouch ? 78 : 82);
  ctx.fillStyle = '#006622'; ctx.font = `${Math.round(12 * it)}px "Courier New", monospace`;
  ctx.fillText('Sistema Semantico v2.0', 115, isTouch ? 98 : 100);
  ctx.fillText('Criado por Marcos Eduardo', 115, isTouch ? 116 : 116);

  G.introTimer++;
  if (!G.introComplete && !G.introSkipped) {
    if (G.introTimer % 2 === 0 && G.introCharIndex < INTRO_FULL_TEXT.length) {
      G.introCharIndex++;
      if (G.introTimer % 4 === 0) SOUNDS.type();
    }
    if (G.introCharIndex >= INTRO_FULL_TEXT.length) G.introComplete = true;
  }
  const visibleText = G.introSkipped ? INTRO_FULL_TEXT : INTRO_FULL_TEXT.substring(0, G.introCharIndex);
  const lineH = Math.round(19 * it);
  const topY = isTouch ? 136 : 150;
  const bottomLimit = ctx.canvas.height - 60;
  const lines = wrapText(ctx, visibleText, ctx.canvas.width - 80, it);
  /* scroll automático: mostra sempre as últimas linhas */
  const maxLines = Math.max(1, Math.floor((bottomLimit - topY) / lineH));
  const start = Math.max(0, lines.length - maxLines);
  ctx.fillStyle = '#00ff44';
  ctx.font = `${Math.round(14 * it)}px "Courier New", monospace`;
  let lastY = topY;
  for (let i = start; i < lines.length; i++) {
    lastY = topY + (i - start) * lineH;
    ctx.fillText(lines[i], 40, lastY);
  }
  if ((!G.introComplete && !G.introSkipped) || Math.floor(G.frameCount / 15) % 2 === 0) {
    const cursorX = 40 + ctx.measureText(lines[lines.length - 1] ?? '').width;
    ctx.fillRect(cursorX + 2, lastY - 12 * it, 9 * it, 15 * it);
  }
  if (G.introComplete || G.introSkipped) {
    const pulse = Math.sin(G.frameCount * 0.08) * 0.3 + 0.7;
    ctx.globalAlpha = pulse; ctx.fillStyle = '#00ff44';
    ctx.font = `bold ${Math.round(17 * it)}px "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(isTouch ? '[ TOQUE PARA COMECAR ]' : '[ PRESSIONE ESPACO PARA COMECAR ]', ctx.canvas.width / 2, ctx.canvas.height - 30);
    ctx.globalAlpha = 1; ctx.textAlign = 'left';
  }
}
