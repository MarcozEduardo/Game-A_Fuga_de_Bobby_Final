/* =====================================================
 *  CONTROLES: JOYSTICK virtual (overlay) — analógico fixo
 *  no canto esquerdo, botão de tiro no direito e botão de
 *  bomba entre eles. Só aparece em mobile de verdade.
 *  O.S. 002 FRAGMENTAÇÃO — movido de engine.ts, idêntico.
 * ===================================================== */
import {
  G, isTouch, JOY_R, DEAD_ZONE, JUMP_ZONE,
} from '../state';

export function bombBtnPos(overlay: HTMLCanvasElement) {
  return { x: overlay.width - 187, y: overlay.height - 100, r: 28 };
}

export function drawTouchControls(octx: CanvasRenderingContext2D, overlay: HTMLCanvasElement): void {
  octx.clearRect(0, 0, overlay.width, overlay.height);
  if (!isTouch || G.gameState !== 'GAME' || G.gameOver || G.victoryPhase > 2) return;
  const W = overlay.width, H = overlay.height;
  const joy = G.joy, fire = G.fire;

  /* ---- joystick (canto esquerdo, fixo) ---- */
  const bx = 95, by = H - 115;
  const inJump = joy.active && joy.baseY - joy.y >= JUMP_ZONE;
  octx.save();
  octx.fillStyle = 'rgba(255,215,0,0.10)'; octx.strokeStyle = 'rgba(255,215,0,0.45)'; octx.lineWidth = 2;
  octx.beginPath(); octx.arc(bx, by, JOY_R, 0, Math.PI * 2); octx.fill(); octx.stroke();
  /* seta de pulo (verde, acende na zona de pulo) */
  octx.fillStyle = inJump ? 'rgba(0,255,136,0.95)' : 'rgba(0,255,136,0.45)';
  octx.beginPath(); octx.moveTo(bx, by - JOY_R + 8); octx.lineTo(bx - 8, by - JOY_R + 22); octx.lineTo(bx + 8, by - JOY_R + 22); octx.closePath(); octx.fill();
  /* setas laterais */
  octx.fillStyle = 'rgba(255,255,255,0.5)';
  octx.beginPath(); octx.moveTo(bx - JOY_R + 8, by); octx.lineTo(bx - JOY_R + 22, by - 8); octx.lineTo(bx - JOY_R + 22, by + 8); octx.closePath(); octx.fill();
  octx.beginPath(); octx.moveTo(bx + JOY_R - 8, by); octx.lineTo(bx + JOY_R - 22, by - 8); octx.lineTo(bx + JOY_R - 22, by + 8); octx.closePath(); octx.fill();
  /* thumb */
  const tx = joy.active ? joy.x : bx, ty = joy.active ? joy.y : by;
  octx.fillStyle = inJump ? 'rgba(0,255,136,0.85)' : 'rgba(255,215,0,0.8)';
  octx.beginPath(); octx.arc(tx, ty, 16, 0, Math.PI * 2); octx.fill();

  /* ---- botão de tiro (canto direito, com mira) ---- */
  const fx = W - 95, fy = H - 115, r = (fire.active ? 0.9 : 1) * 40;
  octx.fillStyle = 'rgba(231,76,60,0.85)';
  octx.beginPath(); octx.arc(fx, fy, r, 0, Math.PI * 2); octx.fill();
  octx.strokeStyle = 'rgba(255,255,255,0.9)'; octx.lineWidth = 2;
  octx.beginPath(); octx.arc(fx, fy, 14, 0, Math.PI * 2); octx.stroke();
  octx.beginPath(); octx.moveTo(fx - r + 6, fy); octx.lineTo(fx - 20, fy); octx.moveTo(fx + 20, fy); octx.lineTo(fx + r - 6, fy);
  octx.moveTo(fx, fy - r + 6); octx.lineTo(fx, fy - 20); octx.moveTo(fx, fy + 20); octx.lineTo(fx, fy + r - 6); octx.stroke();

  /* ---- botão de bomba (à esquerda do tiro) ---- */
  const bb = bombBtnPos(overlay);
  octx.fillStyle = G.bombs > 0 ? 'rgba(255,204,0,0.85)' : 'rgba(120,120,120,0.5)';
  octx.beginPath(); octx.arc(bb.x, bb.y, bb.r, 0, Math.PI * 2); octx.fill();
  octx.fillStyle = '#1a1a1a'; octx.beginPath(); octx.arc(bb.x, bb.y, 11, 0, Math.PI * 2); octx.fill();
  octx.fillStyle = '#ffcc00'; octx.fillRect(bb.x - 2, bb.y - 18, 3, 5);
  octx.restore();
}
