/* =====================================================
 *  PERSONAGEM: CHEFÃO (mecha) — desenho, IA (3 padrões)
 *  e dano. Vive na câmara da mina (2560–3400).
 *  O.S. 002 FRAGMENTAÇÃO — movido de engine.ts, idêntico.
 * ===================================================== */
import { MECHA_FRAMES, type Palette, drawPixelArt } from '../sprites';
import { SOUNDS } from '../audio';
import {
  G, PIXEL, PAL_MECHA, CHAMBER_X0, CHAMBER_X1,
  spawnParticles, takeDamage,
} from '../state';

export function drawBoss(ctx: CanvasRenderingContext2D): void {
  const boss = G.boss;
  if (!boss.active || boss.hidden) return;
  const sx = boss.x - G.camera.x;
  let pal = PAL_MECHA;
  if (boss.hp < 4 && Math.floor(G.frameCount / 6) % 2 === 0) pal = ['#ff5555', '#aa2222', '#ffffff', '#ffff00', '#333333'];
  boss.timer++;
  if (boss.timer % 12 === 0) boss.frame = (boss.frame + 1) % 2;
  drawPixelArt(ctx, MECHA_FRAMES, boss.frame, pal, sx, boss.y, PIXEL, boss.dir === -1);
  /* barra de vida */
  const barW = 80, barH = 8;
  ctx.fillStyle = '#333'; ctx.fillRect(sx + boss.w / 2 - barW / 2, boss.y - 20, barW, barH);
  const hpR = boss.hp / boss.maxHp;
  ctx.fillStyle = hpR > 0.5 ? '#2ecc71' : hpR > 0.25 ? '#ffd700' : '#e74c3c';
  ctx.fillRect(sx + boss.w / 2 - barW / 2, boss.y - 20, barW * hpR, barH);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
  ctx.strokeRect(sx + boss.w / 2 - barW / 2, boss.y - 20, barW, barH);
  ctx.fillStyle = '#ff5555'; ctx.font = 'bold 12px "Courier New", monospace';
  ctx.textAlign = 'center'; ctx.fillText('CHEFAO', sx + boss.w / 2, boss.y - 25);
  ctx.textAlign = 'left';
}

export function updateBoss(): void {
  const boss = G.boss;
  if (!boss.active || boss.defeated) return;

  /* STUN (bomba): o chefão congela ~1,5s no ar — sem andar, sem atirar.
     É a janela pra pular na cabeça dele (dano em dobro) */
  if (boss.stunned > 0) boss.stunned--;
  else {
  boss.patternTimer++;
  if (boss.patternTimer > 180) { boss.pattern = (boss.pattern + 1) % 3; boss.patternTimer = 0; }
  switch (boss.pattern) {
    case 0:
      boss.x += boss.speed * boss.dir;
      boss.y = boss.baseY + Math.sin(G.frameCount * 0.03) * 40;
      if (boss.x <= CHAMBER_X0 + 10 || boss.x >= CHAMBER_X1 - boss.w - 30) boss.dir *= -1;
      boss.shootCooldown--;
      if (boss.shootCooldown <= 0) {
        G.bullets.push({ x: boss.x + boss.w / 2, y: boss.y + boss.h, vx: 0, vy: 4, w: 12, h: 12 });
        boss.shootCooldown = 40; SOUNDS.shoot();
      }
      break;
    case 1: {
      const tX = G.player.x - boss.x, tY = G.player.y - boss.y;
      boss.x += Math.sign(tX) * 3; boss.y += Math.sign(tY) * 2;
      boss.shootCooldown--;
      if (boss.shootCooldown <= 0) {
        for (let a = -1; a <= 1; a++) G.bullets.push({ x: boss.x + boss.w / 2, y: boss.y + boss.h, vx: a * 3, vy: 4, w: 12, h: 12 });
        boss.shootCooldown = 50; SOUNDS.shoot();
      }
      break;
    }
    case 2:
      boss.x += boss.speed * boss.dir * 0.5;
      boss.y = boss.baseY + Math.sin(G.frameCount * 0.05) * 60;
      if (boss.x <= CHAMBER_X0 + 10 || boss.x >= CHAMBER_X1 - boss.w - 30) boss.dir *= -1;
      boss.shootCooldown--;
      if (boss.shootCooldown <= 0) {
        for (let i2 = 0; i2 < 5; i2++) {
          const angle = Math.PI * 0.3 + Math.PI * 0.4 * (i2 / 4);
          G.bullets.push({ x: boss.x + boss.w / 2, y: boss.y + boss.h, vx: Math.cos(angle) * 3, vy: Math.sin(angle) * 3, w: 12, h: 12 });
        }
        boss.shootCooldown = 35; SOUNDS.shoot();
      }
      break;
  }
  } // fecha o else do stun
  /* o boss NUNCA sai da câmara */
  boss.x = Math.max(CHAMBER_X0 + 10, Math.min(CHAMBER_X1 - boss.w - 26, boss.x));
  boss.y = Math.max(95, Math.min(250, boss.y));
  boss.lastX = boss.x; boss.lastY = boss.y;
  /* CONTATO com o boss: STOMP de cima pra baixo (quica, causa dano —
     DOBRADO se ele estiver atordoado pela bomba) ou dano no Bobby.
     Agora a luta se resolve também de perto, não só no tiro. */
  if (G.player.x + G.player.w > boss.x && G.player.x < boss.x + boss.w && G.player.y + G.player.h > boss.y && G.player.y < boss.y + boss.h) {
    const stomp = G.player.velY > 0 && G.player.y + G.player.h < boss.y + boss.h * 0.4;
    if (stomp) {
      const dmg = boss.stunned > 0 ? 2 : 1;
      G.player.velY = -10; // quica
      SOUNDS.stomp();
      spawnParticles(G.player.x + G.player.w / 2, boss.y, ['#ffd700', '#fff'], 10);
      damageBoss(dmg, G.player.x + G.player.w / 2, boss.y, false);
    } else if (!G.player.invulnerable && !G.player.hasShield) {
      takeDamage();
    }
  }
}

export function damageBoss(dmg: number, hx: number, hy: number, isSuper: boolean): void {
  const boss = G.boss;
  if (!boss.active || boss.defeated) return;
  boss.hp -= dmg; boss.hitsReceived++;
  if (isSuper) SOUNDS.superShot(); else SOUNDS.bossHit();
  spawnParticles(hx, hy, ['#d64541', '#ffd700', '#fff'], 10 + dmg * 3);
  /* super munição só no 3º acerto — FIX 2 intacto */
  if (boss.hitsReceived === 3 && !G.superAmmo.spawned) {
    G.superAmmo.spawned = true;
    let sx = G.player.x + (Math.random() > 0.5 ? 110 : -110);
    if (sx < CHAMBER_X0 + 20) sx = G.player.x + 110;
    G.superAmmo.x = Math.min(CHAMBER_X1 - 60, sx);
    G.superAmmo.y = 300;
    SOUNDS.superAmmo();
  }
  if (boss.hp <= 0) {
    boss.defeated = true;
    boss.deathT = 0; boss.fallVelY = 0;
    G.score += 500;
    G.victoryPhase = 1; G.cutsceneTimer = 0;
    G.bullets = []; G.playerBullets = [];
    SOUNDS.explosion();
  }
}
