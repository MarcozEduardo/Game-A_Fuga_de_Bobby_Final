/* =====================================================
 *  LUGAR: MINA — montanha de rocha com torre, RODA
 *  giratória, CORRENTES balançando, rachaduras e a
 *  passagem (entrada em pé + trecho agachado) que o
 *  míssil do chefão abre; sela com escombros (sem volta).
 *  O.S. 002 FRAGMENTAÇÃO — movido de engine.ts, idêntico.
 * ===================================================== */
import { G, MINE_X, MINE_W, MINE_TOP } from '../state';

export function drawMine(ctx: CanvasRenderingContext2D): void {
  const wx = MINE_X - G.camera.x;
  if (wx > ctx.canvas.width + 80 || wx + MINE_W + 200 < -80) return;

  /* silhueta da montanha */
  ctx.fillStyle = '#4a4038';
  ctx.beginPath();
  ctx.moveTo(wx - 70, 350); ctx.lineTo(wx - 30, 210); ctx.lineTo(wx + 5, 110);
  ctx.lineTo(wx + 30, 55); ctx.lineTo(wx + 55, MINE_TOP); ctx.lineTo(wx + 85, 60);
  ctx.lineTo(wx + 110, 130); ctx.lineTo(wx + 130, 230); ctx.lineTo(wx + 150, 350);
  ctx.closePath(); ctx.fill();
  /* face da parede + textura de pedra */
  ctx.fillStyle = '#5d5248';
  ctx.fillRect(wx, 90, MINE_W, 260);
  ctx.fillStyle = '#4a4038';
  for (let ry = 100, row = 0; ry < 340; ry += 24, row++)
    for (let rx = 6; rx < MINE_W - 10; rx += 30) ctx.fillRect(wx + rx + (row % 2 ? 9 : 0), ry, 15, 10);
  ctx.fillStyle = '#6e6254';
  ctx.fillRect(wx, 90, MINE_W, 4);

  /* torre (headframe) da roda */
  ctx.strokeStyle = '#6e4a2a'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(wx + 30, 130); ctx.lineTo(wx + 50, 40);
  ctx.moveTo(wx + 80, 130); ctx.lineTo(wx + 60, 40); ctx.stroke();
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(wx + 36, 105); ctx.lineTo(wx + 74, 105);
  ctx.moveTo(wx + 42, 75); ctx.lineTo(wx + 68, 75); ctx.stroke();

  /* RODA giratória */
  const cx = wx + 55, cy = 62;
  ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#777'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2); ctx.stroke();
  const spin = G.frameCount * 0.05;
  ctx.strokeStyle = '#999'; ctx.lineWidth = 3;
  for (let s = 0; s < 4; s++) {
    const a = spin + (s * Math.PI) / 2;
    ctx.beginPath(); ctx.moveTo(cx - Math.cos(a) * 19, cy - Math.sin(a) * 19);
    ctx.lineTo(cx + Math.cos(a) * 19, cy + Math.sin(a) * 19); ctx.stroke();
  }
  ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();

  /* CORRENTES penduradas da roda (balançando) */
  const sway = Math.sin(G.frameCount * 0.06) * 3;
  ctx.strokeStyle = '#8a8a8a'; ctx.lineWidth = 2;
  for (const side of [-1, 1]) {
    const chainX = cx + side * 22;
    for (let ly = 84; ly < 128; ly += 8) {
      const off = sway * ((ly - 84) / 44);
      ctx.strokeRect(chainX + off - 2, ly, 4, 5);
    }
  }

  /* passagem: fechada / aberta / selada */
  const open = G.d3Done && !G.mineSealed;
  if (open) {
    ctx.fillStyle = '#14100c';
    ctx.fillRect(wx, 260, 40, 90);        // entrada EM PÉ
    ctx.fillRect(wx + 40, 305, 70, 45);   // trecho AGACHADO
    ctx.fillStyle = '#6e4a2a';
    ctx.fillRect(wx - 4, 254, 48, 6);
    ctx.fillRect(wx - 4, 260, 5, 90);
    ctx.fillRect(wx + 39, 260, 5, 45);
    ctx.fillStyle = Math.floor(G.frameCount / 20) % 2 ? '#ff6600' : '#cc3300';
    ctx.fillRect(wx + 12, 344, 4, 3); ctx.fillRect(wx + 60, 346, 5, 2); ctx.fillRect(wx + 92, 344, 4, 3);
  } else if (G.mineSealed) {
    /* escombros selando — SEM VOLTA */
    ctx.fillStyle = '#4a4038'; ctx.fillRect(wx, 280, 110, 70);
    ctx.fillStyle = '#5d5248'; ctx.fillRect(wx + 6, 296, 40, 54); ctx.fillRect(wx + 52, 288, 46, 62);
    ctx.fillStyle = '#3a322c'; ctx.fillRect(wx + 22, 312, 32, 38); ctx.fillRect(wx + 66, 306, 30, 44);
  } else {
    /* paredão sólido com rachaduras (antes da cutscene) */
    ctx.strokeStyle = '#3a322c'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(wx + 30, 200); ctx.lineTo(wx + 45, 240); ctx.lineTo(wx + 38, 280);
    ctx.moveTo(wx + 80, 180); ctx.lineTo(wx + 70, 230); ctx.stroke();
  }
}
