/* =====================================================
 *  ENTIDADES: ROBÔS AMIGOS DO BOBBY — escala 2 (MENORZINHOS,
 *  nunca do tamanho do Bobby — regra sagrada!).
 *  Atiram pedras no chefão (sem dano), têm 3 de vida,
 *  ficam agitados. Quando 3 caem, um corre e grita
 *  "Socorro!!!"; o chefão ri "Hahaha..." e solta o míssil
 *  do ombro que ABRE O BURACO na mina.
 *  Inclui toda a cutscene D3 (updateD3 + visuais).
 *  O.S. 002 FRAGMENTAÇÃO — movido de engine.ts, idêntico.
 * ===================================================== */
import { BOBBY_RUN, MECHA_FRAMES, drawPixelArt } from '../sprites';
import { SOUNDS } from '../audio';
import {
  G, PIXEL, PAL_ROBO, PAL_ROBO_GRAY, PAL_MECHA, MINE_X, HUD_HEIGHT,
  type Robo, roundRect, drawGlow, spawnParticles,
} from '../state';
import { hillY } from '../cenario/plataformas';

/* posição Y do robô (acompanha a inclinação da colina) */
function robotY(r: Robo): number {
  return (hillY(r.x + 18) ?? 350) - 33;
}

export function drawRobots(ctx: CanvasRenderingContext2D): void {
  G.robozinhos.forEach((r) => {
    const rx = r.x - G.camera.x;
    if (rx < -50 || rx > ctx.canvas.width + 50) return;
    const ry = robotY(r);
    if (r.fallen) {
      ctx.save(); ctx.translate(rx + 16, ry + 28); ctx.rotate(-Math.PI / 2);
      ctx.globalAlpha = 0.7;
      drawPixelArt(ctx, BOBBY_RUN, 0, PAL_ROBO_GRAY, -18, -16, PIXEL, false);
      ctx.restore(); ctx.globalAlpha = 1;
    } else {
      const shake = r.agitated > 0 ? (Math.floor(G.frameCount / 3) % 2 ? 2 : -2) : 0;
      const hop = r.crying ? Math.abs(Math.sin(G.frameCount * 0.2)) * -4 : 0;
      const frame = r.running || r.agitated > 0 ? Math.floor(G.frameCount / 8) % 3 : Math.floor(G.frameCount / 14) % 3;
      drawPixelArt(ctx, BOBBY_RUN, frame, PAL_ROBO, rx + shake, ry + hop, PIXEL, false);
      if (r.crying) {
        ctx.fillStyle = '#66ccff';
        ctx.fillRect(rx + 24, ry + 8 + (G.frameCount % 8), 2, 4);
      }
      /* barrinha de vida durante a batalha da cutscene */
      if (G.d3Active && G.d3Phase === 0 && !r.fallen) {
        ctx.fillStyle = '#333'; ctx.fillRect(rx + 4, ry - 10, 28, 5);
        ctx.fillStyle = r.hp >= 2 ? '#2ecc71' : '#e74c3c';
        ctx.fillRect(rx + 5, ry - 9, (26 * r.hp) / 3, 3);
      }
    }
  });
}

export function drawRocks(ctx: CanvasRenderingContext2D): void {
  G.rocks.forEach((rk) => {
    const sx = rk.x - G.camera.x;
    ctx.fillStyle = '#8a7a6a';
    ctx.beginPath(); ctx.arc(sx, rk.y, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6e5f50';
    ctx.fillRect(sx - 2, rk.y - 1, 2, 2);
  });
}

/* balão de fala */
function drawBubble(ctx: CanvasRenderingContext2D, x: number, y: number, text: string): void {
  ctx.font = 'bold 13px "Courier New", monospace';
  const w = ctx.measureText(text).width + 16;
  ctx.fillStyle = '#fff';
  roundRect(ctx, x - w / 2, y - 22, w, 20, 6); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x - 4, y - 2); ctx.lineTo(x + 4, y - 2); ctx.lineTo(x, y + 5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#222';
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y - 8);
  ctx.textAlign = 'left';
}

/* chefão + pedras + balões durante a cutscene */
export function drawCutsceneBattle(ctx: CanvasRenderingContext2D): void {
  if (!G.d3Active) return;
  const bx = G.csBoss.x - G.camera.x;
  drawPixelArt(ctx, MECHA_FRAMES, Math.floor(G.frameCount / 12) % 2, PAL_MECHA, bx, G.csBoss.y, PIXEL, true);
  if (G.d3Phase === 1) {
    const s = G.robozinhos.find((r) => r.crying);
    if (s) drawBubble(ctx, s.x + 18 - G.camera.x, robotY(s) - 8, 'Socorro!!!');
  }
  if (G.d3Phase === 2) drawBubble(ctx, bx + 36, G.csBoss.y - 6, 'Hahaha...');
  if (G.missile) {
    const mx = G.missile.x - G.camera.x;
    ctx.fillStyle = '#444'; ctx.fillRect(mx - 4, G.missile.y - 8, 8, 14);
    ctx.fillStyle = '#ff6600'; ctx.fillRect(mx - 3, G.missile.y + 6, 6, 5);
  }
}

function throwRock(r: Robo): void {
  G.rocks.push({ x: r.x + 30, y: robotY(r) + 6, vx: 5 + Math.random() * 2, vy: -6 - Math.random() * 2 });
  SOUNDS.rock();
}

/* motor da cutscene do MARCOS / mina (fases 0..4) */
export function updateD3(): void {
  if (!G.d3Active) {
    if (G.d3Glow > 0) G.d3Glow--;
    return;
  }
  G.d3T++; G.d3PhaseT++;
  G.d3Battery = Math.min(100, (G.d3T / 430) * 100);
  if (G.d3T % 14 === 0 && G.d3Phase < 4) SOUNDS.charge();
  for (let i = G.rocks.length - 1; i >= 0; i--) {
    const rk = G.rocks[i];
    rk.x += rk.vx; rk.y += rk.vy; rk.vy += 0.3;
    if (rk.x > 2560 || rk.y > 420) G.rocks.splice(i, 1);
  }
  const alive = G.robozinhos.filter((r) => !r.fallen);
  const dead = G.robozinhos.length - alive.length;

  if (G.d3Phase === 0) {
    /* robôs atiram pedras; o chefão acerta um deles de vez em quando */
    G.robozinhos.forEach((r, idx) => {
      if (!r.fallen && (G.d3T + idx * 13) % 45 === 0) throwRock(r);
      if (r.agitated > 0) r.agitated--;
    });
    G.csBoss.y = 150 + Math.sin(G.frameCount * 0.06) * 14;
    if (G.d3T % 22 === 0 && alive.length > 1) {
      const t = alive[Math.floor(Math.random() * alive.length)];
      t.agitated = 30; t.hp--;
      SOUNDS.shoot();
      if (t.hp <= 0) {
        t.fallen = true; SOUNDS.robotDown();
        spawnParticles(t.x + 18, robotY(t) + 16, ['#00cc66', '#fff', '#666'], 14);
      }
    }
    if (dead >= 3 || G.d3T > 420) {
      const surv = G.robozinhos.find((r) => !r.fallen);
      if (surv) surv.running = true;
      G.d3Phase = 1; G.d3PhaseT = 0;
    }
  } else if (G.d3Phase === 1) {
    /* sobrevivente corre até a parede gritando socorro */
    const s = G.robozinhos.find((r) => r.running && !r.fallen);
    if (s) {
      if (!s.crying) {
        s.x += 2.5;
        if (s.x >= 2415) { s.x = 2415; s.crying = true; G.d3PhaseT = 0; }
      } else if (G.d3PhaseT > 75) {
        G.d3Phase = 2; G.d3PhaseT = 0;
      }
    }
  } else if (G.d3Phase === 2) {
    /* chefão chega perto e ri */
    G.csBoss.x += (2470 - G.csBoss.x) * 0.08;
    G.csBoss.y += (210 - G.csBoss.y) * 0.08;
    if (G.d3PhaseT === 1) SOUNDS.laugh();
    if (G.d3PhaseT > 55) {
      G.missile = { x: G.csBoss.x + 20, y: G.csBoss.y + 40, vx: 1.2, vy: 2 };
      SOUNDS.missile();
      G.d3Phase = 3; G.d3PhaseT = 0;
    }
  } else if (G.d3Phase === 3) {
    /* míssil do ombro cai e explode no chão */
    if (G.missile) {
      G.missile.x += G.missile.vx; G.missile.y += G.missile.vy; G.missile.vy += 0.22;
      if (G.missile.y >= 315) {
        const surv = G.robozinhos.find((r) => r.crying);
        if (surv) surv.fallen = true;
        SOUNDS.explosion(); SOUNDS.robotDown();
        G.screenShake = Math.max(G.screenShake, 9);
        spawnParticles(MINE_X + 55, 320, ['#ff8800', '#ffcc00', '#5a4a5e', '#333'], 30);
        G.missile = null;
        G.d3Phase = 4; G.d3PhaseT = 0;
      }
    }
  } else if (G.d3Phase === 4) {
    /* o BURACO abre — Bobby liberado */
    if (G.d3PhaseT === 1) {
      G.d3Done = true;
      SOUNDS.collapse();
      G.screenShake = Math.max(G.screenShake, 12);
      spawnParticles(MINE_X + 55, 300, ['#5a4a5e', '#8a6a4a', '#ff8800', '#333'], 40);
    }
    if (G.d3PhaseT > 45) {
      G.d3Active = false; G.d3Battery = 100; G.d3Glow = 480;
      SOUNDS.chargeFull();
      G.rocks = [];
    }
  }
}

/* brilho dourado + barra de bateria do Bobby (cutscene) */
export function drawD3Fx(ctx: CanvasRenderingContext2D): void {
  if (G.d3Active) {
    const bw = 90, bh = 16;
    const bx = ctx.canvas.width / 2 - bw / 2, by = HUD_HEIGHT + 14;
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    roundRect(ctx, bx - 8, by - 8, bw + 16, bh + 24, 8); ctx.fill();
    ctx.strokeStyle = '#00ff88'; ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, bh);
    ctx.fillStyle = '#00ff88'; ctx.fillRect(bx + bw, by + 4, 3, 8);
    ctx.fillStyle = G.d3Battery >= 100 ? '#00ff88' : '#ffd700';
    ctx.fillRect(bx + 2, by + 2, Math.max(2, (G.d3Battery / 100) * (bw - 4)), bh - 4);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 10px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`CARREGANDO ${Math.floor(G.d3Battery)}%`, ctx.canvas.width / 2, by + bh + 12);
    ctx.textAlign = 'left';
  }
  if (G.d3Glow > 0) {
    const px = G.player.x + G.player.w / 2 - G.camera.x;
    const py = G.player.y + G.player.h / 2;
    ctx.globalAlpha = Math.min(0.3, (G.d3Glow / 480) * 0.3);
    drawGlow(ctx, '#ffd700', px, py, 48);
    ctx.globalAlpha = 1;
  }
}
