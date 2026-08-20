/* =====================================================
 *  BOBBY IA — ENGINE (o maestro magrinho)
 *  O.S. 002 FRAGMENTAÇÃO — o gigante de 2.289 linhas foi
 *  dividido em módulos (state, cenario, personagens,
 *  entidades, lugares, telas, controles). Aqui ficaram:
 *  loop, input, câmera, jogador, fluxo e bootstrap.
 *  Comportamento do jogo: 100% idêntico.
 * ===================================================== */
import { SOUNDS, music, resumeAudio } from './audio';
import { BULLET_FRAMES, PAL_ENEMY, drawPixelArt } from './sprites';
import {
  G, resetGame,
  LEVEL_WIDTH, PH, PH_CROUCH, EW, EH, ABYSS_Y, CHAMBER_X0, MINE_X,
  JOY_R, DEAD_ZONE, JUMP_ZONE,
  nameBlocks, titleBlocks, nameBounds, isTouch,
  doJump, takeDamage, triggerDefeat, landSafe,
  resolveWallCollision, resolveLetterCollision, resolveGateCollision, canStand,
  spawnParticles, updateParticles, drawParticles, updateSmoke, drawSmoke,
  LINKEDIN_URL, type Enemy,
} from './state';
import { hillY } from './cenario/plataformas';
import { drawBackground } from './cenario/fundo';
import { drawPlatforms, buildLevelLayer } from './cenario/plataformas';
import { drawPlayer } from './personagens/bobby';
import { drawBoss, updateBoss, damageBoss } from './personagens/boss';
import { drawEnemies, updateEnemies } from './entidades/inimigos';
import { drawRobots, drawRocks, drawCutsceneBattle, drawD3Fx, updateD3 } from './entidades/robos';
import { drawCollectibles, drawGoldenKey, checkCollections } from './entidades/objetos/coletaveis';
import { throwBomb, updateBombs, drawBombProjs, drawScorchMarks } from './entidades/objetos/bombas';
import { drawMine } from './lugares/mina';
import { drawMineChamberBack, drawMineChamberFront, drawDeadSoldiers, drawFortressGate } from './lugares/camara';
import { drawSecretBase, drawVictoryCutscene, updateVictoryCutscene } from './lugares/estacao';
import { drawLoadingScreen, drawIntroScreen } from './telas/intro';
import { drawHUD, drawWatermark } from './telas/hud';
import {
  drawDefeatWorld, drawDefeatScreen, updateDefeat, drawVictoryScreen,
  hitLinkedinButton, toCanvasPoint,
} from './telas/cards';
import { drawTouchControls, bombBtnPos } from './controles/joystick';

export { LINKEDIN_URL };

export interface GameApi {
  destroy: () => void;
}

export function createGame(canvas: HTMLCanvasElement, overlay: HTMLCanvasElement): GameApi {
  const ctx = canvas.getContext('2d', { alpha: false })!;
  ctx.imageSmoothingEnabled = false;
  const octx = overlay.getContext('2d')!;

  /* mobile 1:1 estilo Instagram */
  if (isTouch) {
    canvas.width = 450;
    canvas.height = 450;
  }

  /* =====================================================
   *  LÓGICA — jogador / câmera / tempo
   * ===================================================== */
  function updatePlayer() {
    const player = G.player;
    if (G.victoryPhase >= 3 || G.d3Active) return;
    player.moving = false;
    if (G.keys['ArrowLeft'] || G.keys['a']) { player.x -= player.speed; player.moving = true; player.dir = -1; }
    if (G.keys['ArrowRight'] || G.keys['d']) { player.x += player.speed; player.moving = true; player.dir = 1; }
    const wantCrouch = !!(G.keys['ArrowDown'] || G.keys['s']);
    if (wantCrouch && !player.crouching) {
      player.crouching = true; player.h = PH_CROUCH;
      if (player.onGround) player.y += PH - PH_CROUCH;
    } else if (!wantCrouch && player.crouching) {
      if (canStand()) {
        player.crouching = false; player.h = PH; player.y -= PH - PH_CROUCH;
      }
    }
    player.shootCooldown--;
    if (player.shooting && player.hasGun && player.shootCooldown <= 0) {
      const isSuper = player.hasSuperAmmo && player.superShots > 0;
      G.playerBullets.push({ x: player.dir === 1 ? player.x + player.w : player.x - 12, y: player.y + 12, vx: player.dir * (isSuper ? 14 : 10), w: isSuper ? 18 : 12, h: isSuper ? 8 : 4, isSuper, damage: isSuper ? 4 : 1 });
      player.shootCooldown = isSuper ? 20 : 12;
      if (isSuper) { player.superShots--; SOUNDS.superShot(); if (player.superShots <= 0) player.hasSuperAmmo = false; }
      else SOUNDS.shoot();
    }
    player.velY += player.gravity; player.y += player.velY; player.onGround = false;
    G.platforms.forEach((p) => {
      if (player.x + player.w > p.x && player.x < p.x + p.w && player.y + player.h > p.y && player.y + player.h < p.y + p.h * 0.6 && player.velY >= 0) {
        player.velY = 0; player.y = p.y - player.h; player.onGround = true; player.jumping = false;
      }
    });
    const hy = hillY(player.x + player.w / 2);
    if (hy !== null && player.velY >= 0) {
      const feet = player.y + player.h;
      if (feet >= hy - 6 && feet <= hy + 22) {
        player.y = hy - player.h; player.velY = 0; player.onGround = true; player.jumping = false;
      }
    }
    nameBlocks.concat(titleBlocks).forEach((b) => {
      if (player.x + player.w > b.x && player.x < b.x + b.w && player.y + player.h > b.y && player.y + player.h < b.y + b.h + 5 && player.velY >= 0) {
        player.velY = 0; player.y = b.y - player.h; player.onGround = true; player.jumping = false;
      }
    });
    resolveLetterCollision();
    resolveWallCollision();
    resolveGateCollision();
    player.x = Math.max(0, Math.min(LEVEL_WIDTH - player.w, player.x));
    if (player.y > ABYSS_Y) {
      if (G.victoryPhase >= 1) landSafe();
      else { SOUNDS.fall(); player.lives = 0; triggerDefeat(); }
    }
    if (player.invulnerable) { player.invulnerableTimer--; if (player.invulnerableTimer <= 0) player.invulnerable = false; }
    if (player.hasShield) { player.shieldTimer--; if (player.shieldTimer <= 0) player.hasShield = false; }

    /* ativa o boss quando Bobby entra na câmara + sela a passagem */
    if (player.x > CHAMBER_X0 && !G.boss.active && !G.boss.defeated && G.victoryPhase === 0) {
      G.boss.active = true;
      SOUNDS.bossRoar();
      music.setZone('batalha');
      if (!G.mineSealed) {
        G.mineSealed = true;
        SOUNDS.collapse();
        G.screenShake = Math.max(G.screenShake, 12);
        spawnParticles(MINE_X + 55, 300, ['#5a4a5e', '#8a6a4a', '#333'], 40);
      }
    }

    /* pisou no MARCOS → nascer do sol + cutscene da conquista */
    if (!G.hasSteppedOnMarcos) {
      if (player.x + player.w > nameBounds.x && player.x < nameBounds.x + nameBounds.w && player.y + player.h > nameBounds.y && player.y < nameBounds.y + nameBounds.h) {
        G.hasSteppedOnMarcos = true;
        music.setZone('esperanca');
        if (!G.d3Done && !G.d3Active && G.victoryPhase === 0) {
          G.d3Active = true; G.d3T = 0; G.d3PhaseT = 0; G.d3Phase = 0; G.d3Battery = 0;
          G.csBoss.x = 2490; G.csBoss.y = 150;
          SOUNDS.conquest();
        }
      }
    }
    if (!player.healedByName && player.lives < player.maxLives) {
      if (player.x + player.w > nameBounds.x && player.x < nameBounds.x + nameBounds.w && player.y + player.h > nameBounds.y && player.y < nameBounds.y + nameBounds.h) {
        player.lives = player.maxLives; player.healedByName = true;
        SOUNDS.heal();
        spawnParticles(player.x + player.w / 2, player.y, ['#00ff88', '#fff', '#ffd700'], 30);
      }
    }
  }

  function updateCamera() {
    if (G.d3Active) {
      const vw = canvas.width;
      let target: number;
      if (G.d3T < 60) target = G.player.x - vw / 3;
      else target = MINE_X - vw * 0.45;
      target = Math.max(0, Math.min(LEVEL_WIDTH - vw, target));
      G.camera.x += (target - G.camera.x) * 0.06;
      return;
    }
    if (G.victoryPhase > 2) {
      if (G.victoryPhase >= 3 && G.victoryPhase <= 7) {
        const targetCamX = Math.max(0, Math.min(LEVEL_WIDTH - canvas.width, G.player.x - canvas.width / 3));
        G.camera.x += (targetCamX - G.camera.x) * 0.05;
      }
      return;
    }
    const tx = G.player.x - canvas.width / 3;
    G.camera.x += (tx - G.camera.x) * 0.1;
    G.camera.x = Math.max(0, Math.min(LEVEL_WIDTH - canvas.width, G.camera.x));
  }

  function updateTimer() {
    const now = Date.now();
    const d = (now - G.lastTime) / 1000;
    G.lastTime = now;
    if (!G.gameOver && G.victoryPhase === 0 && !G.d3Active) {
      G.timeLeft -= d;
      if (G.timeLeft <= 0) { G.timeLeft = 0; triggerDefeat(); }
    }
  }

  /* =====================================================
   *  FLUXO — start / restart / input
   * ===================================================== */
  function startGame() {
    resumeAudio(); // FIX SOM — garante contexto ativo antes da música
    G.gameState = 'GAME';
    G.lastTime = Date.now();
    music.setZone('aventura');
  }

  function restartGame() {
    resetGame();               // estado de fábrica (state.ts)
    buildLevelLayer();         // refaz a "foto" do chão
    resumeAudio();             // FIX SOM — retoma o contexto ao reiniciar
    G.gameState = 'GAME';
    G.lastTime = Date.now();
    music.setZone('aventura');
  }

  function onKeyDown(e: KeyboardEvent) {
    resumeAudio();
    if (!G.keys[e.key]) {
      G.keys[e.key] = true;
      if (G.gameState === 'INTRO') {
        if (e.key === 'Enter' && !G.introSkipped && !G.introComplete) { G.introSkipped = true; G.introComplete = true; }
        else if ((e.key === ' ' || e.key === 'Enter') && (G.introComplete || G.introSkipped)) startGame();
      }
      if (G.gameState === 'GAME' && !G.gameOver && G.victoryPhase <= 2) {
        if (e.key === 'ArrowUp') doJump();
        if (e.key === ' ') G.player.shooting = true;
        if (e.key === 'b' || e.key === 'B' || e.key === 'x' || e.key === 'X') throwBomb();
      }
      if (G.gameState === 'DEFEAT' && G.defeatPhase >= 4 && e.key === ' ') restartGame();
      if (G.gameState === 'GAME' && G.victoryPhase >= 8 && (e.key === ' ' || e.key === 'Enter')) restartGame();
    }
    e.preventDefault();
  }
  function onKeyUp(e: KeyboardEvent) {
    G.keys[e.key] = false;
    if (e.key === ' ') G.player.shooting = false;
  }

  function onCanvasClick(e: MouseEvent) {
    resumeAudio();
    if (G.gameState === 'INTRO') {
      if (!G.introComplete && !G.introSkipped) { G.introSkipped = true; G.introComplete = true; }
      else startGame();
      return;
    }
    if (G.gameState === 'DEFEAT' && G.defeatPhase >= 4) {
      const pt = toCanvasPoint(ctx, e.clientX, e.clientY);
      if (hitLinkedinButton(pt.x, pt.y)) window.open(LINKEDIN_URL, '_blank');
      else restartGame();
      return;
    }
    if (G.gameState === 'GAME' && G.victoryPhase >= 8) {
      const pt = toCanvasPoint(ctx, e.clientX, e.clientY);
      if (hitLinkedinButton(pt.x, pt.y)) window.open(LINKEDIN_URL, '_blank');
      else restartGame();
      return;
    }
  }

  function onCanvasTouchStart(e: TouchEvent) {
    G.lastTouchAt = Date.now();
    resumeAudio();
    if (G.gameState === 'INTRO') {
      if (!G.introComplete && !G.introSkipped) { G.introSkipped = true; G.introComplete = true; }
      else startGame();
    } else if (G.gameState === 'DEFEAT' && G.defeatPhase >= 4) {
      const t = e.changedTouches[0];
      if (t) {
        const pt = toCanvasPoint(ctx, t.clientX, t.clientY);
        if (hitLinkedinButton(pt.x, pt.y)) window.open(LINKEDIN_URL, '_blank');
        else restartGame();
      }
    } else if (G.gameState === 'GAME' && G.victoryPhase >= 8) {
      const t = e.changedTouches[0];
      if (t) {
        const pt = toCanvasPoint(ctx, t.clientX, t.clientY);
        if (hitLinkedinButton(pt.x, pt.y)) window.open(LINKEDIN_URL, '_blank');
        else restartGame();
      }
    }
  }

  function onTouchStart(e: TouchEvent) {
    resumeAudio();
    if (G.gameState !== 'GAME' || G.gameOver || G.victoryPhase > 2) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.clientX < window.innerWidth * 0.55) {
        if (G.joy.id === -1) {
          G.joy.id = t.identifier; G.joy.active = true;
          G.joy.baseX = 95; G.joy.baseY = overlay.height - 115;
          let tdx = t.clientX - G.joy.baseX, tdy = t.clientY - G.joy.baseY;
          const tlen = Math.hypot(tdx, tdy);
          if (tlen > JOY_R) { tdx = (tdx / tlen) * JOY_R; tdy = (tdy / tlen) * JOY_R; }
          G.joy.x = G.joy.baseX + tdx; G.joy.y = G.joy.baseY + tdy;
          G.joy.jumpHeld = false;
        }
      } else {
        const bb = bombBtnPos(overlay);
        if (Math.hypot(t.clientX - bb.x, t.clientY - bb.y) <= bb.r + 18) throwBomb();
        else if (G.fire.id === -1) { G.fire.id = t.identifier; G.fire.active = true; G.player.shooting = true; }
      }
    }
  }
  function onTouchMove(e: TouchEvent) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === G.joy.id && G.joy.active) {
        let dx = t.clientX - G.joy.baseX, dy = t.clientY - G.joy.baseY;
        const len = Math.hypot(dx, dy);
        if (len > JOY_R) { dx = (dx / len) * JOY_R; dy = (dy / len) * JOY_R; }
        G.joy.x = G.joy.baseX + dx; G.joy.y = G.joy.baseY + dy;
        G.keys['ArrowLeft'] = dx <= -DEAD_ZONE;
        G.keys['ArrowRight'] = dx >= DEAD_ZONE;
        if (dx <= -DEAD_ZONE) G.player.dir = -1;
        else if (dx >= DEAD_ZONE) G.player.dir = 1;
        G.keys['ArrowDown'] = dy >= JUMP_ZONE;
        if (dy <= -JUMP_ZONE) {
          if (!G.joy.jumpHeld) { doJump(); G.joy.jumpHeld = true; }
        } else G.joy.jumpHeld = false;
      }
    }
  }
  function onTouchEnd(e: TouchEvent) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === G.joy.id) {
        G.joy.id = -1; G.joy.active = false;
        G.keys['ArrowLeft'] = false; G.keys['ArrowRight'] = false; G.keys['ArrowDown'] = false;
      }
      if (t.identifier === G.fire.id) { G.fire.id = -1; G.fire.active = false; G.player.shooting = false; }
    }
  }
  function onContextMenu(e: Event) { e.preventDefault(); }

  /* =====================================================
   *  GAME LOOP
   * ===================================================== */
  let raf = 0;
  function gameLoop() {
    G.frameCount++;
    if (G.frameCount % 60 === 0) resumeAudio(); // FIX SOM — contexto nunca dorme
    if (G.screenShake > 0) G.screenShake = Math.max(0, G.screenShake - 0.5);
    ctx.save();
    if (G.screenShake > 0) ctx.translate((Math.random() - 0.5) * G.screenShake, (Math.random() - 0.5) * G.screenShake);

    if (G.gameState === 'LOADING') {
      drawLoadingScreen(ctx);
    } else if (G.gameState === 'INTRO') {
      drawIntroScreen(ctx);
    } else if (G.gameState === 'DEFEAT') {
      drawBackground(ctx);
      /* FIX — o cenário do covil (câmara, mina, portão, base) também é
         desenhado na derrota: antes as paredes "sumiam" quando o Bobby
         morria lá dentro, porque este ramo não as desenhava */
      drawMineChamberBack(ctx);
      drawPlatforms(ctx);
      drawMineChamberFront(ctx);
      drawDeadSoldiers(ctx);
      drawScorchMarks(ctx);
      drawMine(ctx);
      drawFortressGate(ctx);
      drawSecretBase(ctx);
      drawSmoke(ctx); drawParticles(ctx);
      drawCollectibles(ctx); drawEnemies(ctx); drawBoss(ctx);
      drawDefeatWorld(ctx);
      updateDefeat();
      updateParticles(); updateSmoke();
      ctx.restore();
      drawDefeatScreen(ctx);
      drawWatermark(ctx);
      drawTouchControls(octx, overlay);
      raf = requestAnimationFrame(gameLoop);
      return;
    } else {
      drawBackground(ctx);
      drawMineChamberBack(ctx);
      drawPlatforms(ctx);
      drawMineChamberFront(ctx);
      drawDeadSoldiers(ctx);
      drawScorchMarks(ctx);
      drawMine(ctx);
      drawFortressGate(ctx);
      drawSecretBase(ctx);
      drawRobots(ctx);
      drawRocks(ctx);
      updateSmoke(); drawSmoke(ctx);
      updateParticles(); drawParticles(ctx);
      drawCollectibles(ctx);
      drawGoldenKey(ctx);
      drawBullets(ctx);
      drawBombProjs(ctx);
      drawEnemies(ctx);
      drawBoss(ctx);
      drawCutsceneBattle(ctx);
      drawPlayer(ctx);
      drawD3Fx(ctx);

      updateD3();
      if (G.victoryPhase >= 1 && G.victoryPhase < 8) updateVictoryCutscene();
      if (G.victoryPhase >= 1) drawVictoryCutscene(ctx);
      if (G.victoryPhase >= 8) drawVictoryScreen(ctx);

      drawHUD(ctx);
      if (!G.gameOver && G.victoryPhase <= 2) {
        updatePlayer();
        updateEnemies();
        updateBoss();
        updateBullets();
        updateBombs();
        checkCollections();
        updateCamera();
        updateTimer();
      }
      if (!G.enemiesInitialized) {
        G.enemiesInitialized = true;
        G.enemiesData.forEach((d) => {
          if (d.alive) G.enemies.push({ ...d, x: d.spawnX, w: EW, h: EH, frame: 0, timer: 0, shootCooldown: 0, detectionRange: 200, shootRange: 250, velY: 0, stompCount: 0 });
        });
      }
    }

    drawWatermark(ctx);
    ctx.restore();
    drawTouchControls(octx, overlay);
    raf = requestAnimationFrame(gameLoop);
  }

  /* ---------- balas (desenho + física) ---------- */
  function drawBullets(c: CanvasRenderingContext2D) {
    G.bullets.forEach((b) => {
      const sx = b.x - G.camera.x;
      if (sx < -20 || sx > c.canvas.width + 20) return;
      drawPixelArt(c, BULLET_FRAMES, 0, PAL_ENEMY, sx, b.y, 2, false);
    });
    G.playerBullets.forEach((b) => {
      const sx = b.x - G.camera.x;
      if (sx < -20 || sx > c.canvas.width + 20) return;
      if (b.isSuper) {
        c.globalAlpha = 0.35; c.fillStyle = '#00ffff'; c.fillRect(sx - 3, b.y - 3, b.w + 6, b.h + 6);
        c.globalAlpha = 1; c.fillStyle = '#00ffff'; c.fillRect(sx, b.y, b.w, b.h);
        c.fillStyle = '#fff'; c.fillRect(sx + 2, b.y + 1, b.w - 4, b.h - 2);
      } else {
        c.globalAlpha = 0.3; c.fillStyle = '#00ff00'; c.fillRect(sx - 2, b.y - 2, b.w + 4, b.h + 4);
        c.globalAlpha = 1; c.fillStyle = '#00ff00'; c.fillRect(sx, b.y, b.w, b.h);
      }
    });
  }

  function updateBullets() {
    if (G.gameState === 'DEFEAT' || G.victoryPhase >= 1) return;
    for (let i = G.bullets.length - 1; i >= 0; i--) {
      const b = G.bullets[i];
      b.x += b.vx; b.y += b.vy;
      if (!G.player.invulnerable && !G.player.hasShield && G.player.x < b.x + b.w && G.player.x + G.player.w > b.x && G.player.y < b.y + b.h && G.player.y + G.player.h > b.y) {
        takeDamage(); G.bullets.splice(i, 1);
        spawnParticles(b.x, b.y, ['#ff0000', '#ff6666', '#fff'], 15); continue;
      }
      if (G.player.hasShield && G.player.x < b.x + b.w && G.player.x + G.player.w > b.x && G.player.y < b.y + b.h && G.player.y + G.player.h > b.y) {
        G.player.hasShield = false; G.player.shieldTimer = 0;
        G.bullets.splice(i, 1);
        spawnParticles(b.x, b.y, ['#0088ff', '#00aaff', '#fff'], 10); SOUNDS.shield(); continue;
      }
      if (b.x < -20 || b.x > LEVEL_WIDTH + 20 || b.y > 500 || b.y < -20) G.bullets.splice(i, 1);
    }
    for (let i = G.playerBullets.length - 1; i >= 0; i--) {
      const b = G.playerBullets[i];
      b.x += b.vx;
      let consumed = false;
      for (let j = G.enemies.length - 1; j >= 0; j--) {
        const e = G.enemies[j];
        if (e.x < b.x + b.w && e.x + e.w > b.x && e.y < b.y + b.h && e.y + e.h > b.y) {
          SOUNDS.bulletHit(); SOUNDS.punch();
          const data = G.enemiesData.find((d) => d.id === e.id);
          if (data) { data.alive = false; data.respawnTimer = 300; }
          G.enemies.splice(j, 1); G.playerBullets.splice(i, 1); G.score += 25; consumed = true;
          spawnParticles(e.x + e.w / 2, e.y + e.h / 2, ['#e74c3c', '#fff', '#ffd700'], 20);
          break;
        }
      }
      if (consumed) continue;
      if (!G.boss.defeated && G.boss.active && G.boss.x < b.x + b.w && G.boss.x + G.boss.w > b.x && G.boss.y < b.y + b.h && G.boss.y + G.boss.h > b.y) {
        damageBoss(b.damage || 1, b.x, b.y, b.isSuper);
        G.playerBullets.splice(i, 1); continue;
      }
      if (b.x < -20 || b.x > LEVEL_WIDTH + 20) G.playerBullets.splice(i, 1);
    }
  }

  function resizeOverlay() {
    overlay.width = window.innerWidth; overlay.height = window.innerHeight;
  }

  /* ---------- bootstrap ---------- */
  resizeOverlay();
  buildLevelLayer();
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('pointerdown', resumeAudio); // FIX SOM — qualquer gesto retoma o áudio
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: true });
  window.addEventListener('touchend', onTouchEnd, { passive: true });
  window.addEventListener('touchcancel', onTouchEnd, { passive: true });
  window.addEventListener('resize', resizeOverlay);
  window.addEventListener('contextmenu', onContextMenu);
  canvas.addEventListener('click', onCanvasClick);
  canvas.addEventListener('touchstart', onCanvasTouchStart, { passive: true });
  raf = requestAnimationFrame(gameLoop);

  return {
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('pointerdown', resumeAudio);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
      window.removeEventListener('resize', resizeOverlay);
      window.removeEventListener('contextmenu', onContextMenu);
      canvas.removeEventListener('click', onCanvasClick);
      canvas.removeEventListener('touchstart', onCanvasTouchStart);
      music.stop();
    },
  };
}
