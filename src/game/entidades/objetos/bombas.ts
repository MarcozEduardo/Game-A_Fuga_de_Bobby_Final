/* =====================================================
 *  OBJETOS: BOMBAS — o Bobby começa com 1 (máx. 3).
 *  Acerta o chefão (5 de dano — 2 bombas matam) e os
 *  inimigos próximos; deixa marca de queimado no chão
 *  (menos nas letras MARCOS/PORTFOLIO).
 *  O.S. 002 FRAGMENTAÇÃO — movido de engine.ts, idêntico.
 * ===================================================== */
import { SOUNDS } from '../../audio';
import {
  G, nameBlocks, titleBlocks, LEVEL_WIDTH, ABYSS_Y,
  type BombProj, spawnParticles, spawnSmoke,
} from '../../state';
import { damageBoss } from '../../personagens/boss';

export function throwBomb(): void {
  if (G.gameState !== 'GAME' || G.gameOver || G.victoryPhase > 2 || G.d3Active) return;
  if (G.bombs <= 0) return;
  G.bombs--;
  G.bombProjs.push({ x: G.player.x + G.player.w / 2 + G.player.dir * 10, y: G.player.y + 2, vx: G.player.dir * 5.5, vy: -9 });
  SOUNDS.bombThrow();
}

export function updateBombs(): void {
  if (G.gameState === 'DEFEAT' || G.victoryPhase >= 3) return;
  for (let i = G.bombProjs.length - 1; i >= 0; i--) {
    const b = G.bombProjs[i];
    b.vy += 0.4; b.x += b.vx; b.y += b.vy;
    let hitY = -1, hitMark = false;
    G.platforms.forEach((p) => {
      if (b.x > p.x && b.x < p.x + p.w && b.y >= p.y && b.y <= p.y + Math.max(14, p.h * 0.6) && b.vy >= 0) { hitY = p.y; hitMark = true; }
    });
    if (hitY < 0)
      nameBlocks.concat(titleBlocks).forEach((bl) => {
        if (b.x > bl.x && b.x < bl.x + bl.w && b.y >= bl.y && b.y <= bl.y + bl.h + 4 && b.vy >= 0) { hitY = bl.y; hitMark = false; }
      });
    if (hitY >= 0) { explodeBomb(b, hitMark ? hitY : null); G.bombProjs.splice(i, 1); continue; }
    if (b.y > ABYSS_Y - 20) { explodeBomb(b, null); G.bombProjs.splice(i, 1); continue; }
    if (b.x < -40 || b.x > LEVEL_WIDTH + 40) G.bombProjs.splice(i, 1);
  }
}

function explodeBomb(b: BombProj, markY: number | null): void {
  SOUNDS.explosion();
  G.screenShake = Math.max(G.screenShake, 7);
  spawnParticles(b.x, b.y, ['#ff8800', '#ffcc00', '#666', '#333'], 26);
  for (let k = 0; k < 6; k++) spawnSmoke(b.x + (Math.random() - 0.5) * 30, b.y);
  /* marca de queimado (só em chão de verdade) */
  if (markY !== null) {
    G.scorchMarks.push({ x: b.x - 20, y: markY, w: 40 });
    if (G.scorchMarks.length > 24) G.scorchMarks.shift();
  }
  /* inimigos próximos morrem no impacto */
  for (let j = G.enemies.length - 1; j >= 0; j--) {
    const e = G.enemies[j];
    if (Math.hypot(e.x + e.w / 2 - b.x, e.y + e.h / 2 - b.y) < 80) {
      SOUNDS.punch();
      const data = G.enemiesData.find((d) => d.id === e.id);
      if (data) { data.alive = false; data.respawnTimer = 300; }
      G.enemies.splice(j, 1); G.score += 25;
      spawnParticles(e.x + e.w / 2, e.y + e.h / 2, ['#e74c3c', '#fff', '#ffd700'], 16);
    }
  }
  /* FIX — a bomba só fere o boss se a explosão for PERTO dele.
     Antes: qualquer bomba jogada no chão (em qualquer lugar do mapa)
     já tirava vida do chefão. Agora a explosão precisa estar a até
     130px do centro do boss — então 2 bombas bem jogadas ainda matam. */
  const bcx = G.boss.x + G.boss.w / 2;
  const bcy = G.boss.y + G.boss.h / 2;
  if (Math.hypot(bcx - b.x, bcy - b.y) < 130) {
    damageBoss(5, b.x, b.y, false);
    G.boss.stunned = 90; // ~1.5s atordoado → pode pular na cabeça pra dano extra
  }
}

export function drawBombProjs(ctx: CanvasRenderingContext2D): void {
  G.bombProjs.forEach((b) => {
    const sx = b.x - G.camera.x;
    ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.arc(sx, b.y, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4d4d4d'; ctx.fillRect(sx - 3, b.y - 4, 2, 2);
    ctx.fillStyle = '#8a5a2a'; ctx.fillRect(sx - 1, b.y - 9, 2, 4);
    ctx.fillStyle = Math.floor(G.frameCount / 3) % 2 === 0 ? '#ffdd00' : '#ff6600';
    ctx.fillRect(sx - 2, b.y - 12, 3, 3);
  });
}

export function drawScorchMarks(ctx: CanvasRenderingContext2D): void {
  G.scorchMarks.forEach((m) => {
    const sx = m.x - G.camera.x;
    if (sx + m.w < -10 || sx > ctx.canvas.width + 10) return;
    ctx.fillStyle = 'rgba(8,8,8,0.6)';
    ctx.beginPath(); ctx.ellipse(sx + m.w / 2, m.y + 3, m.w / 2, 5, 0, 0, Math.PI * 2); ctx.fill();
  });
}
