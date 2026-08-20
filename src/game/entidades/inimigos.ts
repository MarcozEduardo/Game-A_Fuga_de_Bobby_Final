/* =====================================================
 *  ENTIDADES: INIMIGOS — monstros do mapa (desenho + IA).
 *  Fogem depois que o boss cai; não entram na zona segura
 *  (rampa/passagem) nem atiram no Bobby lá.
 *  O.S. 002 FRAGMENTAÇÃO — movido de engine.ts, idêntico.
 * ===================================================== */
import { ENEMY_FRAMES, PAL_ENEMY, drawPixelArt } from '../sprites';
import { SOUNDS } from '../audio';
import {
  G, PIXEL, EW, EH, LEVEL_WIDTH, ABYSS_Y, SAFE_MIN, SAFE_MAX,
  spawnParticles, takeDamage,
} from '../state';

export function drawEnemies(ctx: CanvasRenderingContext2D): void {
  G.enemies.forEach((e) => {
    const sx = e.x - G.camera.x;
    if (sx + e.w < -50 || sx > ctx.canvas.width + 50) return;
    e.timer++;
    if (e.timer % 14 === 0) e.frame = (e.frame + 1) % 2;
    if (e.stompCount >= 1) ctx.globalAlpha = 0.6 + Math.sin(G.frameCount * 0.3) * 0.2;
    drawPixelArt(ctx, ENEMY_FRAMES, e.frame, PAL_ENEMY, sx, e.y, PIXEL, e.dir === -1);
    ctx.globalAlpha = 1;
  });
}

export function updateEnemies(): void {
  if (G.gameState === 'DEFEAT' || (G.victoryPhase >= 1 && G.victoryPhase < 3)) {
    /* inimigos fogem depois que o boss cai */
    if (G.victoryPhase >= 1 && G.victoryPhase < 3) {
      for (let i = G.enemies.length - 1; i >= 0; i--) {
        const e = G.enemies[i];
        e.dir = e.x < G.player.x ? -1 : 1;
        e.x += e.dir * Math.min(8, 3 + G.victoryPhase);
        if (e.x < -60 || e.x > LEVEL_WIDTH + 60) G.enemies.splice(i, 1);
      }
    }
    return;
  }
  G.enemiesData.forEach((data) => {
    if (!data.alive) {
      data.respawnTimer--;
      if (data.respawnTimer <= 0) {
        data.alive = true;
        G.enemies.push({ ...data, x: data.spawnX, w: EW, h: EH, frame: 0, timer: 0, shootCooldown: 0, detectionRange: 200, shootRange: 250, velY: 0, stompCount: 0 });
        SOUNDS.respawn();
      }
    }
  });
  const playerInSafe = G.player.x > SAFE_MIN && G.player.x < SAFE_MAX;
  for (let i = G.enemies.length - 1; i >= 0; i--) {
    const e = G.enemies[i];
    e.velY = (e.velY || 0) + 0.55; e.y += e.velY;
    let onPlatform = false;
    G.platforms.forEach((p) => {
      if (e.x + e.w > p.x && e.x < p.x + p.w && e.y + e.h > p.y && e.y + e.h < p.y + p.h * 0.6 && e.velY >= 0) {
        e.velY = 0; e.y = p.y - e.h; onPlatform = true;
      }
    });
    if (e.y > ABYSS_Y) {
      const data = G.enemiesData.find((d) => d.id === e.id);
      if (data) { data.alive = false; data.respawnTimer = 300; }
      G.enemies.splice(i, 1); continue;
    }
    e.x += e.speed * e.dir;
    /* zona segura: nenhum monstro entra na rampa/passagem */
    if (e.x + e.w > SAFE_MIN && e.x < SAFE_MAX) {
      if (e.dir > 0) { e.x = SAFE_MIN - e.w; e.dir = -1; }
      else { e.x = SAFE_MAX; e.dir = 1; }
    }
    const frontX = e.dir === 1 ? e.x + e.w + 2 : e.x - 2;
    let groundAhead = false;
    G.platforms.forEach((p) => {
      if (frontX > p.x && frontX < p.x + p.w && e.y + e.h + 10 > p.y && e.y + e.h < p.y + 20) groundAhead = true;
    });
    if (onPlatform && !groundAhead) e.dir *= -1;
    if (e.x <= 0 || e.x >= LEVEL_WIDTH - e.w) e.dir *= -1;
    e.shootCooldown--;
    const distX = Math.abs(G.player.x - e.x), distY = Math.abs(G.player.y - e.y);
    /* não atira no Bobby enquanto ele está na zona segura */
    if (!playerInSafe && distX < e.shootRange && distY < 80 && e.shootCooldown <= 0 && !G.gameOver && G.victoryPhase === 0) {
      G.bullets.push({ x: e.x + e.w / 2, y: e.y + e.h / 2, vx: (G.player.x > e.x ? 1 : -1) * 4, vy: 0, w: 12, h: 12 });
      e.shootCooldown = 90; SOUNDS.shoot();
    }
    if (!playerInSafe && distX < e.detectionRange) {
      if (G.player.x < e.x && e.dir === 1) e.dir = -1;
      if (G.player.x > e.x && e.dir === -1) e.dir = 1;
    }
    /* pisão do Bobby */
    if (!playerInSafe && G.player.velY > 0 && !G.player.invulnerable && G.player.x + G.player.w - 8 > e.x + 4 && G.player.x + 8 < e.x + e.w - 4 && G.player.y + G.player.h > e.y && G.player.y + G.player.h < e.y + e.h * 0.5) {
      e.stompCount = (e.stompCount || 0) + 1;
      G.player.velY = -8; SOUNDS.stomp(); SOUNDS.punch();
      spawnParticles(e.x + e.w / 2, e.y, ['#ff6666', '#fff'], 8);
      if (e.stompCount >= 2) {
        const data = G.enemiesData.find((d) => d.id === e.id);
        if (data) { data.alive = false; data.respawnTimer = 300; }
        G.enemies.splice(i, 1); G.score += 25;
        spawnParticles(e.x + e.w / 2, e.y + e.h / 2, ['#e74c3c', '#fff', '#ffd700'], 20);
      }
    }
  }
}
