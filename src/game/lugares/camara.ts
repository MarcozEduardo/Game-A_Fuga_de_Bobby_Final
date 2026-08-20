/* =====================================================
 *  LUGAR: CÂMARA DA MINA — o covil do chefão (2560–3400).
 *  Fundo: escuridão, teto de rocha com estalactites,
 *  vigas de madeira e lampiões tremulando.
 *  Frente: piso de pedra, trilhos de vagoneta, os ~10
 *  soldados do Bobby já mortos e o PORTÃO da fortaleza.
 *  O.S. 002 FRAGMENTAÇÃO — movido de engine.ts, idêntico.
 * ===================================================== */
import { BOBBY_RUN, drawPixelArt } from '../sprites';
import {
  G, PIXEL, PAL_ROBO_GRAY, HUD_HEIGHT, CHAMBER_X0, CHAMBER_X1,
  GATE_X, GATE_W, drawGlow,
} from '../state';

export function drawMineChamberBack(ctx: CanvasRenderingContext2D): void {
  const sx0 = CHAMBER_X0 - G.camera.x, sx1 = CHAMBER_X1 - G.camera.x;
  if (sx1 < -20 || sx0 > ctx.canvas.width + 20) return;
  const left = Math.max(-20, sx0), right = Math.min(ctx.canvas.width + 20, sx1);
  /* escuridão da caverna por cima do céu */
  ctx.fillStyle = 'rgba(22,15,10,0.9)';
  ctx.fillRect(left, HUD_HEIGHT, right - left, 350 - HUD_HEIGHT);
  /* teto de rocha */
  ctx.fillStyle = '#3a2f26'; ctx.fillRect(sx0, HUD_HEIGHT, sx1 - sx0, 70 - HUD_HEIGHT + 10);
  ctx.fillStyle = '#2c231c';
  for (let x = CHAMBER_X0; x < CHAMBER_X1; x += 34) {
    const tx = x - G.camera.x;
    const jag = 12 + ((x * 2654435761) >>> 28);
    ctx.beginPath(); ctx.moveTo(tx, 80); ctx.lineTo(tx + 17, 80 + jag); ctx.lineTo(tx + 34, 80); ctx.closePath(); ctx.fill();
  }
  /* vigas + lampiões */
  for (let x = 2620; x < CHAMBER_X1; x += 160) {
    const vx = x - G.camera.x;
    ctx.fillStyle = '#6e4a2a'; ctx.fillRect(vx, 88, 12, 262);
    ctx.fillStyle = '#8a5e36'; ctx.fillRect(vx + 2, 88, 3, 262);
    ctx.fillStyle = '#6e4a2a'; ctx.fillRect(vx - 22, 76, 56, 12);
    const flick = 0.45 + 0.3 * Math.sin(G.frameCount * 0.12 + x);
    ctx.fillStyle = '#333'; ctx.fillRect(vx + 24, 88, 2, 10);
    ctx.fillStyle = `rgba(255,200,80,${flick.toFixed(2)})`; ctx.fillRect(vx + 20, 98, 10, 12);
    ctx.globalAlpha = flick * 0.4; drawGlow(ctx, '#ffc850', vx + 25, 104, 34); ctx.globalAlpha = 1;
  }
}

export function drawMineChamberFront(ctx: CanvasRenderingContext2D): void {
  const sx0 = CHAMBER_X0 - G.camera.x, sx1 = CHAMBER_X1 - G.camera.x;
  if (sx1 < -20 || sx0 > ctx.canvas.width + 20) return;
  /* piso de pedra + trilhos de vagoneta */
  ctx.fillStyle = '#4a3a2c'; ctx.fillRect(sx0, 350, sx1 - sx0 - 15, 14);
  ctx.fillStyle = '#3a2c20'; ctx.fillRect(sx0, 360, sx1 - sx0 - 15, 4);
  for (let x = CHAMBER_X0 + 6; x < CHAMBER_X1 - 20; x += 26) {
    const tx = x - G.camera.x;
    ctx.fillStyle = '#2e2218'; ctx.fillRect(tx, 352, 14, 10);
    ctx.fillStyle = '#777'; ctx.fillRect(tx - 4, 353, 22, 2); ctx.fillRect(tx - 4, 359, 22, 2);
  }
}

/* os ~10 soldados do Bobby que o chefão já matou */
const soldadosMortos = [2590, 2650, 2720, 2790, 2860, 2930, 3000, 3070, 3140, 3210];
export function drawDeadSoldiers(ctx: CanvasRenderingContext2D): void {
  soldadosMortos.forEach((sx, i) => {
    const x = sx - G.camera.x;
    if (x < -40 || x > ctx.canvas.width + 40) return;
    ctx.save(); ctx.translate(x + 16, 344); ctx.rotate(-Math.PI / 2);
    ctx.globalAlpha = 0.55;
    drawPixelArt(ctx, BOBBY_RUN, 0, PAL_ROBO_GRAY, -18, -16, PIXEL, i % 2 === 0);
    ctx.restore(); ctx.globalAlpha = 1;
  });
}

/* portão da fortaleza (bloqueia a saída até o boss morrer/explodir) */
export function drawFortressGate(ctx: CanvasRenderingContext2D): void {
  const gx = GATE_X - G.camera.x;
  if (gx > ctx.canvas.width + 40 || gx + GATE_W < -40) return;
  if (G.gateDestroyed) {
    /* destroços do portão explodido */
    ctx.fillStyle = '#3a2f26';
    ctx.fillRect(gx - 4, 320, GATE_W + 8, 30);
    ctx.fillStyle = '#55443a';
    ctx.fillRect(gx, 330, 10, 20); ctx.fillRect(gx + 14, 326, 12, 24);
    return;
  }
  ctx.fillStyle = '#555'; ctx.fillRect(gx - 6, 224, GATE_W + 12, 8);
  ctx.fillStyle = '#666'; ctx.fillRect(gx, 230, GATE_W, 120);
  ctx.fillStyle = '#444';
  for (let i = 0; i < 3; i++) ctx.fillRect(gx + 4 + i * 9, 234, 4, 112);
  ctx.fillStyle = '#333'; ctx.fillRect(gx, 268, GATE_W, 5); ctx.fillRect(gx, 300, GATE_W, 5);
  /* fechadura dourada */
  ctx.fillStyle = '#ffd700'; ctx.fillRect(gx + 8, 280, 12, 12);
  ctx.fillStyle = '#b8860b'; ctx.fillRect(gx + 12, 284, 4, 4);
}
