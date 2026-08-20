/* =====================================================
 *  LUGAR: ESTAÇÃO (antena + foguete) + CUTSCENE DE
 *  VITÓRIA (morte do boss no portão → chave → antena →
 *  foguete decola).
 *  O.S. 002 FRAGMENTAÇÃO — movido de engine.ts, idêntico.
 * ===================================================== */
import { MECHA_FRAMES, type Palette, drawPixelArt } from '../sprites';
import { SOUNDS } from '../audio';
import {
  G, PIXEL, BH, BASE_X, ANTENNA_X, ROCKET_LAND_X, GATE_X,
  spawnParticles, spawnSmoke,
} from '../state';

/* antena da estação — sempre visível depois do portão */
export function drawSecretBase(ctx: CanvasRenderingContext2D): void {
  const bx = BASE_X - G.camera.x;
  if (bx > ctx.canvas.width + 250 || bx + 700 < -50) return;
  /* === CERCA ao redor da base (postes + arame farpado + espinhos) === */
  for (let fx = BASE_X + 4; fx < BASE_X + 400; fx += 18) {
    const fsx = fx - G.camera.x;
    if (fsx < -20 || fsx > ctx.canvas.width + 20) continue;
    ctx.fillStyle = '#8B7355'; ctx.fillRect(fsx, 310, 6, 40);
    ctx.fillStyle = '#A08060'; ctx.fillRect(fsx + 1, 310, 4, 40);
    ctx.fillStyle = '#999'; ctx.fillRect(fsx, 316, 18, 2); ctx.fillRect(fsx, 330, 18, 2);
    if (fx % 36 === 0) { ctx.fillStyle = '#bbb'; ctx.fillRect(fsx + 8, 313, 2, 6); ctx.fillRect(fsx + 8, 327, 2, 6); }
  }

  /* === PORTÃO da estação (pilares + grades + FECHADURA DOURADA) === */
  const gsx = BASE_X + 20 - G.camera.x;
  ctx.fillStyle = '#666'; ctx.fillRect(gsx - 8, 290, 16, 60); ctx.fillRect(gsx + 48, 290, 16, 60);
  ctx.fillStyle = '#888'; ctx.fillRect(gsx - 6, 290, 12, 4); ctx.fillRect(gsx + 50, 290, 12, 4);
  ctx.fillStyle = '#777'; ctx.fillRect(gsx - 8, 290, 72, 8);
  ctx.fillStyle = '#555';
  for (let i = 0; i < 5; i++) ctx.fillRect(gsx + 4 + i * 10, 298, 4, 52);
  ctx.fillRect(gsx, 310, 56, 4); ctx.fillRect(gsx, 330, 56, 4);
  ctx.fillStyle = '#ffd700'; ctx.fillRect(gsx + 22, 318, 12, 12); // fechadura dourada
  ctx.fillStyle = '#b8860b'; ctx.fillRect(gsx + 26, 322, 4, 4);

  /* === CASINHA / BUNKER (porta + janela amarela ACESA, pulsante) === */
  const hx = BASE_X + 260 - G.camera.x;
  ctx.fillStyle = '#5a5a6a'; ctx.fillRect(hx, 290, 70, 60);
  ctx.fillStyle = '#4a4a5a'; ctx.fillRect(hx, 290, 70, 4); ctx.fillRect(hx, 346, 70, 4);
  ctx.fillStyle = '#3a3a4a'; ctx.fillRect(hx - 5, 282, 80, 12);
  ctx.fillStyle = '#444'; ctx.fillRect(hx - 3, 284, 76, 8);
  ctx.fillStyle = '#333'; ctx.fillRect(hx + 25, 310, 20, 40);
  ctx.fillStyle = '#555'; ctx.fillRect(hx + 27, 312, 16, 36);
  const lightPulse = Math.sin(G.frameCount * 0.05) * 0.15 + 0.85;
  ctx.fillStyle = '#333'; ctx.fillRect(hx + 8, 300, 14, 12);
  ctx.fillStyle = `rgba(255,255,100,${lightPulse})`; ctx.fillRect(hx + 10, 302, 10, 8);
  ctx.fillStyle = '#333'; ctx.fillRect(hx + 14, 302, 2, 8); ctx.fillRect(hx + 10, 305, 10, 2); // cruz na janela

  /* === TORRE com ANTENA PARABÓLICA === */
  const tx = ANTENNA_X - G.camera.x;
  ctx.fillStyle = '#555'; ctx.fillRect(tx - 18, 320, 36, 30);
  ctx.fillStyle = '#666'; ctx.fillRect(tx - 16, 322, 32, 26);
  ctx.fillStyle = '#777'; ctx.fillRect(tx - 6, 200, 12, 120);
  ctx.strokeStyle = '#888'; ctx.lineWidth = 2;
  for (let ty = 200; ty < 320; ty += 20) {
    ctx.beginPath(); ctx.moveTo(tx - 6, ty); ctx.lineTo(tx + 6, ty + 20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(tx + 6, ty); ctx.lineTo(tx - 6, ty + 20); ctx.stroke();
  }
  ctx.fillStyle = '#999'; ctx.fillRect(tx - 14, 260, 28, 4); ctx.fillRect(tx - 14, 230, 28, 4); ctx.fillRect(tx - 14, 200, 28, 4);
  ctx.fillStyle = '#bbb'; ctx.beginPath(); ctx.ellipse(tx, 195, 30, 18, 0, Math.PI, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#999'; ctx.beginPath(); ctx.ellipse(tx, 195, 26, 14, 0, Math.PI, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#777'; ctx.beginPath(); ctx.ellipse(tx, 195, 20, 10, 0, Math.PI, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ddd'; ctx.fillRect(tx - 2, 175, 4, 20);
  ctx.fillStyle = '#ff4444'; ctx.fillRect(tx - 3, 172, 6, 6);
  if (Math.floor(G.frameCount / 20) % 2 === 0) { ctx.fillStyle = '#ff0000'; ctx.beginPath(); ctx.arc(tx, 172, 3, 0, Math.PI * 2); ctx.fill(); }

  /* === SINAL DA ANTENA (fase do sinal, na vitória) === */
  if (G.victoryPhase >= 4 && G.victoryPhase < 6) {
    const sigAlpha = Math.sin(G.frameCount * 0.3) * 0.4 + 0.6;
    ctx.strokeStyle = `rgba(0,255,255,${sigAlpha})`; ctx.lineWidth = 3;
    for (let i = 1; i <= 5; i++) { ctx.beginPath(); ctx.arc(tx, 185, 35 + i * 20, -Math.PI * 0.8, -Math.PI * 0.2); ctx.stroke(); }
    ctx.strokeStyle = `rgba(0,255,255,${sigAlpha * 0.5})`; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(tx, 172); ctx.lineTo(tx + 10, 60); ctx.stroke();
  }
}

export function drawRocket(ctx: CanvasRenderingContext2D, rx: number, ry: number): void {
  if (G.rocketTakingOff) {
    for (let i = 0; i < 6; i++) {
      const fh = 60 + Math.random() * 80;
      ctx.fillStyle = i % 2 ? '#ffdd00' : '#ff6600';
      ctx.globalAlpha = 0.8;
      ctx.beginPath(); ctx.moveTo(rx - 15 + i * 7, ry + 95);
      ctx.lineTo(rx - 10 + i * 7, ry + 95 + fh); ctx.lineTo(rx - 5 + i * 7, ry + 95); ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < 3; i++) spawnSmoke(rx + G.camera.x * 0 + (Math.random() - 0.5) * 30 + G.camera.x, ry + 100 + Math.random() * 20);
  }
  ctx.fillStyle = '#e74c3c';
  ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 22, ry + 35); ctx.lineTo(rx + 22, ry + 35); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#eee'; ctx.fillRect(rx - 22, ry + 35, 44, 55);
  ctx.fillStyle = '#2176ae'; ctx.fillRect(rx - 22, ry + 48, 44, 8);
  ctx.fillStyle = '#e74c3c'; ctx.fillRect(rx - 22, ry + 70, 44, 6);
  ctx.fillStyle = '#00aaff'; ctx.beginPath(); ctx.arc(rx, ry + 42, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#555'; ctx.fillRect(rx - 18, ry + 90, 36, 8);
  ctx.fillStyle = '#e74c3c';
  ctx.beginPath(); ctx.moveTo(rx - 22, ry + 70); ctx.lineTo(rx - 40, ry + 98); ctx.lineTo(rx - 22, ry + 95); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(rx + 22, ry + 70); ctx.lineTo(rx + 40, ry + 98); ctx.lineTo(rx + 22, ry + 95); ctx.closePath(); ctx.fill();
  if (!G.rocketTakingOff) {
    ctx.fillStyle = '#777';
    ctx.fillRect(rx - 35, ry + 94, 8, 10); ctx.fillRect(rx + 27, ry + 94, 8, 10);
  }
  ctx.fillStyle = '#ffd700'; ctx.font = 'bold 14px "Courier New", monospace';
  ctx.textAlign = 'center'; ctx.fillText('M', rx, ry + 85);
  ctx.textAlign = 'left';
}

/* motor da cutscene de vitória (fases 1..7; 8 = tela final) */
export function updateVictoryCutscene(): void {
  const boss = G.boss;
  G.cutsceneTimer++;
  if (G.victoryPhase === 1) {
    /* boss em chamas caminha até o portão e explode */
    boss.deathT++;
    if (boss.x < 3290) boss.x += 2;
    boss.fallVelY += 0.5; boss.y += boss.fallVelY;
    if (boss.y > 350 - BH) boss.y = 350 - BH;
    if (boss.x >= 3285 && boss.y >= 350 - BH && boss.deathT > 20) {
      boss.hidden = true;
      G.gateDestroyed = true;
      SOUNDS.explosion(); SOUNDS.collapse();
      G.screenShake = Math.max(G.screenShake, 14);
      spawnParticles(GATE_X + 14, 300, ['#ff8800', '#ffcc00', '#555', '#333'], 40);
      spawnParticles(boss.x + boss.w / 2, boss.y, ['#ff4400', '#ffd700', '#d64541'], 40);
      G.scorchMarks.push({ x: GATE_X - 30, y: 350, w: 90 });
      G.goldenKey.x = 3280; G.goldenKey.y = 280; G.goldenKey.active = true;
      G.victoryPhase = 2; G.cutsceneTimer = 0;
      SOUNDS.keyGet();
    }
  } else if (G.victoryPhase === 2) {
    /* 15s (900f) pra pegar a chave; senão ela voa até o Bobby */
    if (!G.goldenKey.collected && G.cutsceneTimer > 900 && G.keyFlyT < 0) {
      G.keyFlyT = 0;
      SOUNDS.keyGet();
    }
    if (G.keyFlyT >= 0) {
      G.keyFlyT++;
      if (G.keyFlyT >= 60) {
        G.goldenKey.collected = true;
        G.victoryPhase = 3; G.cutsceneTimer = 0; G.keyFlyT = -1;
        G.player.shooting = false;
      }
    }
  } else if (G.victoryPhase === 3) {
    /* caminhada automática até a antena */
    G.player.dir = 1; G.player.x += 3;
    G.player.velY += G.player.gravity; G.player.y += G.player.velY; G.player.onGround = false;
    G.platforms.forEach((p) => {
      if (G.player.x + G.player.w > p.x && G.player.x < p.x + p.w && G.player.y + G.player.h > p.y && G.player.y + G.player.h < p.y + p.h * 0.6 && G.player.velY >= 0) {
        G.player.velY = 0; G.player.y = p.y - G.player.h; G.player.onGround = true;
      }
    });
    if (G.player.x >= ANTENNA_X - 20) {
      G.player.x = ANTENNA_X - 20;
      G.victoryPhase = 4; G.cutsceneTimer = 0; SOUNDS.signal();
    }
  } else if (G.victoryPhase === 4) {
    if (G.cutsceneTimer > 150) { G.victoryPhase = 5; G.cutsceneTimer = 0; SOUNDS.rocket(); G.rocketY = -200; }
  } else if (G.victoryPhase === 5) {
    G.rocketY += 2.5;
    if (G.rocketY >= 245) { G.rocketY = 245; G.victoryPhase = 6; G.cutsceneTimer = 0; }
  } else if (G.victoryPhase === 6) {
    G.player.dir = -1;
    if (G.player.x > ROCKET_LAND_X + 10) G.player.x -= 2;
    else {
      G.player.dir = 1; G.playerEnteredRocket = true;
      G.victoryPhase = 7; G.cutsceneTimer = 0; SOUNDS.rocket();
    }
  } else if (G.victoryPhase === 7) {
    if (G.cutsceneTimer > 40) {
      G.rocketTakingOff = true;
      G.rocketY -= 4 + G.cutsceneTimer * 0.03;
      G.screenShake = Math.min(8, G.cutsceneTimer * 0.05);
      if (G.rocketY < -250) {
        G.victoryPhase = 8; G.cutsceneTimer = 0; G.screenShake = 0;
        SOUNDS.victory();
      }
    }
  }
}

export function drawVictoryCutscene(ctx: CanvasRenderingContext2D): void {
  if (G.victoryPhase === 1) {
    /* chefão pegando fogo */
    const bsx = G.boss.x - G.camera.x;
    const burnAlpha = Math.max(0.3, 1 - G.boss.deathT / 200);
    ctx.globalAlpha = burnAlpha;
    const pal: Palette = Math.floor(G.frameCount / 3) % 2 === 0
      ? ['#ff3300', '#cc2200', '#ffffff', '#ffff00', '#333']
      : ['#ff6600', '#aa3300', '#ffaa00', '#ffff00', '#222'];
    drawPixelArt(ctx, MECHA_FRAMES, Math.floor(G.frameCount / 5) % 2, pal, bsx, G.boss.y, PIXEL, false);
    ctx.globalAlpha = 1;
    if (G.frameCount % 3 === 0) spawnParticles(G.boss.x + G.boss.w / 2 + (Math.random() - 0.5) * 40, G.boss.y + Math.random() * G.boss.h, ['#ff4400', '#ffaa00', '#ffff00'], 3);
  }
  if (G.victoryPhase >= 5 && G.victoryPhase <= 7) {
    drawRocket(ctx, ROCKET_LAND_X - G.camera.x, G.rocketY);
  }
}
