/* =====================================================
 *  PERSONAGEM: BOBBY — só ele, sem fundo.
 *  Frames por estado (parado, correndo, pulo, agachado,
 *  atirando, cutscene) e paleta que degrada com as vidas.
 *  O.S. 002 FRAGMENTAÇÃO — movido de engine.ts, idêntico.
 * ===================================================== */
import {
  HERO_FRAMES, HERO_FRAMES_DMG, PAL_HERO_3, PAL_HERO_2, PAL_HERO_1,
  type Palette, drawPixelArt,
} from '../sprites';
import { G, PIXEL } from '../state';

export function drawPlayer(ctx: CanvasRenderingContext2D): void {
  const player = G.player;
  if (G.gameState === 'DEFEAT' || G.playerEnteredRocket) return;
  const sx = player.x - G.camera.x;

  /* escudo */
  if (player.hasShield) {
    ctx.strokeStyle = `rgba(0,136,255,${0.5 + Math.sin(G.frameCount * 0.2) * 0.3})`;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(sx + player.w / 2, player.y + player.h / 2, player.w, 0, Math.PI * 2); ctx.stroke();
  }
  /* piscada de invulnerabilidade */
  if (player.invulnerable && Math.floor(G.frameCount / 4) % 2 === 0) ctx.globalAlpha = 0.3;

  let frame: number;
  if (G.victoryPhase >= 3) frame = Math.floor(G.frameCount / 8) % 2 + 1;
  else if (player.shooting && player.hasGun) frame = 5;
  else if (player.crouching) frame = 4;
  else if (!player.onGround) frame = 3;
  else if (player.moving) frame = Math.floor(G.frameCount / 8) % 2 + 1;
  else frame = 0;

  let pal: Palette, frames: string[][];
  if (player.lives === 3) { pal = PAL_HERO_3; frames = HERO_FRAMES; }
  else if (player.lives === 2) { pal = PAL_HERO_2; frames = HERO_FRAMES_DMG; }
  else { pal = PAL_HERO_1; frames = HERO_FRAMES_DMG; }
  drawPixelArt(ctx, frames, frame, pal, sx, player.y, PIXEL, player.dir === -1);
  ctx.globalAlpha = 1;

  /* arma */
  if (player.hasGun && G.victoryPhase < 3) {
    ctx.fillStyle = player.lives === 1 ? '#444' : '#666';
    ctx.fillRect(player.dir === 1 ? sx + player.w - 5 : sx - 3, player.y + 12, 8, 4);
  }
  /* chave na mão durante a cutscene final */
  if (G.goldenKey.collected && G.victoryPhase >= 3) {
    ctx.fillStyle = '#ffd700'; ctx.fillRect(sx + player.w + 2, player.y + 10, 8, 12);
  }
}
