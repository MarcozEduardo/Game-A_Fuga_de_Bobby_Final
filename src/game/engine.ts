/* =====================================================
 *  BOBBY IA — A FUGA DE BOBBY · motor do jogo (canvas 2D)
 *  Reconstruído c/ todos os recursos aprovados + B.O.s novos.
 * ===================================================== */
import {
  BOBBY_FACE, BOBBY_RUN, BOBBY_KNEEL, MECHA_FRAMES,
  HERO_FRAMES, HERO_FRAMES_DMG, ENEMY_FRAMES,
  COIN_FRAMES, STAR_FRAMES, HEALTH_FRAMES, BULLET_FRAMES,
  PAL_BOBBY, PAL_HERO_3, PAL_HERO_2, PAL_HERO_1, PAL_ENEMY, PAL_COIN, PAL_STAR,
  PAL_HEALTH, type Palette, type TextBlock,
  generateTextBlocks, drawPixelArt, drawSingleFrame,
} from './sprites';
import { SOUNDS, music, resumeAudio } from './audio';

export const LINKEDIN_URL = 'https://www.linkedin.com/in/sir-marcos-eduardo/';

export interface GameApi {
  destroy: () => void;
}

/* ---------- tipos ---------- */
interface Rect { x: number; y: number; w: number; h: number }
interface Coin extends Rect { collected: boolean; type: 'coin' | 'star'; points: number }
interface EnemySpawn { id: number; spawnX: number; y: number; speed: number; dir: number; alive: boolean; respawnTimer: number }
interface Enemy extends Rect { id: number; spawnX: number; speed: number; dir: number; frame: number; timer: number; shootCooldown: number; detectionRange: number; shootRange: number; velY: number; stompCount: number }
interface EnemyBullet extends Rect { vx: number; vy: number }
interface PlayerBullet extends Rect { vx: number; isSuper: boolean; damage: number }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number }
interface Smoke { x: number; y: number; size: number; alpha: number; vy: number; vx: number }
interface BombProj { x: number; y: number; vx: number; vy: number }
interface Scorch { x: number; y: number; w: number }
interface Robo { x: number; hp: number; fallen: boolean; agitated: number; running: boolean; crying: boolean }
interface Rock { x: number; y: number; vx: number; vy: number }

const INTRO_FULL_TEXT =
  'Ola, eu sou Bobby IA, um sistema semantico criado pelo Marcao. Quando usado, eu consigo ser um instrumento para ele. Consigo produzir qualquer tipo de projeto que o Marcao orquestra. Hiperfocado e perfeccionista, ele me guia, debugando linha por linha, iteracao atras da outra, ate finalizar com excelencia seu objetivo. Esse jogo foi produzido e lapidado em 2h30 de varias e varias iteracoes.';

export function createGame(canvas: HTMLCanvasElement, overlay: HTMLCanvasElement): GameApi {
  const ctx = canvas.getContext('2d', { alpha: false })!;
  ctx.imageSmoothingEnabled = false;
  const octx = overlay.getContext('2d')!;

  /* ---------- detecção de touch (só mobile de verdade) ---------- */
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  if (isTouch) {
    canvas.width = 450; // 1:1 estilo Instagram
    canvas.height = 450;
  }

  /* ---------- constantes de mundo ---------- */
  const PIXEL = 3;
  const PW = 12 * PIXEL, PH = 16 * PIXEL, PH_CROUCH = 10 * PIXEL;
  const EW = 12 * PIXEL, EH = 11 * PIXEL;
  const CW = 8 * PIXEL, CH = 8 * PIXEL;
  const SW = 12 * PIXEL, SH = 12 * PIXEL;
  const BW = 24 * PIXEL, BH = 20 * PIXEL;
  const LEVEL_WIDTH = 4100;
  const GAME_TIME = 240;
  const HUD_HEIGHT = 60;
  const ABYSS_Y = 500;

  const MINE_X = 2440, MINE_W = 110, MINE_TOP = 40;      // parede da mina
  const CHAMBER_X0 = 2560, CHAMBER_X1 = 3400;            // câmara (arena do boss)
  const GATE_X = 3372, GATE_W = 28;                      // portão da fortaleza
  const BASE_X = 3400;
  const ANTENNA_X = 3620;
  const ROCKET_LAND_X = 3560;
  const SAFE_MIN = 2120, SAFE_MAX = 2580;                // zona sem monstros

  const PAL_MECHA: Palette = ['#d64541', '#8e2323', '#ffffff', '#ffd700', '#3a3a44'];
  const PAL_ROBO: Palette = ['#00cc66', '#003311', '#aaffcc', '#00ff88', '#004422'];
  const PAL_ROBO_GRAY: Palette = ['#666', '#333', '#999', '#888', '#222'];

  const camera = { x: 0 };

  /* caches de gradiente (PERF) */
  let skyCacheKey = '';
  let skyCacheGrad: CanvasGradient | null = null;
  let hudGrad: CanvasGradient | null = null;
  let levelLayer: HTMLCanvasElement | null = null;
  const glowCache = new Map<string, HTMLCanvasElement>();

  /* ---------- estado ---------- */
  let gameState: 'LOADING' | 'INTRO' | 'GAME' | 'DEFEAT' = 'LOADING';
  let loadProgress = 0;
  let introCharIndex = 0, introTimer = 0, introComplete = false, introSkipped = false;
  let bobbyRunFrame = 0;
  let frameCount = 0;
  let lastTime = Date.now();
  let screenShake = 0;
  let score = 0, timeLeft = GAME_TIME, gameOver = false;

  let hasSteppedOnMarcos = false;
  let sunriseProgress = 0;

  function freshPlayer() {
    return {
      x: 50, y: 280, w: PW, h: PH, speed: 4.5, velY: 0, gravity: 0.55, jumpPower: 13,
      jumping: false, moving: false, crouching: false, shooting: false, dir: 1,
      lives: 3, maxLives: 3, invulnerable: false, invulnerableTimer: 0, hasGun: true,
      shootCooldown: 0, onGround: false, hasShield: false, shieldTimer: 0,
      hasSuperAmmo: false, superShots: 0, healedByName: false,
    };
  }
  let player = freshPlayer();

  function freshPlatforms(): Rect[] {
    return [
      { x: 0, y: 350, w: 750, h: 100 },
      { x: 240, y: 270, w: 130, h: 20 },
      { x: 440, y: 220, w: 130, h: 20 },
      { x: 620, y: 170, w: 130, h: 20 },
      { x: 950, y: 350, w: 60, h: 100 },
      { x: 1060, y: 300, w: 55, h: 15 },
      { x: 1160, y: 250, w: 55, h: 15 },
      { x: 1260, y: 200, w: 55, h: 15 },
      { x: 1360, y: 250, w: 55, h: 15 },
      { x: 1460, y: 350, w: 300, h: 100 },
      { x: 1800, y: 350, w: 640, h: 100 },   // até a mina (2440)
      { x: 2440, y: 350, w: 110, h: 100 },   // piso da passagem
      { x: 2550, y: 350, w: 850, h: 100 },   // câmara da mina (2550-3400)
      { x: 2650, y: 250, w: 100, h: 20 },
      { x: 2900, y: 200, w: 100, h: 20 },
      { x: 3050, y: 270, w: 100, h: 20 },
      { x: 3400, y: 350, w: 700, h: 100 },   // base (agora sempre visível)
    ];
  }
  let platforms: Rect[] = freshPlatforms();

  const nameBlocks: TextBlock[] = generateTextBlocks('MARCOS', 1820, 250, 8);
  const titleBlocks: TextBlock[] = generateTextBlocks('PORTFOLIO', 1830, 310, 6);
  const nameBounds = { x: 1810, y: 240, w: 380, h: 50 };

  /* colina 2150→2400 (350→305) */
  function hillY(x: number): number | null {
    if (x < 2150 || x > 2400) return null;
    return 350 - ((x - 2150) / 250) * 45;
  }

  function freshCoins(): Coin[] {
    return [
      { x: 180, y: 290, w: CW, h: CH, collected: false, type: 'coin', points: 10 },
      { x: 360, y: 240, w: CW, h: CH, collected: false, type: 'coin', points: 10 },
      { x: 500, y: 185, w: CW, h: CH, collected: false, type: 'coin', points: 10 },
      { x: 650, y: 135, w: SW, h: SH, collected: false, type: 'star', points: 50 },
      { x: 720, y: 290, w: CW, h: CH, collected: false, type: 'coin', points: 10 },
      { x: 1060, y: 260, w: SW, h: SH, collected: false, type: 'star', points: 50 },
      { x: 1360, y: 210, w: CW, h: CH, collected: false, type: 'coin', points: 10 },
      { x: 1500, y: 290, w: CW, h: CH, collected: false, type: 'coin', points: 10 },
      { x: 1600, y: 290, w: SW, h: SH, collected: false, type: 'star', points: 50 },
      { x: 2000, y: 290, w: CW, h: CH, collected: false, type: 'coin', points: 10 },
      { x: 2080, y: 290, w: CW, h: CH, collected: false, type: 'coin', points: 10 },
      { x: 2600, y: 290, w: CW, h: CH, collected: false, type: 'coin', points: 10 },
      { x: 2800, y: 240, w: SW, h: SH, collected: false, type: 'star', points: 100 },
      { x: 3000, y: 160, w: SW, h: SH, collected: false, type: 'star', points: 100 },
      /* B.O — moedas dentro da fortaleza do boss */
      { x: 2700, y: 300, w: CW, h: CH, collected: false, type: 'coin', points: 10 },
      { x: 2850, y: 250, w: CW, h: CH, collected: false, type: 'coin', points: 10 },
      { x: 3000, y: 300, w: CW, h: CH, collected: false, type: 'coin', points: 10 },
    ];
  }
  let coins: Coin[] = freshCoins();
  let healthItem = { x: 1260, y: 155, w: 36, h: 36, collected: false };
  let chamberHeart = { x: 3150, y: 250, w: 36, h: 36, collected: false }; // B.O — coração na fortaleza
  let shieldItem = { x: 440, y: 180, w: 30, h: 30, collected: false };
  let superAmmo = { x: 0, y: 0, w: 36, h: 36, spawned: false, collected: false };

  const enemiesData: EnemySpawn[] = [
    { id: 1, spawnX: 310, y: 312, speed: 1.5, dir: 1, alive: true, respawnTimer: 0 },
    { id: 2, spawnX: 580, y: 312, speed: 1.2, dir: -1, alive: true, respawnTimer: 0 },
    { id: 3, spawnX: 1500, y: 312, speed: 1.8, dir: 1, alive: true, respawnTimer: 0 },
    { id: 4, spawnX: 1650, y: 312, speed: 1.4, dir: -1, alive: true, respawnTimer: 0 },
    { id: 5, spawnX: 2650, y: 312, speed: 2.0, dir: 1, alive: true, respawnTimer: 0 },
  ];
  let enemies: Enemy[] = [];
  let enemiesInitialized = false;
  let bullets: EnemyBullet[] = [];
  let playerBullets: PlayerBullet[] = [];
  let particles: Particle[] = [];
  let smokeParticles: Smoke[] = [];
  let bombProjs: BombProj[] = [];
  let scorchMarks: Scorch[] = [];
  let bombs = 1, coinsCollected = 0, starsCollected = 0, bombNotice = 0;

  function freshBoss() {
    return {
      x: 2900, y: 100, w: BW, h: BH, speed: 2, dir: -1, frame: 0, timer: 0,
      hp: 10, maxHp: 10, hitsReceived: 0, shootCooldown: 0, active: false, defeated: false,
      pattern: 0, patternTimer: 0, baseY: 100, lastX: 2900, lastY: 200,
      deathT: 0, hidden: false, fallVelY: 0,
    };
  }
  let boss = freshBoss();

  /* ---------- cutscene do MARCOS / mina ---------- */
  let d3Active = false, d3Done = false, mineSealed = false;
  let d3T = 0, d3PhaseT = 0, d3Phase = 0, d3Battery = 0, d3Glow = 0;
  const csBoss = { x: 2490, y: 150 };
  let missile: { x: number; y: number; vx: number; vy: number } | null = null;
  function freshRobos(): Robo[] {
    return [
      { x: 2230, hp: 3, fallen: false, agitated: 0, running: false, crying: false },
      { x: 2285, hp: 3, fallen: false, agitated: 0, running: false, crying: false },
      { x: 2340, hp: 3, fallen: false, agitated: 0, running: false, crying: false },
      { x: 2395, hp: 3, fallen: false, agitated: 0, running: false, crying: false },
    ];
  }
  let robozinhos: Robo[] = freshRobos();
  let rocks: Rock[] = [];

  /* ---------- vitória / derrota ---------- */
  let victoryPhase = 0, cutsceneTimer = 0, rocketY = -200;
  let playerEnteredRocket = false, rocketTakingOff = false;
  let gateDestroyed = false;
  let goldenKey = { x: 0, y: 0, w: 40, h: 40, active: false, collected: false, bobT: 0 };
  let keyFlyT = -1;
  let bossBurnTimer = 0;
  let defeatPhase = 0, defeatTimer = 0, defeatSignY = -260;
  let defeatExplosions: { x: number; y: number; size: number; life: number }[] = [];

  /* ---------- input ---------- */
  const keys: Record<string, boolean> = {};
  const joy = { id: -1, active: false, baseX: 0, baseY: 0, x: 0, y: 0, jumpHeld: false };
  const fire = { id: -1, active: false };
  const JOY_R = 46, DEAD_ZONE = 12, JUMP_ZONE = 25;
  let lastTouchAt = 0;

  /* =====================================================
   *  HELPERS
   * ===================================================== */
  function drawGlow(color: string, x: number, y: number, r: number) {
    let spr = glowCache.get(color);
    if (!spr) {
      spr = document.createElement('canvas');
      spr.width = 128; spr.height = 128;
      const g = spr.getContext('2d')!;
      const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
      grad.addColorStop(0, color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, 128, 128);
      glowCache.set(color, spr);
    }
    ctx.drawImage(spr, x - r, y - r, r * 2, r * 2);
  }

  function spawnParticles(x: number, y: number, colors: string[], count = 10) {
    if (particles.length + count > 160) count = Math.max(0, 160 - particles.length);
    for (let i = 0; i < count; i++)
      particles.push({ x, y, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 2) * 4, life: 40, color: colors[Math.floor(Math.random() * colors.length)], size: Math.random() * 3 + 2 });
  }
  function spawnSmoke(x: number, y: number) {
    if (smokeParticles.length >= 50) smokeParticles.shift();
    smokeParticles.push({ x: x + (Math.random() - 0.5) * 15, y, size: 3 + Math.random() * 4, alpha: 0.9, vy: -0.6 - Math.random() * 0.8, vx: (Math.random() - 0.5) * 0.3 });
  }

  function roundRect(x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* ---------- paredes da mina ---------- */
  function getWallRects(): Rect[] {
    if (mineSealed || !d3Done) return [{ x: MINE_X, y: MINE_TOP, w: MINE_W, h: 310 }];
    return [
      { x: MINE_X, y: MINE_TOP, w: 40, h: 220 },        // acima da entrada EM PÉ (260)
      { x: MINE_X + 40, y: MINE_TOP, w: 70, h: 245 },   // acima do trecho AGACHADO (305)
      { x: MINE_X + 40, y: 260, w: 30, h: 45 },         // teto baixo do agachar (305)
    ];
  }
  function resolveWallCollision() {
    for (const w of getWallRects()) {
      if (player.x < w.x + w.w && player.x + player.w > w.x && player.y < w.y + w.h && player.y + player.h > w.y) {
        const fromLeft = player.x + player.w - w.x;
        const fromRight = w.x + w.w - player.x;
        if (fromLeft < fromRight) player.x = w.x - player.w;
        else player.x = w.x + w.w;
      }
    }
  }
  function canStand(): boolean {
    const feet = player.y + player.h;
    const standTop = feet - PH;
    for (const w of getWallRects()) {
      if (player.x < w.x + w.w && player.x + player.w > w.x && standTop < w.y + w.h && feet > w.y) return false;
    }
    return true;
  }

  /* B.O 1 — letras (MARCOS/PORTFOLIO) sólidas também nas laterais.
     Antes só tinham colisão no topo: o Bobby entrava pela lateral do
     PORTFOLIO, ficava preso e os inimigos o matavam. */
  function resolveLetterCollision() {
    const solids = nameBlocks.concat(titleBlocks);
    for (const b of solids) {
      const overlapX = player.x < b.x + b.w && player.x + player.w > b.x;
      const overlapY = player.y < b.y + b.h && player.y + player.h > b.y;
      if (overlapX && overlapY && player.y + player.h > b.y + 10) {
        const fromLeft = player.x + player.w - b.x;
        const fromRight = b.x + b.w - player.x;
        if (fromLeft < fromRight) player.x = b.x - player.w;
        else player.x = b.x + b.w;
      }
    }
  }

  /* portão da fortaleza (bloqueia a saída até o boss morrer) */
  function resolveGateCollision() {
    if (gateDestroyed) return;
    const g = { x: GATE_X, y: 230, w: GATE_W, h: 120 };
    if (player.x < g.x + g.w && player.x + player.w > g.x && player.y < g.y + g.h && player.y + player.h > g.y) {
      player.x = g.x - player.w; // Bobby só pode vir da esquerda
    }
  }

  /* pouso seguro (Bobby não morre mais depois que o boss cai) */
  function landSafe() {
    let best: Rect | null = null;
    let bestEdge = -1;
    platforms.forEach((p) => {
      if (player.x + player.w > p.x && player.x < p.x + p.w) { best = p; bestEdge = -2; }
      else if (bestEdge !== -2 && p.x + p.w <= player.x + player.w && p.x + p.w > bestEdge) { bestEdge = p.x + p.w; best = p; }
    });
    if (best !== null) {
      const bp: Rect = best;
      if (bestEdge >= 0) player.x = Math.min(player.x, bestEdge - player.w - 6);
      player.x = Math.max(0, player.x);
      player.y = bp.y - player.h;
    } else {
      player.x = 60; player.y = 350 - player.h;
    }
    player.velY = 0; player.onGround = true;
    player.invulnerable = true; player.invulnerableTimer = 60;
    SOUNDS.respawn();
  }

  function grantBomb() {
    if (bombs < 3) {
      bombs++;
      bombNotice = 120;
      SOUNDS.bombGet();
    }
  }

  /* =====================================================
   *  DESENHO — FUNDO / MINA / CÂMARA
   * ===================================================== */
  function lerpColor(c1: string, c2: string, t: number): string {
    const r1 = parseInt(c1.slice(1, 3), 16), g1 = parseInt(c1.slice(3, 5), 16), b1 = parseInt(c1.slice(5, 7), 16);
    const r2 = parseInt(c2.slice(1, 3), 16), g2 = parseInt(c2.slice(3, 5), 16), b2 = parseInt(c2.slice(5, 7), 16);
    return `rgb(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)})`;
  }

  function drawBackground() {
    if (hasSteppedOnMarcos && sunriseProgress < 1) sunriseProgress += 0.0006;
    let top: string, bot: string;
    if (!hasSteppedOnMarcos) { top = '#0a0a1a'; bot = '#1a1a3a'; }
    else if (sunriseProgress < 0.5) { const t = sunriseProgress * 2; top = lerpColor('#0a0a1a', '#2c3e50', t); bot = lerpColor('#1a1a3a', '#4a69bd', t); }
    else { const t = (sunriseProgress - 0.5) * 2; top = lerpColor('#2c3e50', '#87CEEB', t); bot = lerpColor('#4a69bd', '#98D8C8', t); }

    const skyKey = top + '|' + bot;
    if (skyKey !== skyCacheKey) {
      skyCacheGrad = ctx.createLinearGradient(0, HUD_HEIGHT, 0, canvas.height);
      skyCacheGrad.addColorStop(0, top);
      skyCacheGrad.addColorStop(1, bot);
      skyCacheKey = skyKey;
    }
    ctx.fillStyle = skyCacheGrad!;
    ctx.fillRect(0, HUD_HEIGHT, canvas.width, canvas.height - HUD_HEIGHT);

    /* montanhas em parallax */
    drawMountains(0.25, 250, '#1a2440', 90);
    drawMountains(0.45, 285, '#232f52', 70);

    if (sunriseProgress < 0.6) {
      const ma = Math.max(0, 1 - sunriseProgress * 1.7);
      const mx = 700 - camera.x * 0.1;
      ctx.globalAlpha = ma * 0.5; drawGlow('#fffbe6', mx, 100, 55);
      ctx.globalAlpha = ma; ctx.fillStyle = '#fffbe6';
      ctx.beginPath(); ctx.arc(mx, 100, 30, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ddd';
      ctx.beginPath(); ctx.arc(mx - 10, 95, 5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(mx + 10, 108, 4, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (sunriseProgress > 0.2) {
      const sa = Math.min(1, (sunriseProgress - 0.2) * 2);
      const sy = 450 - sunriseProgress * 350;
      const sunX = 100 - camera.x * 0.1;
      ctx.globalAlpha = sa * 0.5; drawGlow('#FFFACD', sunX, sy, 70);
      ctx.globalAlpha = sa; ctx.fillStyle = '#FFFACD';
      ctx.beginPath(); ctx.arc(sunX, sy, 35, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
    const sta = Math.max(0, 1 - sunriseProgress * 1.5);
    if (sta > 0) {
      ctx.fillStyle = `rgba(255,255,255,${sta})`;
      for (let i = 0; i < 80; i++) {
        if (isTouch && i % 2 === 1) continue;
        const sx = (((i * 137 - camera.x * 0.3) % LEVEL_WIDTH) + LEVEL_WIDTH) % LEVEL_WIDTH;
        const sy = 70 + ((i * 23) % 200);
        if (sx >= -10 && sx <= canvas.width + 10) ctx.fillRect(sx, sy, i % 10 === 0 ? 2 : 1.5, 1.5);
      }
    }
  }

  function drawMountains(factor: number, baseY: number, color: string, amp: number) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    const off = camera.x * factor;
    for (let x = 0; x <= canvas.width + 60; x += 60) {
      const wx = x + off;
      const y = baseY - Math.abs(Math.sin(wx * 0.008) * amp) - Math.abs(Math.sin(wx * 0.003) * amp * 0.6);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    ctx.fill();
  }

  /* ---------- MINA (montanha, roda, correntes, parede, passagem) ---------- */
  function drawMine() {
    const wx = MINE_X - camera.x;
    if (wx > canvas.width + 80 || wx + MINE_W + 200 < -80) return;

    ctx.fillStyle = '#4a4038';
    ctx.beginPath();
    ctx.moveTo(wx - 70, 350); ctx.lineTo(wx - 30, 210); ctx.lineTo(wx + 5, 110);
    ctx.lineTo(wx + 30, 55); ctx.lineTo(wx + 55, MINE_TOP); ctx.lineTo(wx + 85, 60);
    ctx.lineTo(wx + 110, 130); ctx.lineTo(wx + 130, 230); ctx.lineTo(wx + 150, 350);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#5d5248';
    ctx.fillRect(wx, 90, MINE_W, 260);
    ctx.fillStyle = '#4a4038';
    for (let ry = 100, row = 0; ry < 340; ry += 24, row++)
      for (let rx = 6; rx < MINE_W - 10; rx += 30) ctx.fillRect(wx + rx + (row % 2 ? 9 : 0), ry, 15, 10);
    ctx.fillStyle = '#6e6254';
    ctx.fillRect(wx, 90, MINE_W, 4);

    /* torre + roda giratória */
    ctx.strokeStyle = '#6e4a2a'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(wx + 30, 130); ctx.lineTo(wx + 50, 40);
    ctx.moveTo(wx + 80, 130); ctx.lineTo(wx + 60, 40); ctx.stroke();
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(wx + 36, 105); ctx.lineTo(wx + 74, 105);
    ctx.moveTo(wx + 42, 75); ctx.lineTo(wx + 68, 75); ctx.stroke();
    const cx = wx + 55, cy = 62;
    ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#777'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2); ctx.stroke();
    const spin = frameCount * 0.05;
    ctx.strokeStyle = '#999'; ctx.lineWidth = 3;
    for (let s = 0; s < 4; s++) {
      const a = spin + (s * Math.PI) / 2;
      ctx.beginPath(); ctx.moveTo(cx - Math.cos(a) * 19, cy - Math.sin(a) * 19);
      ctx.lineTo(cx + Math.cos(a) * 19, cy + Math.sin(a) * 19); ctx.stroke();
    }
    ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();
    const sway = Math.sin(frameCount * 0.06) * 3;
    ctx.strokeStyle = '#8a8a8a'; ctx.lineWidth = 2;
    for (const side of [-1, 1]) {
      const chainX = cx + side * 22;
      for (let ly = 84; ly < 128; ly += 8) {
        const off = sway * ((ly - 84) / 44);
        ctx.strokeRect(chainX + off - 2, ly, 4, 5);
      }
    }

    /* passagem */
    const open = d3Done && !mineSealed;
    if (open) {
      ctx.fillStyle = '#14100c';
      ctx.fillRect(wx, 260, 40, 90);
      ctx.fillRect(wx + 40, 305, 70, 45);
      ctx.fillStyle = '#6e4a2a';
      ctx.fillRect(wx - 4, 254, 48, 6);
      ctx.fillRect(wx - 4, 260, 5, 90);
      ctx.fillRect(wx + 39, 260, 5, 45);
      ctx.fillStyle = Math.floor(frameCount / 20) % 2 ? '#ff6600' : '#cc3300';
      ctx.fillRect(wx + 12, 344, 4, 3); ctx.fillRect(wx + 60, 346, 5, 2); ctx.fillRect(wx + 92, 344, 4, 3);
    } else if (mineSealed) {
      ctx.fillStyle = '#4a4038'; ctx.fillRect(wx, 280, 110, 70);
      ctx.fillStyle = '#5d5248'; ctx.fillRect(wx + 6, 296, 40, 54); ctx.fillRect(wx + 52, 288, 46, 62);
      ctx.fillStyle = '#3a322c'; ctx.fillRect(wx + 22, 312, 32, 38); ctx.fillRect(wx + 66, 306, 30, 44);
    } else {
      ctx.strokeStyle = '#3a322c'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(wx + 30, 200); ctx.lineTo(wx + 45, 240); ctx.lineTo(wx + 38, 280);
      ctx.moveTo(wx + 80, 180); ctx.lineTo(wx + 70, 230); ctx.stroke();
    }
  }

  function robotY(r: Robo): number {
    return (hillY(r.x + 18) ?? 350) - 33;
  }

  /* robôs do Bobby (mesmo tamanho dele) */
  function drawRobots() {
    robozinhos.forEach((r) => {
      const rx = r.x - camera.x;
      if (rx < -50 || rx > canvas.width + 50) return;
      const ry = robotY(r);
      if (r.fallen) {
        ctx.save(); ctx.translate(rx + 16, ry + 28); ctx.rotate(-Math.PI / 2);
        ctx.globalAlpha = 0.7;
        drawPixelArt(ctx, BOBBY_RUN, 0, PAL_ROBO_GRAY, -18, -16, PIXEL, false);
        ctx.restore(); ctx.globalAlpha = 1;
      } else {
        const shake = r.agitated > 0 ? (Math.floor(frameCount / 3) % 2 ? 2 : -2) : 0;
        const hop = r.crying ? Math.abs(Math.sin(frameCount * 0.2)) * -4 : 0;
        const frame = r.running || r.agitated > 0 ? Math.floor(frameCount / 8) % 3 : Math.floor(frameCount / 14) % 3;
        drawPixelArt(ctx, BOBBY_RUN, frame, PAL_ROBO, rx + shake, ry + hop, PIXEL, false);
        if (r.crying) {
          ctx.fillStyle = '#66ccff';
          ctx.fillRect(rx + 24, ry + 8 + (frameCount % 8), 2, 4);
        }
        if (d3Active && d3Phase === 0 && !r.fallen) {
          ctx.fillStyle = '#333'; ctx.fillRect(rx + 4, ry - 10, 28, 5);
          ctx.fillStyle = r.hp >= 2 ? '#2ecc71' : '#e74c3c';
          ctx.fillRect(rx + 5, ry - 9, (26 * r.hp) / 3, 3);
        }
      }
    });
  }

  function drawRocks() {
    rocks.forEach((rk) => {
      const sx = rk.x - camera.x;
      ctx.fillStyle = '#8a7a6a';
      ctx.beginPath(); ctx.arc(sx, rk.y, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6e5f50';
      ctx.fillRect(sx - 2, rk.y - 1, 2, 2);
    });
  }

  /* balão de fala */
  function drawBubble(x: number, y: number, text: string) {
    ctx.font = 'bold 13px "Courier New", monospace';
    const w = ctx.measureText(text).width + 16;
    ctx.fillStyle = '#fff';
    roundRect(x - w / 2, y - 22, w, 20, 6); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 4, y - 2); ctx.lineTo(x + 4, y - 2); ctx.lineTo(x, y + 5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#222';
    ctx.textAlign = 'center';
    ctx.fillText(text, x, y - 8);
    ctx.textAlign = 'left';
  }

  /* chefão + pedras + balões durante a cutscene */
  function drawCutsceneBattle() {
    if (!d3Active) return;
    const bx = csBoss.x - camera.x;
    drawPixelArt(ctx, MECHA_FRAMES, Math.floor(frameCount / 12) % 2, PAL_MECHA, bx, csBoss.y, PIXEL, true);
    if (d3Phase === 1) {
      const s = robozinhos.find((r) => r.crying);
      if (s) drawBubble(s.x + 18 - camera.x, robotY(s) - 8, 'Socorro!!!');
    }
    if (d3Phase === 2) drawBubble(bx + 36, csBoss.y - 6, 'Hahaha...');
    if (missile) {
      const mx = missile.x - camera.x;
      ctx.fillStyle = '#444'; ctx.fillRect(mx - 4, missile.y - 8, 8, 14);
      ctx.fillStyle = '#ff6600'; ctx.fillRect(mx - 3, missile.y + 6, 6, 5);
    }
  }

  /* ---------- câmara da mina ---------- */
  function drawMineChamberBack() {
    const sx0 = CHAMBER_X0 - camera.x, sx1 = CHAMBER_X1 - camera.x;
    if (sx1 < -20 || sx0 > canvas.width + 20) return;
    const left = Math.max(-20, sx0), right = Math.min(canvas.width + 20, sx1);
    ctx.fillStyle = 'rgba(22,15,10,0.9)';
    ctx.fillRect(left, HUD_HEIGHT, right - left, 350 - HUD_HEIGHT);
    ctx.fillStyle = '#3a2f26'; ctx.fillRect(sx0, HUD_HEIGHT, sx1 - sx0, 70 - HUD_HEIGHT + 10);
    ctx.fillStyle = '#2c231c';
    for (let x = CHAMBER_X0; x < CHAMBER_X1; x += 34) {
      const tx = x - camera.x;
      const jag = 12 + ((x * 2654435761) >>> 28);
      ctx.beginPath(); ctx.moveTo(tx, 80); ctx.lineTo(tx + 17, 80 + jag); ctx.lineTo(tx + 34, 80); ctx.closePath(); ctx.fill();
    }
    for (let x = 2620; x < CHAMBER_X1; x += 160) {
      const vx = x - camera.x;
      ctx.fillStyle = '#6e4a2a'; ctx.fillRect(vx, 88, 12, 262);
      ctx.fillStyle = '#8a5e36'; ctx.fillRect(vx + 2, 88, 3, 262);
      ctx.fillStyle = '#6e4a2a'; ctx.fillRect(vx - 22, 76, 56, 12);
      const flick = 0.45 + 0.3 * Math.sin(frameCount * 0.12 + x);
      ctx.fillStyle = '#333'; ctx.fillRect(vx + 24, 88, 2, 10);
      ctx.fillStyle = `rgba(255,200,80,${flick.toFixed(2)})`; ctx.fillRect(vx + 20, 98, 10, 12);
      ctx.globalAlpha = flick * 0.4; drawGlow('#ffc850', vx + 25, 104, 34); ctx.globalAlpha = 1;
    }
  }

  function drawMineChamberFront() {
    const sx0 = CHAMBER_X0 - camera.x, sx1 = CHAMBER_X1 - camera.x;
    if (sx1 < -20 || sx0 > canvas.width + 20) return;
    ctx.fillStyle = '#4a3a2c'; ctx.fillRect(sx0, 350, sx1 - sx0 - 15, 14);
    ctx.fillStyle = '#3a2c20'; ctx.fillRect(sx0, 360, sx1 - sx0 - 15, 4);
    for (let x = CHAMBER_X0 + 6; x < CHAMBER_X1 - 20; x += 26) {
      const tx = x - camera.x;
      ctx.fillStyle = '#2e2218'; ctx.fillRect(tx, 352, 14, 10);
      ctx.fillStyle = '#777'; ctx.fillRect(tx - 4, 353, 22, 2); ctx.fillRect(tx - 4, 359, 22, 2);
    }
  }

  /* soldados do Bobby que o chefe já matou (vistos na arena) */
  const soldadosMortos = [2590, 2650, 2720, 2790, 2860, 2930, 3000, 3070, 3140, 3210];
  function drawDeadSoldiers() {
    soldadosMortos.forEach((sx, i) => {
      const x = sx - camera.x;
      if (x < -40 || x > canvas.width + 40) return;
      ctx.save(); ctx.translate(x + 16, 344); ctx.rotate(-Math.PI / 2);
      ctx.globalAlpha = 0.55;
      drawPixelArt(ctx, BOBBY_RUN, 0, PAL_ROBO_GRAY, -18, -16, PIXEL, i % 2 === 0);
      ctx.restore(); ctx.globalAlpha = 1;
    });
  }

  /* portão da fortaleza (lado direito da câmara) */
  function drawFortressGate() {
    const gx = GATE_X - camera.x;
    if (gx > canvas.width + 40 || gx + GATE_W < -40) return;
    if (gateDestroyed) {
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
    ctx.fillStyle = '#ffd700'; ctx.fillRect(gx + 8, 280, 12, 12);
    ctx.fillStyle = '#b8860b'; ctx.fillRect(gx + 12, 284, 4, 4);
  }

  /* base secreta (antena) — agora sempre visível depois do portão */
  function drawSecretBase() {
    const bx = BASE_X - camera.x;
    if (bx > canvas.width + 250 || bx + 700 < -50) return;
    const tx = ANTENNA_X - camera.x;
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
    if (Math.floor(frameCount / 20) % 2 === 0) { ctx.fillStyle = '#ff0000'; ctx.beginPath(); ctx.arc(tx, 172, 3, 0, Math.PI * 2); ctx.fill(); }
    if (victoryPhase >= 4 && victoryPhase < 6) {
      const sigAlpha = Math.sin(frameCount * 0.3) * 0.4 + 0.6;
      ctx.strokeStyle = `rgba(0,255,255,${sigAlpha})`; ctx.lineWidth = 3;
      for (let i = 1; i <= 5; i++) { ctx.beginPath(); ctx.arc(tx, 185, 35 + i * 20, -Math.PI * 0.8, -Math.PI * 0.2); ctx.stroke(); }
    }
  }

  /* =====================================================
   *  PLATAFORMAS (pré-renderizadas — a "foto" do chão)
   * ===================================================== */
  function paintPlatform(g: CanvasRenderingContext2D, p: Rect, off: number) {
    const sx = p.x - off;
    const isGround = p.h === 100, isSmall = p.w <= 60;
    if (isGround) {
      g.fillStyle = '#5dbb63'; g.fillRect(sx, p.y, p.w, 10);
      g.fillStyle = '#3a8c41'; g.fillRect(sx, p.y + 10, p.w, 6);
      const dg = g.createLinearGradient(0, p.y + 16, 0, p.y + p.h);
      dg.addColorStop(0, '#6B3F2A'); dg.addColorStop(1, '#3d2010');
      g.fillStyle = dg; g.fillRect(sx, p.y + 16, p.w, p.h - 16);
      for (let x = 0; x < p.w; x += 34) {
        const h = (x * 2654435761) >>> 28;
        g.fillStyle = '#55331f'; g.fillRect(sx + x + 6, p.y + 30 + (h % 3) * 14, 10, 6);
        g.fillStyle = '#7a4a30'; g.fillRect(sx + x + 18, p.y + 24 + (h % 4) * 10, 7, 5);
      }
      for (let x = 8; x < p.w; x += 52) {
        g.fillStyle = '#4aa552'; g.fillRect(sx + x, p.y - 4, 2, 5); g.fillRect(sx + x + 3, p.y - 6, 2, 7);
      }
    } else if (isSmall) {
      g.fillStyle = '#c0392b'; g.fillRect(sx, p.y, p.w, p.h);
      g.fillStyle = '#e74c3c'; g.fillRect(sx + 2, p.y + 2, p.w - 4, p.h - 4);
    } else {
      g.fillStyle = '#8B5E3C'; g.fillRect(sx, p.y, p.w, p.h);
      g.fillStyle = '#c8945a'; g.fillRect(sx, p.y, p.w, 5);
      g.fillStyle = 'rgba(60,30,10,0.55)'; g.fillRect(sx, p.y + p.h - 3, p.w, 3); g.fillRect(sx + p.w - 3, p.y + 5, 3, p.h - 8);
      g.fillStyle = 'rgba(255,220,170,0.25)'; g.fillRect(sx, p.y + 5, 3, p.h - 8);
      g.fillStyle = 'rgba(70,40,15,0.35)'; g.fillRect(sx + 10, p.y + 8, p.w - 20, 2); g.fillRect(sx + 6, p.y + 13, p.w - 12, 1);
    }
  }

  function buildLevelLayer() {
    levelLayer = document.createElement('canvas');
    levelLayer.width = LEVEL_WIDTH; levelLayer.height = 450;
    const g = levelLayer.getContext('2d')!;
    for (let i = 0; i < platforms.length; i++) paintPlatform(g, platforms[i], 0);
    /* colina */
    g.beginPath(); g.moveTo(2150, 350);
    for (let x = 2150; x <= 2400; x += 5) g.lineTo(x, hillY(x)!);
    g.lineTo(2400, 450); g.lineTo(2150, 450); g.closePath();
    const hg = g.createLinearGradient(0, 300, 0, 450);
    hg.addColorStop(0, '#6B3F2A'); hg.addColorStop(1, '#3d2010');
    g.fillStyle = hg; g.fill();
    for (let x = 2150; x < 2400; x += 8) {
      const y = hillY(x + 4)!;
      g.fillStyle = '#5dbb63'; g.fillRect(x, y, 8, 8);
      g.fillStyle = '#3a8c41'; g.fillRect(x, y + 8, 8, 5);
      if ((x * 2654435761) >>> 31) { g.fillStyle = '#4aa552'; g.fillRect(x + 3, y - 4, 2, 5); g.fillRect(x + 6, y - 6, 2, 7); }
    }
  }

  function drawPlatforms() {
    if (levelLayer) {
      const sx = Math.max(0, Math.min(LEVEL_WIDTH - canvas.width, Math.floor(camera.x)));
      ctx.drawImage(levelLayer, sx, 0, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
    }
    nameBlocks.forEach((b) => {
      const sx = b.x - camera.x;
      if (sx + b.w < -10 || sx > canvas.width + 10) return;
      const gl = Math.sin(frameCount * 0.03 + b.x * 0.01) * 0.3 + 0.7;
      ctx.fillStyle = `rgba(255,215,0,${gl})`; ctx.fillRect(sx, b.y, b.w, b.h);
      ctx.fillStyle = '#B8860B'; ctx.fillRect(sx, b.y, 1, b.h); ctx.fillRect(sx, b.y, b.w, 1);
    });
    titleBlocks.forEach((b) => {
      const sx = b.x - camera.x;
      if (sx + b.w < -10 || sx > canvas.width + 10) return;
      const gl = Math.sin(frameCount * 0.04 + b.x * 0.02) * 0.2 + 0.8;
      ctx.fillStyle = `rgba(200,200,220,${gl})`; ctx.fillRect(sx, b.y, b.w, b.h);
    });
    if (!player.healedByName && player.lives < player.maxLives) {
      const sx = nameBounds.x - camera.x;
      if (sx > -400 && sx < canvas.width + 400) {
        ctx.fillStyle = `rgba(0,255,100,${Math.sin(frameCount * 0.1) * 0.15 + 0.15})`;
        ctx.fillRect(sx, nameBounds.y, nameBounds.w, nameBounds.h);
      }
    }
    drawAbyssWarning(750, 950);
  }

  function drawAbyssWarning(start: number, end: number) {
    const sx = start - camera.x, w = end - start;
    if (sx + w < 0 || sx > canvas.width) return;
    const grad = ctx.createLinearGradient(0, 350, 0, 450);
    grad.addColorStop(0, 'rgba(0,0,0,0)'); grad.addColorStop(1, 'rgba(0,0,0,0.8)');
    ctx.fillStyle = grad; ctx.fillRect(sx, 350, w, 100);
  }

  /* =====================================================
   *  COLETÁVEIS / INIMIGOS / BOSS / BALAS / BOMBAS
   * ===================================================== */
  function drawCollectibles() {
    coins.forEach((coin, idx) => {
      if (coin.collected) return;
      const sx = coin.x - camera.x;
      if (sx + coin.w < -50 || sx > canvas.width + 50) return;
      if (coin.type === 'coin') {
        ctx.globalAlpha = 0.4; drawGlow('#ffd700', sx + coin.w / 2, coin.y + coin.h / 2, coin.w * 1.4); ctx.globalAlpha = 1;
        drawPixelArt(ctx, COIN_FRAMES, Math.floor((frameCount + idx * 7) / 7) % 4, PAL_COIN, sx, coin.y, PIXEL, false);
      } else {
        ctx.globalAlpha = 0.45; drawGlow('#ff8800', sx + coin.w / 2, coin.y + coin.h / 2, coin.w * 1.4); ctx.globalAlpha = 1;
        ctx.save(); ctx.translate(sx + coin.w / 2, coin.y + coin.h / 2); ctx.rotate((frameCount + idx * 10) * 0.02);
        drawPixelArt(ctx, STAR_FRAMES, 0, PAL_STAR, -coin.w / 2, -coin.h / 2, PIXEL, false);
        ctx.restore();
      }
    });
    const drawHeart = (item: { x: number; y: number; w: number; h: number; collected: boolean }) => {
      if (item.collected) return;
      const sx = item.x - camera.x;
      if (sx < -50 || sx > canvas.width + 50) return;
      const pulse = Math.sin(frameCount * 0.1) * 0.2 + 1;
      ctx.globalAlpha = 0.5; drawGlow('#ff0066', sx + item.w / 2, item.y + item.h / 2, 40); ctx.globalAlpha = 1;
      ctx.save(); ctx.translate(sx + item.w / 2, item.y + item.h / 2); ctx.scale(pulse, pulse);
      drawPixelArt(ctx, HEALTH_FRAMES, 0, PAL_HEALTH, -item.w / 2, -item.h / 2, PIXEL, false);
      ctx.restore();
    };
    drawHeart(healthItem);
    drawHeart(chamberHeart);
    if (!shieldItem.collected) {
      const sx = shieldItem.x - camera.x;
      if (sx >= -50 && sx <= canvas.width + 50) {
        const pulse = Math.sin(frameCount * 0.08) * 0.15 + 1;
        ctx.save(); ctx.translate(sx + shieldItem.w / 2, shieldItem.y + shieldItem.h / 2); ctx.scale(pulse, pulse);
        ctx.fillStyle = '#0088ff'; ctx.fillRect(-12, -12, 24, 24);
        ctx.fillStyle = '#00aaff'; ctx.fillRect(-10, -10, 20, 20);
        ctx.fillStyle = '#fff'; ctx.fillRect(-4, -8, 8, 4); ctx.fillRect(-2, -4, 4, 12);
        ctx.restore();
      }
    }
    if (superAmmo.spawned && !superAmmo.collected) {
      const sx = superAmmo.x - camera.x;
      if (sx >= -50 && sx <= canvas.width + 50) {
        const pulse = Math.sin(frameCount * 0.15) * 0.3 + 1;
        ctx.globalAlpha = 0.5; drawGlow('#00ffff', sx + 18, superAmmo.y + 18, 50); ctx.globalAlpha = 1;
        ctx.save(); ctx.translate(sx + 18, superAmmo.y + 18); ctx.scale(pulse, pulse); ctx.rotate(frameCount * 0.05);
        ctx.fillStyle = '#00ffff'; ctx.fillRect(-14, -6, 28, 12);
        ctx.fillStyle = '#fff'; ctx.fillRect(-10, -4, 20, 8);
        ctx.fillStyle = '#ffff00'; ctx.fillRect(-6, -2, 12, 4);
        ctx.restore();
      }
    }
  }

  function drawEnemies() {
    enemies.forEach((e) => {
      const sx = e.x - camera.x;
      if (sx + e.w < -50 || sx > canvas.width + 50) return;
      e.timer++;
      if (e.timer % 14 === 0) e.frame = (e.frame + 1) % 2;
      if (e.stompCount >= 1) ctx.globalAlpha = 0.6 + Math.sin(frameCount * 0.3) * 0.2;
      drawPixelArt(ctx, ENEMY_FRAMES, e.frame, PAL_ENEMY, sx, e.y, PIXEL, e.dir === -1);
      ctx.globalAlpha = 1;
    });
  }

  function drawBoss() {
    if (!boss.active || boss.hidden) return;
    const sx = boss.x - camera.x;
    let pal = PAL_MECHA;
    if (boss.hp < 4 && Math.floor(frameCount / 6) % 2 === 0) pal = ['#ff5555', '#aa2222', '#ffffff', '#ffff00', '#333333'];
    boss.timer++;
    if (boss.timer % 12 === 0) boss.frame = (boss.frame + 1) % 2;
    drawPixelArt(ctx, MECHA_FRAMES, boss.frame, pal, sx, boss.y, PIXEL, boss.dir === -1);
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

  function drawBullets() {
    bullets.forEach((b) => {
      const sx = b.x - camera.x;
      if (sx < -20 || sx > canvas.width + 20) return;
      drawPixelArt(ctx, BULLET_FRAMES, 0, PAL_ENEMY, sx, b.y, 2, false);
    });
    playerBullets.forEach((b) => {
      const sx = b.x - camera.x;
      if (sx < -20 || sx > canvas.width + 20) return;
      if (b.isSuper) {
        ctx.globalAlpha = 0.35; ctx.fillStyle = '#00ffff'; ctx.fillRect(sx - 3, b.y - 3, b.w + 6, b.h + 6);
        ctx.globalAlpha = 1; ctx.fillStyle = '#00ffff'; ctx.fillRect(sx, b.y, b.w, b.h);
        ctx.fillStyle = '#fff'; ctx.fillRect(sx + 2, b.y + 1, b.w - 4, b.h - 2);
      } else {
        ctx.globalAlpha = 0.3; ctx.fillStyle = '#00ff00'; ctx.fillRect(sx - 2, b.y - 2, b.w + 4, b.h + 4);
        ctx.globalAlpha = 1; ctx.fillStyle = '#00ff00'; ctx.fillRect(sx, b.y, b.w, b.h);
      }
    });
  }

  function throwBomb() {
    if (gameState !== 'GAME' || gameOver || victoryPhase > 2 || d3Active) return;
    if (bombs <= 0) return;
    bombs--;
    bombProjs.push({ x: player.x + player.w / 2 + player.dir * 10, y: player.y + 2, vx: player.dir * 5.5, vy: -9 });
    SOUNDS.bombThrow();
  }

  function updateBombs() {
    if (gameState === 'DEFEAT' || victoryPhase >= 3) return;
    for (let i = bombProjs.length - 1; i >= 0; i--) {
      const b = bombProjs[i];
      b.vy += 0.4; b.x += b.vx; b.y += b.vy;
      let hitY = -1, hitMark = false;
      platforms.forEach((p) => {
        if (b.x > p.x && b.x < p.x + p.w && b.y >= p.y && b.y <= p.y + Math.max(14, p.h * 0.6) && b.vy >= 0) { hitY = p.y; hitMark = true; }
      });
      if (hitY < 0)
        nameBlocks.concat(titleBlocks).forEach((bl) => {
          if (b.x > bl.x && b.x < bl.x + bl.w && b.y >= bl.y && b.y <= bl.y + bl.h + 4 && b.vy >= 0) { hitY = bl.y; hitMark = false; }
        });
      if (hitY >= 0) { explodeBomb(b, hitMark ? hitY : null); bombProjs.splice(i, 1); continue; }
      if (b.y > ABYSS_Y - 20) { explodeBomb(b, null); bombProjs.splice(i, 1); continue; }
      if (b.x < -40 || b.x > LEVEL_WIDTH + 40) bombProjs.splice(i, 1);
    }
  }

  function explodeBomb(b: BombProj, markY: number | null) {
    SOUNDS.explosion();
    screenShake = Math.max(screenShake, 7);
    spawnParticles(b.x, b.y, ['#ff8800', '#ffcc00', '#666', '#333'], 26);
    for (let k = 0; k < 6; k++) spawnSmoke(b.x + (Math.random() - 0.5) * 30, b.y);
    if (markY !== null) {
      scorchMarks.push({ x: b.x - 20, y: markY, w: 40 });
      if (scorchMarks.length > 24) scorchMarks.shift();
    }
    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      if (Math.hypot(e.x + e.w / 2 - b.x, e.y + e.h / 2 - b.y) < 80) {
        SOUNDS.punch();
        const data = enemiesData.find((d) => d.id === e.id);
        if (data) { data.alive = false; data.respawnTimer = 300; }
        enemies.splice(j, 1); score += 25;
        spawnParticles(e.x + e.w / 2, e.y + e.h / 2, ['#e74c3c', '#fff', '#ffd700'], 16);
      }
    }
    damageBoss(5, b.x, b.y, false);
  }

  function drawBombProjs() {
    bombProjs.forEach((b) => {
      const sx = b.x - camera.x;
      ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.arc(sx, b.y, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#4d4d4d'; ctx.fillRect(sx - 3, b.y - 4, 2, 2);
      ctx.fillStyle = '#8a5a2a'; ctx.fillRect(sx - 1, b.y - 9, 2, 4);
      ctx.fillStyle = Math.floor(frameCount / 3) % 2 === 0 ? '#ffdd00' : '#ff6600';
      ctx.fillRect(sx - 2, b.y - 12, 3, 3);
    });
  }

  function drawScorchMarks() {
    scorchMarks.forEach((m) => {
      const sx = m.x - camera.x;
      if (sx + m.w < -10 || sx > canvas.width + 10) return;
      ctx.fillStyle = 'rgba(8,8,8,0.6)';
      ctx.beginPath(); ctx.ellipse(sx + m.w / 2, m.y + 3, m.w / 2, 5, 0, 0, Math.PI * 2); ctx.fill();
    });
  }

  function drawGoldenKey() {
    if (!goldenKey.active || goldenKey.collected) return;
    goldenKey.bobT += 0.06;
    let kx = goldenKey.x - camera.x;
    let ky = goldenKey.y + Math.sin(goldenKey.bobT) * 8;
    if (keyFlyT >= 0) {
      const t = Math.min(1, keyFlyT / 60);
      kx = goldenKey.x + (player.x + player.w / 2 - goldenKey.x) * t - camera.x;
      ky = goldenKey.y + (player.y - goldenKey.y) * t;
    }
    ctx.globalAlpha = 0.6; drawGlow('#ffd700', kx + 20, ky + 20, 55); ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(kx + 6, ky, 28, 4); ctx.fillRect(kx + 2, ky + 4, 4, 16); ctx.fillRect(kx + 34, ky + 4, 4, 16);
    ctx.fillRect(kx + 6, ky + 20, 28, 4); ctx.fillRect(kx + 16, ky + 24, 8, 20);
    ctx.fillRect(kx + 24, ky + 32, 8, 4); ctx.fillRect(kx + 24, ky + 40, 8, 4);
    ctx.fillStyle = '#fff8a0'; ctx.fillRect(kx + 10, ky + 6, 8, 8);
    if (victoryPhase === 2 && keyFlyT < 0 && Math.floor(frameCount / 12) % 2 === 0) {
      ctx.fillStyle = '#ffd700'; ctx.font = 'bold 24px "Courier New", monospace';
      ctx.textAlign = 'center'; ctx.fillText('PEGUE A CHAVE!', canvas.width / 2, 120);
      ctx.textAlign = 'left';
    }
  }

  function drawRocket(rx: number, ry: number) {
    if (rocketTakingOff) {
      for (let i = 0; i < 6; i++) {
        const fh = 60 + Math.random() * 80;
        ctx.fillStyle = i % 2 ? '#ffdd00' : '#ff6600';
        ctx.globalAlpha = 0.8;
        ctx.beginPath(); ctx.moveTo(rx - 15 + i * 7, ry + 95);
        ctx.lineTo(rx - 10 + i * 7, ry + 95 + fh); ctx.lineTo(rx - 5 + i * 7, ry + 95); ctx.fill();
      }
      ctx.globalAlpha = 1;
      for (let i = 0; i < 3; i++) spawnSmoke(rx + camera.x * 0 + (Math.random() - 0.5) * 30 + camera.x, ry + 100 + Math.random() * 20);
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
    if (!rocketTakingOff) {
      ctx.fillStyle = '#777';
      ctx.fillRect(rx - 35, ry + 94, 8, 10); ctx.fillRect(rx + 27, ry + 94, 8, 10);
    }
    ctx.fillStyle = '#ffd700'; ctx.font = 'bold 14px "Courier New", monospace';
    ctx.textAlign = 'center'; ctx.fillText('M', rx, ry + 85);
    ctx.textAlign = 'left';
  }

  function drawPlayer() {
    if (gameState === 'DEFEAT' || playerEnteredRocket) return;
    const sx = player.x - camera.x;
    if (player.hasShield) {
      ctx.strokeStyle = `rgba(0,136,255,${0.5 + Math.sin(frameCount * 0.2) * 0.3})`;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(sx + player.w / 2, player.y + player.h / 2, player.w, 0, Math.PI * 2); ctx.stroke();
    }
    if (player.invulnerable && Math.floor(frameCount / 4) % 2 === 0) ctx.globalAlpha = 0.3;
    let frame: number;
    if (victoryPhase >= 3) frame = Math.floor(frameCount / 8) % 2 + 1;
    else if (player.shooting && player.hasGun) frame = 5;
    else if (player.crouching) frame = 4;
    else if (!player.onGround) frame = 3;
    else if (player.moving) frame = Math.floor(frameCount / 8) % 2 + 1;
    else frame = 0;
    let pal: Palette, frames: string[][];
    if (player.lives === 3) { pal = PAL_HERO_3; frames = HERO_FRAMES; }
    else if (player.lives === 2) { pal = PAL_HERO_2; frames = HERO_FRAMES_DMG; }
    else { pal = PAL_HERO_1; frames = HERO_FRAMES_DMG; }
    drawPixelArt(ctx, frames, frame, pal, sx, player.y, PIXEL, player.dir === -1);
    ctx.globalAlpha = 1;
    if (player.hasGun && victoryPhase < 3) {
      ctx.fillStyle = player.lives === 1 ? '#444' : '#666';
      ctx.fillRect(player.dir === 1 ? sx + player.w - 5 : sx - 3, player.y + 12, 8, 4);
    }
    if (goldenKey.collected && victoryPhase >= 3) {
      ctx.fillStyle = '#ffd700'; ctx.fillRect(sx + player.w + 2, player.y + 10, 8, 12);
    }
  }

  /* brilho dourado + bateria do Bobby (cutscene) */
  function drawD3Fx() {
    if (d3Active) {
      const bw = 90, bh = 16;
      const bx = canvas.width / 2 - bw / 2, by = HUD_HEIGHT + 14;
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      roundRect(bx - 8, by - 8, bw + 16, bh + 24, 8); ctx.fill();
      ctx.strokeStyle = '#00ff88'; ctx.lineWidth = 2;
      ctx.strokeRect(bx, by, bw, bh);
      ctx.fillStyle = '#00ff88'; ctx.fillRect(bx + bw, by + 4, 3, 8);
      ctx.fillStyle = d3Battery >= 100 ? '#00ff88' : '#ffd700';
      ctx.fillRect(bx + 2, by + 2, Math.max(2, (d3Battery / 100) * (bw - 4)), bh - 4);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 10px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`CARREGANDO ${Math.floor(d3Battery)}%`, canvas.width / 2, by + bh + 12);
      ctx.textAlign = 'left';
    }
    if (d3Glow > 0) {
      const px = player.x + player.w / 2 - camera.x;
      const py = player.y + player.h / 2;
      ctx.globalAlpha = Math.min(0.3, (d3Glow / 480) * 0.3);
      drawGlow('#ffd700', px, py, 48);
      ctx.globalAlpha = 1;
    }
  }

  /* =====================================================
   *  HUD / CARDS / TELAS
   * ===================================================== */
  function drawHeartHUD(x: number, y: number, size: number, filled: boolean) {
    const s = size;
    ctx.fillStyle = filled ? '#ff0066' : '#333';
    ctx.fillRect(x + 1 * s, y, 2 * s, s); ctx.fillRect(x + 4 * s, y, 2 * s, s);
    ctx.fillRect(x, y + 1 * s, 7 * s, s); ctx.fillRect(x, y + 2 * s, 7 * s, s);
    ctx.fillRect(x + 1 * s, y + 3 * s, 5 * s, s); ctx.fillRect(x + 2 * s, y + 4 * s, 3 * s, s);
    ctx.fillRect(x + 3 * s, y + 5 * s, 1 * s, s);
    if (filled) { ctx.fillStyle = '#ff88aa'; ctx.fillRect(x + 1 * s, y + 1 * s, s, s); }
  }

  function drawMiniBomb(x: number, y: number, on: boolean) {
    ctx.globalAlpha = on ? 1 : 0.25;
    ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#555'; ctx.fillRect(x - 4, y - 4, 3, 3);
    ctx.fillStyle = '#8a5a2a'; ctx.fillRect(x - 1, y - 10, 2, 4);
    ctx.fillStyle = on ? '#ffcc00' : '#666'; ctx.fillRect(x - 2, y - 12, 3, 3);
    ctx.globalAlpha = 1;
  }

  function drawHUD() {
    if (!hudGrad) {
      hudGrad = ctx.createLinearGradient(0, 0, 0, HUD_HEIGHT);
      hudGrad.addColorStop(0, '#1a1a2e'); hudGrad.addColorStop(1, '#16213e');
    }
    ctx.fillStyle = hudGrad; ctx.fillRect(0, 0, canvas.width, HUD_HEIGHT);
    ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, HUD_HEIGHT); ctx.lineTo(canvas.width, HUD_HEIGHT); ctx.stroke();

    ctx.fillStyle = '#ffd700'; ctx.font = 'bold 16px "Courier New", monospace';
    ctx.fillText('PONTOS:', 12, 24);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 22px "Courier New", monospace';
    ctx.fillText(String(score), 12, 48);

    const tc = timeLeft < 30 ? '#ff4444' : '#00ff88';
    ctx.fillStyle = tc; ctx.font = 'bold 16px "Courier New", monospace';
    ctx.textAlign = 'center'; ctx.fillText('TEMPO', canvas.width / 2, 24);
    ctx.font = 'bold 26px "Courier New", monospace';
    if (timeLeft < 30 && Math.floor(frameCount / 10) % 2 === 0) ctx.fillStyle = '#ffff00';
    ctx.fillText(String(Math.ceil(timeLeft)), canvas.width / 2, 50);
    ctx.textAlign = 'right';

    ctx.fillStyle = '#ff6b6b'; ctx.font = 'bold 14px "Courier New", monospace';
    ctx.fillText('VIDAS:', canvas.width - 10, 22);
    for (let i = 0; i < player.maxLives; i++) drawHeartHUD(canvas.width - 78 + i * 26, 28, 3, i < player.lives);

    /* contador de bombas */
    for (let i = 0; i < 3; i++) drawMiniBomb(canvas.width - 130 - i * 20, 40, i < bombs);
    if (bombNotice > 0) {
      bombNotice--;
      ctx.textAlign = 'center';
      ctx.globalAlpha = Math.min(1, bombNotice / 40);
      ctx.fillStyle = '#00ffff'; ctx.font = 'bold 16px "Courier New", monospace';
      ctx.fillText('+BOMB', canvas.width / 2, 90);
      ctx.globalAlpha = 1; ctx.textAlign = 'left';
    }
    ctx.textAlign = 'left';
  }

  const liBtn = { x: 0, y: 0, w: 0, h: 0, active: false };
  function drawLinkedinCardButton(cx: number, y: number) {
    const w = 250, h = 34;
    liBtn.x = cx - w / 2; liBtn.y = y; liBtn.w = w; liBtn.h = h; liBtn.active = true;
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#00a0dc'); g.addColorStop(1, '#0077B5');
    ctx.fillStyle = g; roundRect(cx - w / 2, y, w, h, 10); ctx.fill();
    ctx.strokeStyle = '#66ccff'; ctx.lineWidth = 1.5; roundRect(cx - w / 2, y, w, h, 10); ctx.stroke();
    ctx.fillStyle = '#fff'; roundRect(cx - w / 2 + 10, y + 7, 20, 20, 4); ctx.fill();
    ctx.fillStyle = '#0077B5'; ctx.font = 'bold 13px "Courier New", monospace';
    ctx.textAlign = 'center'; ctx.fillText('in', cx - w / 2 + 20, y + 22);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 14px "Courier New", monospace';
    ctx.fillText('Conhecer o Marcos', cx + 16, y + 22);
    ctx.textAlign = 'left';
  }
  function hitLinkedinButton(x: number, y: number): boolean {
    return liBtn.active && x >= liBtn.x && x <= liBtn.x + liBtn.w && y >= liBtn.y && y <= liBtn.y + liBtn.h;
  }
  function toCanvasPoint(clientX: number, clientY: number) {
    const r = canvas.getBoundingClientRect();
    return { x: ((clientX - r.left) / r.width) * canvas.width, y: ((clientY - r.top) / r.height) * canvas.height };
  }

  function drawPopupCard(x: number, y: number, w: number, h: number, stripe: [string, string], title: string) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 6;
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#eef1f6');
    ctx.fillStyle = g; roundRect(x, y, w, h, 18); ctx.fill();
    ctx.restore();
    const sg = ctx.createLinearGradient(x, 0, x + w, 0);
    sg.addColorStop(0, stripe[0]); sg.addColorStop(1, stripe[1]);
    ctx.fillStyle = sg;
    roundRect(x, y, w, 46, 18); ctx.fill();
    ctx.fillRect(x, y + 24, w, 22);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 18px "Courier New", monospace';
    ctx.textAlign = 'center'; ctx.fillText(title, x + w / 2, y + 30);
    ctx.textAlign = 'left';
  }

  function drawActionPill(cx: number, cy: number, w: number, text: string) {
    const pulse = Math.sin(frameCount * 0.1) * 0.15 + 0.85;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#ffd700';
    roundRect(cx - w / 2, cy - 18, w, 36, 18); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#1f2430'; ctx.font = 'bold 15px "Courier New", monospace';
    ctx.textAlign = 'center'; ctx.fillText(text, cx, cy + 5);
    ctx.textAlign = 'left';
  }

  /* ---------- derrota ---------- */
  function drawDefeatWorld() {
    const sx = player.x - camera.x;
    if (defeatPhase < 2) {
      drawSingleFrame(ctx, BOBBY_KNEEL, PAL_HERO_1, sx, player.y - 10, PIXEL, player.dir === -1);
      enemies.forEach((e) => {
        const esx = e.x - camera.x;
        if (esx > -50 && esx < canvas.width + 50) {
          const lookDir = player.x > e.x ? 1 : -1;
          drawPixelArt(ctx, ENEMY_FRAMES, 0, PAL_ENEMY, esx, e.y, PIXEL, lookDir === -1);
        }
      });
    }
    defeatExplosions.forEach((exp) => {
      ctx.globalAlpha = Math.max(0, exp.life / 30);
      ctx.fillStyle = exp.size % 2 > 1 ? '#ff6600' : '#ffaa00';
      ctx.beginPath(); ctx.arc(exp.x - camera.x, exp.y, exp.size, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    if (defeatPhase === 2) {
      const sz = defeatTimer * 5;
      ctx.globalAlpha = Math.max(0, 1 - defeatTimer / 60);
      ctx.fillStyle = '#ff4400';
      ctx.beginPath(); ctx.arc(sx + player.w / 2, player.y + player.h / 2, sz, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function drawDefeatScreen() {
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (defeatPhase >= 1 && defeatPhase <= 2) {
      const a = 0.55 + 0.45 * Math.sin(frameCount * 0.15);
      ctx.globalAlpha = a; ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd700'; ctx.font = 'bold 26px "Courier New", monospace';
      ctx.fillText('Não desista!', canvas.width / 2, 120);
      ctx.fillStyle = '#e6e6e6'; ctx.font = '15px "Courier New", monospace';
      ctx.fillText('Tente de novo...', canvas.width / 2, 148);
      ctx.globalAlpha = 1; ctx.textAlign = 'left';
    }
    if (defeatPhase >= 3) {
      const pw = Math.min(470, canvas.width - 24), ph = 276;
      const px = canvas.width / 2 - pw / 2, py = defeatSignY;
      drawPopupCard(px, py, pw, ph, ['#e74c3c', '#c0392b'], 'GAME OVER');
      drawPixelArt(ctx, BOBBY_FACE, 0, ['#95a5a6', '#4a5568', '#fff', '#cbd5e0', '#2d3748'], px + 28, py + 80, 3, false);
      ctx.fillStyle = '#1f2430'; ctx.font = 'bold 22px "Courier New", monospace';
      ctx.fillText('VOCÊ FOI DERROTADO', px + 100, py + 100);
      ctx.fillStyle = '#5a6478'; ctx.font = '15px "Courier New", monospace';
      ctx.fillText(`Pontuação: ${score}`, px + 100, py + 128);
      ctx.fillText('O projeto não pode parar...', px + 100, py + 150);
      if (defeatPhase >= 4) {
        drawActionPill(canvas.width / 2, py + 192, 300, isTouch ? '[ TOQUE ] TENTAR DE NOVO' : '[ ESPAÇO ] TENTAR DE NOVO');
        ctx.fillStyle = '#8a93a8'; ctx.font = '13px "Courier New", monospace';
        ctx.textAlign = 'center'; ctx.fillText('Não desista! Tente de novo ou...', canvas.width / 2, py + 224);
        drawLinkedinCardButton(canvas.width / 2, py + 233);
        ctx.textAlign = 'left';
      } else liBtn.active = false;
    } else liBtn.active = false;
  }

  function updateDefeat() {
    defeatTimer++;
    if (defeatPhase === 0) { if (defeatTimer > 60) { defeatPhase = 1; defeatTimer = 0; } }
    else if (defeatPhase === 1) {
      if (defeatTimer % 15 === 0) {
        defeatExplosions.push({ x: player.x + Math.random() * player.w, y: player.y + Math.random() * player.h, size: 5 + Math.random() * 10, life: 30 });
        SOUNDS.hit();
      }
      if (defeatTimer > 90) { defeatPhase = 2; defeatTimer = 0; SOUNDS.explosion(); }
    } else if (defeatPhase === 2) { if (defeatTimer > 60) { defeatPhase = 3; defeatTimer = 0; } }
    else if (defeatPhase === 3) {
      defeatSignY += 8;
      if (defeatSignY >= 70) { defeatSignY = 70; defeatPhase = 4; }
    }
    for (let i = defeatExplosions.length - 1; i >= 0; i--) {
      defeatExplosions[i].life--; defeatExplosions[i].size += 0.5;
      if (defeatExplosions[i].life <= 0) defeatExplosions.splice(i, 1);
    }
  }

  /* ---------- vitória ---------- */
  function drawVictoryCutscene() {
    if (victoryPhase === 1) {
      const bsx = boss.x - camera.x;
      const burnAlpha = Math.max(0.3, 1 - boss.deathT / 200);
      ctx.globalAlpha = burnAlpha;
      const pal: Palette = Math.floor(frameCount / 3) % 2 === 0
        ? ['#ff3300', '#cc2200', '#ffffff', '#ffff00', '#333']
        : ['#ff6600', '#aa3300', '#ffaa00', '#ffff00', '#222'];
      drawPixelArt(ctx, MECHA_FRAMES, Math.floor(frameCount / 5) % 2, pal, bsx, boss.y, PIXEL, false);
      ctx.globalAlpha = 1;
      if (frameCount % 3 === 0) spawnParticles(boss.x + boss.w / 2 + (Math.random() - 0.5) * 40, boss.y + Math.random() * boss.h, ['#ff4400', '#ffaa00', '#ffff00'], 3);
    }
    if (victoryPhase >= 5 && victoryPhase <= 7) {
      drawRocket(ROCKET_LAND_X - camera.x, rocketY);
    }
  }

  function drawVictoryScreen() {
    ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const confettiColors = ['#ff0066', '#ffd700', '#00ff88', '#00aaff', '#ff8800', '#ff00ff', '#00ffff', '#ffff00'];
    for (let i = 0; i < 8; i++) {
      const fx = 80 + i * (canvas.width - 160) / 7;
      const fy = 60 + Math.sin(frameCount * 0.08 + i) * 30;
      ctx.fillStyle = confettiColors[i];
      ctx.globalAlpha = 0.3 + Math.sin(frameCount * 0.1 + i) * 0.2;
      ctx.beginPath(); ctx.arc(fx, fy, 12 + Math.sin(frameCount * 0.15 + i) * 8, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    const pw = Math.min(520, canvas.width - 24), ph = 346;
    const px = canvas.width / 2 - pw / 2, py = 52;
    drawPopupCard(px, py, pw, ph, ['#2ecc71', '#f1c40f'], 'MISSÃO CUMPRIDA');
    drawPixelArt(ctx, BOBBY_FACE, Math.floor(frameCount / 15) % 2, PAL_BOBBY, canvas.width / 2 - 34, py + 56, 4, false);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#2ecc71'; ctx.font = 'bold 36px "Courier New", monospace';
    ctx.fillText('VITÓRIA!', canvas.width / 2, py + 152);
    ctx.fillStyle = '#1f2430'; ctx.font = 'bold 19px "Courier New", monospace';
    ctx.fillText(`PONTUAÇÃO FINAL: ${score}`, canvas.width / 2, py + 184);
    ctx.fillStyle = '#5a6478'; ctx.font = '15px "Courier New", monospace';
    ctx.fillText('Projeto entregue com sucesso!', canvas.width / 2, py + 210);
    ctx.fillStyle = '#8a93a8'; ctx.font = '13px "Courier New", monospace';
    ctx.fillText('- Bobby IA, Portfolio do Marcão', canvas.width / 2, py + 230);
    drawActionPill(canvas.width / 2, py + 262, 300, isTouch ? '[ TOQUE ] JOGAR DE NOVO' : '[ ESPAÇO ] JOGAR DE NOVO');
    ctx.fillStyle = '#8a93a8'; ctx.font = '13px "Courier New", monospace';
    ctx.fillText('Curtiu a jornada? Vamos conversar!', canvas.width / 2, py + 296);
    drawLinkedinCardButton(canvas.width / 2, py + 305);
    ctx.textAlign = 'left';
  }

  /* ---------- intro / loading ---------- */
  function drawLoadingScreen() {
    ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < canvas.height; y += 4) { ctx.fillStyle = 'rgba(0,255,0,0.03)'; ctx.fillRect(0, y, canvas.width, 2); }
    ctx.fillStyle = '#00ff44'; ctx.font = 'bold 28px "Courier New", monospace';
    ctx.textAlign = 'center'; ctx.fillText('BOBBY IA', canvas.width / 2, 120);
    ctx.fillStyle = '#00aa33'; ctx.font = '16px "Courier New", monospace';
    ctx.fillText('Portfolio do Marcão', canvas.width / 2, 150);
    const bobbyX = canvas.width * 0.1 + loadProgress * (canvas.width * 0.7) / 100;
    bobbyRunFrame = Math.floor(frameCount / 6) % 3;
    drawPixelArt(ctx, BOBBY_RUN, bobbyRunFrame, PAL_BOBBY, bobbyX, 220, 4, false);
    const barX = canvas.width * 0.19, barY = 300, barW = canvas.width * 0.62, barH = 25;
    ctx.strokeStyle = '#00ff44'; ctx.lineWidth = 2; ctx.strokeRect(barX, barY, barW, barH);
    const fillW = barW * (loadProgress / 100);
    ctx.fillStyle = '#00ff44'; ctx.fillRect(barX + 2, barY + 2, Math.max(0, fillW - 4), barH - 4);
    ctx.fillStyle = '#00ff44'; ctx.font = 'bold 16px "Courier New", monospace';
    ctx.fillText(`${Math.floor(loadProgress)}%`, canvas.width / 2, barY + barH + 30);
    ctx.textAlign = 'left';
    loadProgress += 0.5;
    if (loadProgress >= 100) {
      loadProgress = 100;
      if (frameCount % 50 === 0) { gameState = 'INTRO'; introTimer = 0; SOUNDS.boot(); }
    }
  }

  function wrapText(text: string, maxWidth: number, it: number): string[] {
    ctx.font = `${Math.round(14 * it)}px "Courier New", monospace`;
    const words = text.split(' ');
    const lines: string[] = [];
    let line = '';
    words.forEach((word) => {
      const test = line + word + ' ';
      if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word + ' '; }
      else line = test;
    });
    if (line) lines.push(line);
    return lines;
  }

  function drawIntroScreen() {
    const it = isTouch ? 1.4 : 1;
    ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < canvas.height; y += 4) { ctx.fillStyle = 'rgba(0,255,0,0.03)'; ctx.fillRect(0, y, canvas.width, 2); }
    ctx.strokeStyle = '#00ff44'; ctx.lineWidth = 2;
    ctx.strokeRect(20, 14, canvas.width - 40, canvas.height - 28);
    ctx.fillStyle = '#002211'; ctx.fillRect(21, 15, canvas.width - 42, 28);
    ctx.fillStyle = '#00ff44'; ctx.font = `bold ${Math.round(13 * it)}px "Courier New", monospace`;
    ctx.textAlign = 'center'; ctx.fillText('[ BOBBY IA - TERMINAL v1.0 ]', canvas.width / 2, 36);

    const faceFrame = introComplete ? 0 : Math.floor(frameCount / 10) % 2;
    drawPixelArt(ctx, BOBBY_FACE, faceFrame, PAL_BOBBY, 40, isTouch ? 52 : 60, isTouch ? 4 : 4, false);
    ctx.fillStyle = '#00ff44'; ctx.font = `bold ${Math.round(17 * it)}px "Courier New", monospace`;
    ctx.textAlign = 'left'; ctx.fillText('Bobby IA', 115, isTouch ? 78 : 82);
    ctx.fillStyle = '#006622'; ctx.font = `${Math.round(12 * it)}px "Courier New", monospace`;
    ctx.fillText('Sistema Semantico v2.0', 115, isTouch ? 98 : 100);
    ctx.fillText('Criado por Marcos Eduardo', 115, isTouch ? 116 : 116);

    introTimer++;
    if (!introComplete && !introSkipped) {
      if (introTimer % 2 === 0 && introCharIndex < INTRO_FULL_TEXT.length) {
        introCharIndex++;
        if (introTimer % 4 === 0) SOUNDS.type();
      }
      if (introCharIndex >= INTRO_FULL_TEXT.length) introComplete = true;
    }
    const visibleText = introSkipped ? INTRO_FULL_TEXT : INTRO_FULL_TEXT.substring(0, introCharIndex);
    const lineH = Math.round(19 * it);
    const topY = isTouch ? 136 : 150;
    const bottomLimit = canvas.height - 60;
    const lines = wrapText(visibleText, canvas.width - 80, it);
    const maxLines = Math.max(1, Math.floor((bottomLimit - topY) / lineH));
    const start = Math.max(0, lines.length - maxLines);
    ctx.fillStyle = '#00ff44';
    ctx.font = `${Math.round(14 * it)}px "Courier New", monospace`;
    let lastY = topY;
    for (let i = start; i < lines.length; i++) {
      lastY = topY + (i - start) * lineH;
      ctx.fillText(lines[i], 40, lastY);
    }
    if ((!introComplete && !introSkipped) || Math.floor(frameCount / 15) % 2 === 0) {
      const cursorX = 40 + ctx.measureText(lines[lines.length - 1] ?? '').width;
      ctx.fillRect(cursorX + 2, lastY - 12 * it, 9 * it, 15 * it);
    }
    if (introComplete || introSkipped) {
      const pulse = Math.sin(frameCount * 0.08) * 0.3 + 0.7;
      ctx.globalAlpha = pulse; ctx.fillStyle = '#00ff44';
      ctx.font = `bold ${Math.round(17 * it)}px "Courier New", monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(isTouch ? '[ TOQUE PARA COMECAR ]' : '[ PRESSIONE ESPACO PARA COMECAR ]', canvas.width / 2, canvas.height - 30);
      ctx.globalAlpha = 1; ctx.textAlign = 'left';
    }
  }

  function drawWatermark() {
    ctx.globalAlpha = 0.4 + Math.sin(frameCount * 0.02) * 0.1;
    ctx.fillStyle = '#ffd700'; ctx.font = 'bold 11px "Courier New", monospace';
    ctx.textAlign = 'right';
    if (gameState === 'GAME') {
      ctx.fillText('© Marcos Eduardo - 2026', canvas.width - 10, canvas.height - 10);
      ctx.font = '9px "Courier New", monospace'; ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.3;
      ctx.fillText('Dev with Bobby IA', canvas.width - 10, canvas.height - 22);
    }
    ctx.globalAlpha = 1; ctx.textAlign = 'left';
  }

  /* ---------- controles touch (joystick) ---------- */
  function resizeOverlay() {
    overlay.width = window.innerWidth; overlay.height = window.innerHeight;
  }
  function bombBtnPos() {
    return { x: overlay.width - 187, y: overlay.height - 100, r: 28 };
  }
  function drawTouchControls() {
    octx.clearRect(0, 0, overlay.width, overlay.height);
    if (!isTouch || gameState !== 'GAME' || gameOver || victoryPhase > 2) return;
    const W = overlay.width, H = overlay.height;
    const bx = 95, by = H - 115;
    const inJump = joy.active && joy.baseY - joy.y >= JUMP_ZONE;
    octx.save();
    octx.fillStyle = 'rgba(255,215,0,0.10)'; octx.strokeStyle = 'rgba(255,215,0,0.45)'; octx.lineWidth = 2;
    octx.beginPath(); octx.arc(bx, by, JOY_R, 0, Math.PI * 2); octx.fill(); octx.stroke();
    octx.fillStyle = inJump ? 'rgba(0,255,136,0.95)' : 'rgba(0,255,136,0.45)';
    octx.beginPath(); octx.moveTo(bx, by - JOY_R + 8); octx.lineTo(bx - 8, by - JOY_R + 22); octx.lineTo(bx + 8, by - JOY_R + 22); octx.closePath(); octx.fill();
    octx.fillStyle = 'rgba(255,255,255,0.5)';
    octx.beginPath(); octx.moveTo(bx - JOY_R + 8, by); octx.lineTo(bx - JOY_R + 22, by - 8); octx.lineTo(bx - JOY_R + 22, by + 8); octx.closePath(); octx.fill();
    octx.beginPath(); octx.moveTo(bx + JOY_R - 8, by); octx.lineTo(bx + JOY_R - 22, by - 8); octx.lineTo(bx + JOY_R - 22, by + 8); octx.closePath(); octx.fill();
    const tx = joy.active ? joy.x : bx, ty = joy.active ? joy.y : by;
    octx.fillStyle = inJump ? 'rgba(0,255,136,0.85)' : 'rgba(255,215,0,0.8)';
    octx.beginPath(); octx.arc(tx, ty, 16, 0, Math.PI * 2); octx.fill();
    const fx = W - 95, fy = H - 115, r = (fire.active ? 0.9 : 1) * 40;
    octx.fillStyle = 'rgba(231,76,60,0.85)';
    octx.beginPath(); octx.arc(fx, fy, r, 0, Math.PI * 2); octx.fill();
    octx.strokeStyle = 'rgba(255,255,255,0.9)'; octx.lineWidth = 2;
    octx.beginPath(); octx.arc(fx, fy, 14, 0, Math.PI * 2); octx.stroke();
    octx.beginPath(); octx.moveTo(fx - r + 6, fy); octx.lineTo(fx - 20, fy); octx.moveTo(fx + 20, fy); octx.lineTo(fx + r - 6, fy);
    octx.moveTo(fx, fy - r + 6); octx.lineTo(fx, fy - 20); octx.moveTo(fx, fy + 20); octx.lineTo(fx, fy + r - 6); octx.stroke();
    const bb = bombBtnPos();
    octx.fillStyle = bombs > 0 ? 'rgba(255,204,0,0.85)' : 'rgba(120,120,120,0.5)';
    octx.beginPath(); octx.arc(bb.x, bb.y, bb.r, 0, Math.PI * 2); octx.fill();
    octx.fillStyle = '#1a1a1a'; octx.beginPath(); octx.arc(bb.x, bb.y, 11, 0, Math.PI * 2); octx.fill();
    octx.fillStyle = '#ffcc00'; octx.fillRect(bb.x - 2, bb.y - 18, 3, 5);
    octx.restore();
  }

  /* =====================================================
   *  LÓGICA — update
   * ===================================================== */
  function doJump() {
    if (gameState !== 'GAME' || gameOver || victoryPhase > 2 || d3Active) return;
    if (player.onGround && !player.crouching) {
      player.jumping = true; player.velY = -player.jumpPower; player.onGround = false;
      SOUNDS.jump();
    }
  }

  function updatePlayer() {
    if (victoryPhase >= 3 || d3Active) return;
    player.moving = false;
    if (keys['ArrowLeft'] || keys['a']) { player.x -= player.speed; player.moving = true; player.dir = -1; }
    if (keys['ArrowRight'] || keys['d']) { player.x += player.speed; player.moving = true; player.dir = 1; }
    const wantCrouch = !!(keys['ArrowDown'] || keys['s']);
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
      playerBullets.push({ x: player.dir === 1 ? player.x + player.w : player.x - 12, y: player.y + 12, vx: player.dir * (isSuper ? 14 : 10), w: isSuper ? 18 : 12, h: isSuper ? 8 : 4, isSuper, damage: isSuper ? 4 : 1 });
      player.shootCooldown = isSuper ? 20 : 12;
      if (isSuper) { player.superShots--; SOUNDS.superShot(); if (player.superShots <= 0) player.hasSuperAmmo = false; }
      else SOUNDS.shoot();
    }
    player.velY += player.gravity; player.y += player.velY; player.onGround = false;
    platforms.forEach((p) => {
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
      if (victoryPhase >= 1) landSafe();
      else { SOUNDS.fall(); player.lives = 0; triggerDefeat(); }
    }
    if (player.invulnerable) { player.invulnerableTimer--; if (player.invulnerableTimer <= 0) player.invulnerable = false; }
    if (player.hasShield) { player.shieldTimer--; if (player.shieldTimer <= 0) player.hasShield = false; }

    /* ativa o boss quando Bobby entra na câmara + sela a passagem */
    if (player.x > CHAMBER_X0 && !boss.active && !boss.defeated && victoryPhase === 0) {
      boss.active = true;
      SOUNDS.bossRoar();
      music.setZone('batalha');
      if (!mineSealed) {
        mineSealed = true;
        SOUNDS.collapse();
        screenShake = Math.max(screenShake, 12);
        spawnParticles(MINE_X + 55, 300, ['#5a4a5e', '#8a6a4a', '#333'], 40);
      }
    }

    if (!hasSteppedOnMarcos) {
      if (player.x + player.w > nameBounds.x && player.x < nameBounds.x + nameBounds.w && player.y + player.h > nameBounds.y && player.y < nameBounds.y + nameBounds.h) {
        hasSteppedOnMarcos = true;
        music.setZone('esperanca');
        if (!d3Done && !d3Active && victoryPhase === 0) {
          d3Active = true; d3T = 0; d3PhaseT = 0; d3Phase = 0; d3Battery = 0;
          csBoss.x = 2490; csBoss.y = 150;
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

  function triggerDefeat() {
    gameOver = true; gameState = 'DEFEAT';
    defeatPhase = 0; defeatTimer = 0; defeatExplosions = []; defeatSignY = -260;
    SOUNDS.gameOver();
  }

  function updateEnemies() {
    if (gameState === 'DEFEAT' || (victoryPhase >= 1 && victoryPhase < 3)) {
      /* inimigos fogem depois que o boss cai */
      if (victoryPhase >= 1 && victoryPhase < 3) {
        for (let i = enemies.length - 1; i >= 0; i--) {
          const e = enemies[i];
          e.dir = e.x < player.x ? -1 : 1;
          e.x += e.dir * Math.min(8, 3 + victoryPhase);
          if (e.x < -60 || e.x > LEVEL_WIDTH + 60) enemies.splice(i, 1);
        }
      }
      return;
    }
    enemiesData.forEach((data) => {
      if (!data.alive) {
        data.respawnTimer--;
        if (data.respawnTimer <= 0) {
          data.alive = true;
          enemies.push({ ...data, x: data.spawnX, w: EW, h: EH, frame: 0, timer: 0, shootCooldown: 0, detectionRange: 200, shootRange: 250, velY: 0, stompCount: 0 });
          SOUNDS.respawn();
        }
      }
    });
    const playerInSafe = player.x > SAFE_MIN && player.x < SAFE_MAX;
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      e.velY = (e.velY || 0) + 0.55; e.y += e.velY;
      let onPlatform = false;
      platforms.forEach((p) => {
        if (e.x + e.w > p.x && e.x < p.x + p.w && e.y + e.h > p.y && e.y + e.h < p.y + p.h * 0.6 && e.velY >= 0) {
          e.velY = 0; e.y = p.y - e.h; onPlatform = true;
        }
      });
      if (e.y > ABYSS_Y) {
        const data = enemiesData.find((d) => d.id === e.id);
        if (data) { data.alive = false; data.respawnTimer = 300; }
        enemies.splice(i, 1); continue;
      }
      e.x += e.speed * e.dir;
      /* zona segura: nenhum monstro entra na rampa/passagem */
      if (e.x + e.w > SAFE_MIN && e.x < SAFE_MAX) {
        if (e.dir > 0) { e.x = SAFE_MIN - e.w; e.dir = -1; }
        else { e.x = SAFE_MAX; e.dir = 1; }
      }
      const frontX = e.dir === 1 ? e.x + e.w + 2 : e.x - 2;
      let groundAhead = false;
      platforms.forEach((p) => {
        if (frontX > p.x && frontX < p.x + p.w && e.y + e.h + 10 > p.y && e.y + e.h < p.y + 20) groundAhead = true;
      });
      if (onPlatform && !groundAhead) e.dir *= -1;
      if (e.x <= 0 || e.x >= LEVEL_WIDTH - e.w) e.dir *= -1;
      e.shootCooldown--;
      const distX = Math.abs(player.x - e.x), distY = Math.abs(player.y - e.y);
      /* não atira no Bobby enquanto ele está na zona segura */
      if (!playerInSafe && distX < e.shootRange && distY < 80 && e.shootCooldown <= 0 && !gameOver && victoryPhase === 0) {
        bullets.push({ x: e.x + e.w / 2, y: e.y + e.h / 2, vx: (player.x > e.x ? 1 : -1) * 4, vy: 0, w: 12, h: 12 });
        e.shootCooldown = 90; SOUNDS.shoot();
      }
      if (!playerInSafe && distX < e.detectionRange) {
        if (player.x < e.x && e.dir === 1) e.dir = -1;
        if (player.x > e.x && e.dir === -1) e.dir = 1;
      }
      if (!playerInSafe && player.velY > 0 && !player.invulnerable && player.x + player.w - 8 > e.x + 4 && player.x + 8 < e.x + e.w - 4 && player.y + player.h > e.y && player.y + player.h < e.y + e.h * 0.5) {
        e.stompCount = (e.stompCount || 0) + 1;
        player.velY = -8; SOUNDS.stomp(); SOUNDS.punch();
        spawnParticles(e.x + e.w / 2, e.y, ['#ff6666', '#fff'], 8);
        if (e.stompCount >= 2) {
          const data = enemiesData.find((d) => d.id === e.id);
          if (data) { data.alive = false; data.respawnTimer = 300; }
          enemies.splice(i, 1); score += 25;
          spawnParticles(e.x + e.w / 2, e.y + e.h / 2, ['#e74c3c', '#fff', '#ffd700'], 20);
        }
      }
    }
  }

  function updateBoss() {
    if (!boss.active || boss.defeated) return;
    boss.patternTimer++;
    if (boss.patternTimer > 180) { boss.pattern = (boss.pattern + 1) % 3; boss.patternTimer = 0; }
    switch (boss.pattern) {
      case 0:
        boss.x += boss.speed * boss.dir;
        boss.y = boss.baseY + Math.sin(frameCount * 0.03) * 40;
        if (boss.x <= CHAMBER_X0 + 10 || boss.x >= CHAMBER_X1 - boss.w - 30) boss.dir *= -1;
        boss.shootCooldown--;
        if (boss.shootCooldown <= 0) {
          bullets.push({ x: boss.x + boss.w / 2, y: boss.y + boss.h, vx: 0, vy: 4, w: 12, h: 12 });
          boss.shootCooldown = 40; SOUNDS.shoot();
        }
        break;
      case 1: {
        const tX = player.x - boss.x, tY = player.y - boss.y;
        boss.x += Math.sign(tX) * 3; boss.y += Math.sign(tY) * 2;
        boss.shootCooldown--;
        if (boss.shootCooldown <= 0) {
          for (let a = -1; a <= 1; a++) bullets.push({ x: boss.x + boss.w / 2, y: boss.y + boss.h, vx: a * 3, vy: 4, w: 12, h: 12 });
          boss.shootCooldown = 50; SOUNDS.shoot();
        }
        break;
      }
      case 2:
        boss.x += boss.speed * boss.dir * 0.5;
        boss.y = boss.baseY + Math.sin(frameCount * 0.05) * 60;
        if (boss.x <= CHAMBER_X0 + 10 || boss.x >= CHAMBER_X1 - boss.w - 30) boss.dir *= -1;
        boss.shootCooldown--;
        if (boss.shootCooldown <= 0) {
          for (let i2 = 0; i2 < 5; i2++) {
            const angle = Math.PI * 0.3 + Math.PI * 0.4 * (i2 / 4);
            bullets.push({ x: boss.x + boss.w / 2, y: boss.y + boss.h, vx: Math.cos(angle) * 3, vy: Math.sin(angle) * 3, w: 12, h: 12 });
          }
          boss.shootCooldown = 35; SOUNDS.shoot();
        }
        break;
    }
    boss.x = Math.max(CHAMBER_X0 + 10, Math.min(CHAMBER_X1 - boss.w - 26, boss.x));
    boss.y = Math.max(95, Math.min(250, boss.y));
    boss.lastX = boss.x; boss.lastY = boss.y;
    if (!player.invulnerable && !player.hasShield && player.x + player.w > boss.x && player.x < boss.x + boss.w && player.y + player.h > boss.y && player.y < boss.y + boss.h) takeDamage();
  }

  function damageBoss(dmg: number, hx: number, hy: number, isSuper: boolean) {
    if (!boss.active || boss.defeated) return;
    boss.hp -= dmg; boss.hitsReceived++;
    if (isSuper) SOUNDS.superShot(); else SOUNDS.bossHit();
    spawnParticles(hx, hy, ['#d64541', '#ffd700', '#fff'], 10 + dmg * 3);
    if (boss.hitsReceived === 3 && !superAmmo.spawned) {
      superAmmo.spawned = true;
      let sx = player.x + (Math.random() > 0.5 ? 110 : -110);
      if (sx < CHAMBER_X0 + 20) sx = player.x + 110;
      superAmmo.x = Math.min(CHAMBER_X1 - 60, sx);
      superAmmo.y = 300;
      SOUNDS.superAmmo();
    }
    if (boss.hp <= 0) {
      boss.defeated = true;
      boss.deathT = 0; boss.fallVelY = 0;
      score += 500;
      victoryPhase = 1; cutsceneTimer = 0;
      bullets = []; playerBullets = [];
      SOUNDS.explosion();
    }
  }

  function updateBullets() {
    if (gameState === 'DEFEAT' || victoryPhase >= 1) return;
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.vx; b.y += b.vy;
      if (!player.invulnerable && !player.hasShield && player.x < b.x + b.w && player.x + player.w > b.x && player.y < b.y + b.h && player.y + player.h > b.y) {
        takeDamage(); bullets.splice(i, 1);
        spawnParticles(b.x, b.y, ['#ff0000', '#ff6666', '#fff'], 15); continue;
      }
      if (player.hasShield && player.x < b.x + b.w && player.x + player.w > b.x && player.y < b.y + b.h && player.y + player.h > b.y) {
        player.hasShield = false; player.shieldTimer = 0;
        bullets.splice(i, 1);
        spawnParticles(b.x, b.y, ['#0088ff', '#00aaff', '#fff'], 10); SOUNDS.shield(); continue;
      }
      if (b.x < -20 || b.x > LEVEL_WIDTH + 20 || b.y > 500 || b.y < -20) bullets.splice(i, 1);
    }
    for (let i = playerBullets.length - 1; i >= 0; i--) {
      const b = playerBullets[i];
      b.x += b.vx;
      let consumed = false;
      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        if (e.x < b.x + b.w && e.x + e.w > b.x && e.y < b.y + b.h && e.y + e.h > b.y) {
          SOUNDS.bulletHit(); SOUNDS.punch();
          const data = enemiesData.find((d) => d.id === e.id);
          if (data) { data.alive = false; data.respawnTimer = 300; }
          enemies.splice(j, 1); playerBullets.splice(i, 1); score += 25; consumed = true;
          spawnParticles(e.x + e.w / 2, e.y + e.h / 2, ['#e74c3c', '#fff', '#ffd700'], 20);
          break;
        }
      }
      if (consumed) continue;
      if (!boss.defeated && boss.active && boss.x < b.x + b.w && boss.x + boss.w > b.x && boss.y < b.y + b.h && boss.y + boss.h > b.y) {
        damageBoss(b.damage || 1, b.x, b.y, b.isSuper);
        playerBullets.splice(i, 1); continue;
      }
      if (b.x < -20 || b.x > LEVEL_WIDTH + 20) playerBullets.splice(i, 1);
    }
  }

  function takeDamage() {
    if (player.invulnerable || gameOver || victoryPhase > 0) return;
    if (player.hasShield) {
      player.hasShield = false; player.shieldTimer = 0;
      SOUNDS.shield();
      spawnParticles(player.x + player.w / 2, player.y + player.h / 2, ['#0088ff', '#fff'], 15);
      return;
    }
    player.lives--; SOUNDS.hit();
    screenShake = Math.max(screenShake, 5);
    if (player.lives <= 0) triggerDefeat();
    else { player.invulnerable = true; player.invulnerableTimer = 90; }
  }

  function checkCollections() {
    if (victoryPhase >= 3) return;
    coins.forEach((c) => {
      if (c.collected) return;
      if (player.x < c.x + c.w && player.x + player.w > c.x && player.y < c.y + c.h && player.y + player.h > c.y) {
        c.collected = true; score += c.points;
        if (c.type === 'coin') {
          SOUNDS.coin();
          spawnParticles(c.x + c.w / 2, c.y + c.h / 2, ['#ffd700', '#fff', '#ffa500'], 12);
          coinsCollected++;
          if (coinsCollected % 10 === 0) grantBomb();
        } else {
          SOUNDS.star();
          spawnParticles(c.x + c.w / 2, c.y + c.h / 2, ['#ffd700', '#ff8800', '#fff'], 25);
          starsCollected++;
          if (starsCollected % 3 === 0) grantBomb();
        }
      }
    });
    const collectHeart = (item: { x: number; y: number; w: number; h: number; collected: boolean }) => {
      if (!item.collected && player.x < item.x + item.w && player.x + player.w > item.x && player.y < item.y + item.h && player.y + player.h > item.y) {
        item.collected = true;
        player.lives = Math.min(player.maxLives, player.lives + 1);
        SOUNDS.heal();
        spawnParticles(item.x + item.w / 2, item.y + item.h / 2, ['#ff0066', '#ff3388', '#fff'], 30);
      }
    };
    collectHeart(healthItem);
    collectHeart(chamberHeart);
    if (!shieldItem.collected && player.x < shieldItem.x + shieldItem.w && player.x + player.w > shieldItem.x && player.y < shieldItem.y + shieldItem.h && player.y + player.h > shieldItem.y) {
      shieldItem.collected = true; player.hasShield = true; player.shieldTimer = 900;
      SOUNDS.shield();
      spawnParticles(shieldItem.x + shieldItem.w / 2, shieldItem.y + shieldItem.h / 2, ['#0088ff', '#00aaff', '#fff'], 20);
    }
    if (superAmmo.spawned && !superAmmo.collected && player.x < superAmmo.x + superAmmo.w && player.x + player.w > superAmmo.x && player.y < superAmmo.y + superAmmo.h && player.y + player.h > superAmmo.y) {
      superAmmo.collected = true; player.hasSuperAmmo = true; player.superShots = 2;
      SOUNDS.superAmmo();
      spawnParticles(superAmmo.x + 18, superAmmo.y + 18, ['#00ffff', '#fff', '#ffff00'], 30);
    }
    if (!player.invulnerable && !player.hasShield) {
      enemies.forEach((e) => {
        if (player.x + 6 < e.x + e.w - 6 && player.x + player.w - 6 > e.x + 6 && player.y + player.h > e.y + e.h * 0.5 && player.y + 6 < e.y + e.h && player.velY <= 0) takeDamage();
      });
    }
    if (goldenKey.active && !goldenKey.collected) {
      const kx = goldenKey.x, ky = goldenKey.y;
      if (player.x + player.w > kx && player.x < kx + goldenKey.w && player.y + player.h > ky && player.y < ky + goldenKey.h) {
        goldenKey.collected = true;
        SOUNDS.keyGet();
        spawnParticles(kx + 20, ky + 20, ['#ffd700', '#fff', '#fff8a0'], 40);
        victoryPhase = 3; cutsceneTimer = 0; keyFlyT = -1;
        player.shooting = false;
      }
    }
  }

  /* ---------- cutscene do MARCOS / mina ---------- */
  function throwRock(r: Robo) {
    rocks.push({ x: r.x + 30, y: robotY(r) + 6, vx: 5 + Math.random() * 2, vy: -6 - Math.random() * 2 });
    SOUNDS.rock();
  }

  function updateD3() {
    if (!d3Active) {
      if (d3Glow > 0) d3Glow--;
      return;
    }
    d3T++; d3PhaseT++;
    d3Battery = Math.min(100, (d3T / 430) * 100);
    if (d3T % 14 === 0 && d3Phase < 4) SOUNDS.charge();
    for (let i = rocks.length - 1; i >= 0; i--) {
      const rk = rocks[i];
      rk.x += rk.vx; rk.y += rk.vy; rk.vy += 0.3;
      if (rk.x > 2560 || rk.y > 420) rocks.splice(i, 1);
    }
    const alive = robozinhos.filter((r) => !r.fallen);
    const dead = robozinhos.length - alive.length;

    if (d3Phase === 0) {
      robozinhos.forEach((r, idx) => {
        if (!r.fallen && (d3T + idx * 13) % 45 === 0) throwRock(r);
        if (r.agitated > 0) r.agitated--;
      });
      csBoss.y = 150 + Math.sin(frameCount * 0.06) * 14;
      if (d3T % 22 === 0 && alive.length > 1) {
        const t = alive[Math.floor(Math.random() * alive.length)];
        t.agitated = 30; t.hp--;
        SOUNDS.shoot();
        if (t.hp <= 0) {
          t.fallen = true; SOUNDS.robotDown();
          spawnParticles(t.x + 18, robotY(t) + 16, ['#00cc66', '#fff', '#666'], 14);
        }
      }
      if (dead >= 3 || d3T > 420) {
        const surv = robozinhos.find((r) => !r.fallen);
        if (surv) surv.running = true;
        d3Phase = 1; d3PhaseT = 0;
      }
    } else if (d3Phase === 1) {
      const s = robozinhos.find((r) => r.running && !r.fallen);
      if (s) {
        if (!s.crying) {
          s.x += 2.5;
          if (s.x >= 2415) { s.x = 2415; s.crying = true; d3PhaseT = 0; }
        } else if (d3PhaseT > 75) {
          d3Phase = 2; d3PhaseT = 0;
        }
      }
    } else if (d3Phase === 2) {
      csBoss.x += (2470 - csBoss.x) * 0.08;
      csBoss.y += (210 - csBoss.y) * 0.08;
      if (d3PhaseT === 1) SOUNDS.laugh();
      if (d3PhaseT > 55) {
        missile = { x: csBoss.x + 20, y: csBoss.y + 40, vx: 1.2, vy: 2 };
        SOUNDS.missile();
        d3Phase = 3; d3PhaseT = 0;
      }
    } else if (d3Phase === 3) {
      if (missile) {
        missile.x += missile.vx; missile.y += missile.vy; missile.vy += 0.22;
        if (missile.y >= 315) {
          const surv = robozinhos.find((r) => r.crying);
          if (surv) surv.fallen = true;
          SOUNDS.explosion(); SOUNDS.robotDown();
          screenShake = Math.max(screenShake, 9);
          spawnParticles(MINE_X + 55, 320, ['#ff8800', '#ffcc00', '#5a4a5e', '#333'], 30);
          missile = null;
          d3Phase = 4; d3PhaseT = 0;
        }
      }
    } else if (d3Phase === 4) {
      if (d3PhaseT === 1) {
        d3Done = true;
        SOUNDS.collapse();
        screenShake = Math.max(screenShake, 12);
        spawnParticles(MINE_X + 55, 300, ['#5a4a5e', '#8a6a4a', '#ff8800', '#333'], 40);
      }
      if (d3PhaseT > 45) {
        d3Active = false; d3Battery = 100; d3Glow = 480;
        SOUNDS.chargeFull();
        rocks = [];
      }
    }
  }

  function updateCamera() {
    if (d3Active) {
      const vw = canvas.width;
      let target: number;
      if (d3T < 60) target = player.x - vw / 3;
      else target = MINE_X - vw * 0.45;
      target = Math.max(0, Math.min(LEVEL_WIDTH - vw, target));
      camera.x += (target - camera.x) * 0.06;
      return;
    }
    if (victoryPhase > 2) {
      if (victoryPhase >= 3 && victoryPhase <= 7) {
        const targetCamX = Math.max(0, Math.min(LEVEL_WIDTH - canvas.width, player.x - canvas.width / 3));
        camera.x += (targetCamX - camera.x) * 0.05;
      }
      return;
    }
    const tx = player.x - canvas.width / 3;
    camera.x += (tx - camera.x) * 0.1;
    camera.x = Math.max(0, Math.min(LEVEL_WIDTH - canvas.width, camera.x));
  }

  /* ---------- cutscene de vitória (morte do boss → portão → chave) ---------- */
  function updateVictoryCutscene() {
    cutsceneTimer++;
    if (victoryPhase === 1) {
      /* boss em chamas caminha até o portão e explode */
      boss.deathT++;
      if (boss.x < 3290) boss.x += 2;
      boss.fallVelY += 0.5; boss.y += boss.fallVelY;
      if (boss.y > 350 - BH) boss.y = 350 - BH;
      if (boss.x >= 3285 && boss.y >= 350 - BH && boss.deathT > 20) {
        boss.hidden = true;
        gateDestroyed = true;
        SOUNDS.explosion(); SOUNDS.collapse();
        screenShake = Math.max(screenShake, 14);
        spawnParticles(GATE_X + 14, 300, ['#ff8800', '#ffcc00', '#555', '#333'], 40);
        spawnParticles(boss.x + boss.w / 2, boss.y, ['#ff4400', '#ffd700', '#d64541'], 40);
        scorchMarks.push({ x: GATE_X - 30, y: 350, w: 90 });
        goldenKey.x = 3280; goldenKey.y = 280; goldenKey.active = true;
        victoryPhase = 2; cutsceneTimer = 0;
        SOUNDS.keyGet();
      }
    } else if (victoryPhase === 2) {
      if (!goldenKey.collected && cutsceneTimer > 900 && keyFlyT < 0) {
        keyFlyT = 0;
        SOUNDS.keyGet();
      }
      if (keyFlyT >= 0) {
        keyFlyT++;
        if (keyFlyT >= 60) {
          goldenKey.collected = true;
          victoryPhase = 3; cutsceneTimer = 0; keyFlyT = -1;
          player.shooting = false;
        }
      }
    } else if (victoryPhase === 3) {
      player.dir = 1; player.x += 3;
      player.velY += player.gravity; player.y += player.velY; player.onGround = false;
      platforms.forEach((p) => {
        if (player.x + player.w > p.x && player.x < p.x + p.w && player.y + player.h > p.y && player.y + player.h < p.y + p.h * 0.6 && player.velY >= 0) {
          player.velY = 0; player.y = p.y - player.h; player.onGround = true;
        }
      });
      if (player.x >= ANTENNA_X - 20) {
        player.x = ANTENNA_X - 20;
        victoryPhase = 4; cutsceneTimer = 0; SOUNDS.signal();
      }
    } else if (victoryPhase === 4) {
      if (cutsceneTimer > 150) { victoryPhase = 5; cutsceneTimer = 0; SOUNDS.rocket(); rocketY = -200; }
    } else if (victoryPhase === 5) {
      rocketY += 2.5;
      if (rocketY >= 245) { rocketY = 245; victoryPhase = 6; cutsceneTimer = 0; }
    } else if (victoryPhase === 6) {
      player.dir = -1;
      if (player.x > ROCKET_LAND_X + 10) player.x -= 2;
      else {
        player.dir = 1; playerEnteredRocket = true;
        victoryPhase = 7; cutsceneTimer = 0; SOUNDS.rocket();
      }
    } else if (victoryPhase === 7) {
      if (cutsceneTimer > 40) {
        rocketTakingOff = true;
        rocketY -= 4 + cutsceneTimer * 0.03;
        screenShake = Math.min(8, cutsceneTimer * 0.05);
        if (rocketY < -250) {
          victoryPhase = 8; cutsceneTimer = 0; screenShake = 0;
          SOUNDS.victory();
        }
      }
    }
  }

  function updateTimer() {
    const now = Date.now();
    const d = (now - lastTime) / 1000;
    lastTime = now;
    if (!gameOver && victoryPhase === 0 && !d3Active) {
      timeLeft -= d;
      if (timeLeft <= 0) { timeLeft = 0; triggerDefeat(); }
    }
  }

  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }
  function drawParticles() {
    particles.forEach((p) => {
      ctx.globalAlpha = p.life / 40;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - camera.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    });
    ctx.globalAlpha = 1;
  }
  function updateSmoke() {
    for (let i = smokeParticles.length - 1; i >= 0; i--) {
      const s = smokeParticles[i];
      s.y += s.vy; s.x += s.vx; s.alpha -= 0.012; s.size += 0.15;
      if (s.alpha <= 0) smokeParticles.splice(i, 1);
    }
  }
  function drawSmoke() {
    smokeParticles.forEach((s) => {
      ctx.globalAlpha = Math.max(0, s.alpha * 0.5);
      ctx.fillStyle = '#c8c8c8';
      ctx.beginPath(); ctx.arc(s.x - camera.x, s.y, s.size, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  /* =====================================================
   *  FLUXO — start / restart / input
   * ===================================================== */
  function startGame() {
    gameState = 'GAME';
    lastTime = Date.now();
    music.setZone('aventura');
  }

  function restartGame() {
    player = freshPlayer();
    coins = freshCoins();
    platforms = freshPlatforms();
    buildLevelLayer();
    healthItem.collected = false;
    chamberHeart.collected = false;
    shieldItem.collected = false;
    superAmmo = { x: 0, y: 0, w: 36, h: 36, spawned: false, collected: false };
    enemiesData.forEach((d) => { d.alive = true; d.respawnTimer = 0; });
    enemies = []; enemiesInitialized = false;
    boss = freshBoss();
    bullets = []; playerBullets = []; particles = []; smokeParticles = [];
    bombProjs = []; scorchMarks = [];
    bombs = 1; coinsCollected = 0; starsCollected = 0; bombNotice = 0;
    robozinhos = freshRobos(); rocks = []; missile = null;
    d3Active = false; d3Done = false; mineSealed = false;
    d3T = 0; d3PhaseT = 0; d3Phase = 0; d3Battery = 0; d3Glow = 0;
    csBoss.x = 2490; csBoss.y = 150;
    score = 0; timeLeft = GAME_TIME; gameOver = false;
    camera.x = 0; screenShake = 0;
    hasSteppedOnMarcos = false; sunriseProgress = 0;
    victoryPhase = 0; cutsceneTimer = 0; rocketY = -200;
    playerEnteredRocket = false; rocketTakingOff = false;
    gateDestroyed = false;
    goldenKey = { x: 0, y: 0, w: 40, h: 40, active: false, collected: false, bobT: 0 };
    keyFlyT = -1; bossBurnTimer = 0;
    defeatPhase = 0; defeatTimer = 0; defeatExplosions = []; defeatSignY = -260;
    liBtn.active = false;
    gameState = 'GAME';
    lastTime = Date.now();
    music.setZone('aventura');
  }

  function onKeyDown(e: KeyboardEvent) {
    resumeAudio();
    if (!keys[e.key]) {
      keys[e.key] = true;
      if (gameState === 'INTRO') {
        if (e.key === 'Enter' && !introSkipped && !introComplete) { introSkipped = true; introComplete = true; }
        else if ((e.key === ' ' || e.key === 'Enter') && (introComplete || introSkipped)) startGame();
      }
      if (gameState === 'GAME' && !gameOver && victoryPhase <= 2) {
        if (e.key === 'ArrowUp') doJump();
        if (e.key === ' ') player.shooting = true;
        if (e.key === 'b' || e.key === 'B' || e.key === 'x' || e.key === 'X') throwBomb();
      }
      if (gameState === 'DEFEAT' && defeatPhase >= 4 && e.key === ' ') restartGame();
      if (gameState === 'GAME' && victoryPhase >= 8 && (e.key === ' ' || e.key === 'Enter')) restartGame();
    }
    e.preventDefault();
  }
  function onKeyUp(e: KeyboardEvent) {
    keys[e.key] = false;
    if (e.key === ' ') player.shooting = false;
  }

  function onCanvasClick(e: MouseEvent) {
    resumeAudio();
    if (gameState === 'INTRO') {
      if (!introComplete && !introSkipped) { introSkipped = true; introComplete = true; }
      else startGame();
      return;
    }
    if (gameState === 'DEFEAT' && defeatPhase >= 4) {
      const pt = toCanvasPoint(e.clientX, e.clientY);
      if (hitLinkedinButton(pt.x, pt.y)) window.open(LINKEDIN_URL, '_blank');
      else restartGame();
      return;
    }
    if (gameState === 'GAME' && victoryPhase >= 8) {
      const pt = toCanvasPoint(e.clientX, e.clientY);
      if (hitLinkedinButton(pt.x, pt.y)) window.open(LINKEDIN_URL, '_blank');
      else restartGame();
      return;
    }
  }

  function onCanvasTouchStart(e: TouchEvent) {
    lastTouchAt = Date.now();
    resumeAudio();
    if (gameState === 'INTRO') {
      if (!introComplete && !introSkipped) { introSkipped = true; introComplete = true; }
      else startGame();
    } else if (gameState === 'DEFEAT' && defeatPhase >= 4) {
      const t = e.changedTouches[0];
      if (t) {
        const pt = toCanvasPoint(t.clientX, t.clientY);
        if (hitLinkedinButton(pt.x, pt.y)) window.open(LINKEDIN_URL, '_blank');
        else restartGame();
      }
    } else if (gameState === 'GAME' && victoryPhase >= 8) {
      const t = e.changedTouches[0];
      if (t) {
        const pt = toCanvasPoint(t.clientX, t.clientY);
        if (hitLinkedinButton(pt.x, pt.y)) window.open(LINKEDIN_URL, '_blank');
        else restartGame();
      }
    }
  }

  function onTouchStart(e: TouchEvent) {
    resumeAudio();
    if (gameState !== 'GAME' || gameOver || victoryPhase > 2) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.clientX < window.innerWidth * 0.55) {
        if (joy.id === -1) {
          joy.id = t.identifier; joy.active = true;
          joy.baseX = 95; joy.baseY = overlay.height - 115;
          let tdx = t.clientX - joy.baseX, tdy = t.clientY - joy.baseY;
          const tlen = Math.hypot(tdx, tdy);
          if (tlen > JOY_R) { tdx = (tdx / tlen) * JOY_R; tdy = (tdy / tlen) * JOY_R; }
          joy.x = joy.baseX + tdx; joy.y = joy.baseY + tdy;
          joy.jumpHeld = false;
        }
      } else {
        const bb = bombBtnPos();
        if (Math.hypot(t.clientX - bb.x, t.clientY - bb.y) <= bb.r + 18) throwBomb();
        else if (fire.id === -1) { fire.id = t.identifier; fire.active = true; player.shooting = true; }
      }
    }
  }
  function onTouchMove(e: TouchEvent) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === joy.id && joy.active) {
        let dx = t.clientX - joy.baseX, dy = t.clientY - joy.baseY;
        const len = Math.hypot(dx, dy);
        if (len > JOY_R) { dx = (dx / len) * JOY_R; dy = (dy / len) * JOY_R; }
        joy.x = joy.baseX + dx; joy.y = joy.baseY + dy;
        const nx = Math.abs(dx) < DEAD_ZONE ? 0 : dx / JOY_R;
        keys['ArrowLeft'] = dx <= -DEAD_ZONE;
        keys['ArrowRight'] = dx >= DEAD_ZONE;
        if (dx <= -DEAD_ZONE) player.dir = -1;
        else if (dx >= DEAD_ZONE) player.dir = 1;
        keys['ArrowDown'] = dy >= JUMP_ZONE;
        if (dy <= -JUMP_ZONE) {
          if (!joy.jumpHeld) { doJump(); joy.jumpHeld = true; }
        } else joy.jumpHeld = false;
        void nx;
      }
    }
  }
  function onTouchEnd(e: TouchEvent) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === joy.id) {
        joy.id = -1; joy.active = false;
        keys['ArrowLeft'] = false; keys['ArrowRight'] = false; keys['ArrowDown'] = false;
      }
      if (t.identifier === fire.id) { fire.id = -1; fire.active = false; player.shooting = false; }
    }
  }
  function onContextMenu(e: Event) { e.preventDefault(); }

  /* =====================================================
   *  GAME LOOP
   * ===================================================== */
  let raf = 0;
  function gameLoop() {
    frameCount++;
    if (screenShake > 0) screenShake = Math.max(0, screenShake - 0.5);
    ctx.save();
    if (screenShake > 0) ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);

    if (gameState === 'LOADING') {
      drawLoadingScreen();
    } else if (gameState === 'INTRO') {
      drawIntroScreen();
    } else if (gameState === 'DEFEAT') {
      drawBackground();
      drawPlatforms();
      drawSmoke(); drawParticles();
      drawCollectibles(); drawEnemies(); drawBoss();
      drawDefeatWorld();
      updateDefeat();
      updateParticles(); updateSmoke();
      ctx.restore();
      drawDefeatScreen();
      drawWatermark();
      drawTouchControls();
      raf = requestAnimationFrame(gameLoop);
      return;
    } else {
      drawBackground();
      drawMineChamberBack();
      drawPlatforms();
      drawMineChamberFront();
      drawDeadSoldiers();
      drawScorchMarks();
      drawMine();
      drawFortressGate();
      drawSecretBase();
      drawRobots();
      drawRocks();
      updateSmoke(); drawSmoke();
      updateParticles(); drawParticles();
      drawCollectibles();
      drawGoldenKey();
      drawBullets();
      drawBombProjs();
      drawEnemies();
      drawBoss();
      drawCutsceneBattle();
      drawPlayer();
      drawD3Fx();

      updateD3();
      if (victoryPhase >= 1 && victoryPhase < 8) updateVictoryCutscene();
      if (victoryPhase >= 1) drawVictoryCutscene();
      if (victoryPhase >= 8) drawVictoryScreen();

      drawHUD();
      if (!gameOver && victoryPhase <= 2) {
        updatePlayer();
        updateEnemies();
        updateBoss();
        updateBullets();
        updateBombs();
        checkCollections();
        updateCamera();
        updateTimer();
      }
      if (!enemiesInitialized) {
        enemiesInitialized = true;
        enemiesData.forEach((d) => {
          if (d.alive) enemies.push({ ...d, x: d.spawnX, w: EW, h: EH, frame: 0, timer: 0, shootCooldown: 0, detectionRange: 200, shootRange: 250, velY: 0, stompCount: 0 });
        });
      }
    }

    drawWatermark();
    ctx.restore();
    drawTouchControls();
    raf = requestAnimationFrame(gameLoop);
  }

  /* ---------- bootstrap ---------- */
  resizeOverlay();
  buildLevelLayer();
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
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
