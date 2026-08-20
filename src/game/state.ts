/* =====================================================
 *  BOBBY IA — STATE (fonte única de verdade)
 *  O.S. 002 FRAGMENTAÇÃO — movido de engine.ts,
 *  comportamento 100% idêntico.
 *
 *  Aqui vivem: constantes, tipos, o objeto G (estado
 *  mutável), factories, reset e as mecânicas puras +
 *  utilidades compartilhadas (glow, partículas, fumaça).
 * ===================================================== */
import { generateTextBlocks, type TextBlock, type Palette } from './sprites';
import { SOUNDS } from './audio';

export const LINKEDIN_URL = 'https://www.linkedin.com/in/sir-marcos-eduardo/';

/* ---------- constantes de mundo ---------- */
export const PIXEL = 3;
export const PW = 12 * PIXEL, PH = 16 * PIXEL, PH_CROUCH = 10 * PIXEL;
export const EW = 12 * PIXEL, EH = 11 * PIXEL;
export const CW = 8 * PIXEL, CH = 8 * PIXEL;
export const SW = 12 * PIXEL, SH = 12 * PIXEL;
export const BW = 24 * PIXEL, BH = 20 * PIXEL;
export const LEVEL_WIDTH = 4100;
export const GAME_TIME = 240;
export const HUD_HEIGHT = 60;
export const ABYSS_Y = 500;

export const MINE_X = 2440, MINE_W = 110, MINE_TOP = 40;      // parede da mina
export const CHAMBER_X0 = 2560, CHAMBER_X1 = 3400;            // câmara (arena do boss)
export const GATE_X = 3372, GATE_W = 28;                      // portão da fortaleza
export const BASE_X = 3400;
export const ANTENNA_X = 3620;
export const ROCKET_LAND_X = 3560;
export const SAFE_MIN = 2120, SAFE_MAX = 2580;                // zona sem monstros

export const JOY_R = 46, DEAD_ZONE = 12, JUMP_ZONE = 25;

export const PAL_MECHA: Palette = ['#d64541', '#8e2323', '#ffffff', '#ffd700', '#3a3a44'];
export const PAL_ROBO: Palette = ['#00cc66', '#003311', '#aaffcc', '#00ff88', '#004422'];
export const PAL_ROBO_GRAY: Palette = ['#666', '#333', '#999', '#888', '#222'];

export const INTRO_FULL_TEXT =
  'Ola, eu sou Bobby IA, um sistema semantico criado pelo Marcao. Quando usado, eu consigo ser um instrumento para ele. Consigo produzir qualquer tipo de projeto que o Marcao orquestra. Hiperfocado e perfeccionista, ele me guia, debugando linha por linha, iteracao atras da outra, ate finalizar com excelencia seu objetivo. Esse jogo foi produzido e lapidado em 2h30 de varias e varias iteracoes.';

/* detecção de touch (só mobile de verdade) */
export const isTouch =
  typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

/* ---------- tipos ---------- */
export interface Rect { x: number; y: number; w: number; h: number }
export interface Coin extends Rect { collected: boolean; type: 'coin' | 'star'; points: number }
export interface EnemySpawn { id: number; spawnX: number; y: number; speed: number; dir: number; alive: boolean; respawnTimer: number }
export interface Enemy extends Rect { id: number; spawnX: number; speed: number; dir: number; frame: number; timer: number; shootCooldown: number; detectionRange: number; shootRange: number; velY: number; stompCount: number }
export interface EnemyBullet extends Rect { vx: number; vy: number }
export interface PlayerBullet extends Rect { vx: number; isSuper: boolean; damage: number }
export interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number }
export interface Smoke { x: number; y: number; size: number; alpha: number; vy: number; vx: number }
export interface BombProj { x: number; y: number; vx: number; vy: number }
export interface Scorch { x: number; y: number; w: number }
export interface Robo { x: number; hp: number; fallen: boolean; agitated: number; running: boolean; crying: boolean }
export interface Rock { x: number; y: number; vx: number; vy: number }
export interface DefeatExplosion { x: number; y: number; size: number; life: number }

export interface PlayerState {
  x: number; y: number; w: number; h: number; speed: number; velY: number; gravity: number; jumpPower: number;
  jumping: boolean; moving: boolean; crouching: boolean; shooting: boolean; dir: number;
  lives: number; maxLives: number; invulnerable: boolean; invulnerableTimer: number; hasGun: boolean;
  shootCooldown: number; onGround: boolean; hasShield: boolean; shieldTimer: number;
  hasSuperAmmo: boolean; superShots: number; healedByName: boolean;
}
export interface BossState {
  x: number; y: number; w: number; h: number; speed: number; dir: number; frame: number; timer: number;
  hp: number; maxHp: number; hitsReceived: number; shootCooldown: number; active: boolean; defeated: boolean;
  pattern: number; patternTimer: number; baseY: number; lastX: number; lastY: number;
  deathT: number; hidden: boolean; fallVelY: number;
  stunned: number;                                    // ⬅️ NOVO — frames restantes atordoado (bomba)
}
export interface GoldenKeyState { x: number; y: number; w: number; h: number; active: boolean; collected: boolean; bobT: number }

export interface GameState {
  gameState: 'LOADING' | 'INTRO' | 'GAME' | 'DEFEAT';
  loadProgress: number;
  introCharIndex: number; introTimer: number; introComplete: boolean; introSkipped: boolean;
  bobbyRunFrame: number;
  frameCount: number; lastTime: number; screenShake: number;
  score: number; timeLeft: number; gameOver: boolean;
  hasSteppedOnMarcos: boolean; sunriseProgress: number;
  player: PlayerState;
  platforms: Rect[];
  coins: Coin[];
  healthItem: Rect & { collected: boolean };
  chamberHeart: Rect & { collected: boolean };
  shieldItem: Rect & { collected: boolean };
  superAmmo: Rect & { spawned: boolean; collected: boolean };
  enemiesData: EnemySpawn[];
  enemies: Enemy[];
  enemiesInitialized: boolean;
  bullets: EnemyBullet[];
  playerBullets: PlayerBullet[];
  particles: Particle[];
  smokeParticles: Smoke[];
  bombProjs: BombProj[];
  scorchMarks: Scorch[];
  bombs: number; coinsCollected: number; starsCollected: number; bombNotice: number;
  boss: BossState;
  d3Active: boolean; d3Done: boolean; mineSealed: boolean;
  d3T: number; d3PhaseT: number; d3Phase: number; d3Battery: number; d3Glow: number;
  csBoss: { x: number; y: number };
  missile: { x: number; y: number; vx: number; vy: number } | null;
  robozinhos: Robo[];
  rocks: Rock[];
  victoryPhase: number; cutsceneTimer: number; rocketY: number;
  playerEnteredRocket: boolean; rocketTakingOff: boolean;
  gateDestroyed: boolean;
  goldenKey: GoldenKeyState;
  keyFlyT: number;
  bossBurnTimer: number;
  defeatPhase: number; defeatTimer: number; defeatSignY: number;
  defeatExplosions: DefeatExplosion[];
  keys: Record<string, boolean>;
  joy: { id: number; active: boolean; baseX: number; baseY: number; x: number; y: number; jumpHeld: boolean };
  fire: { id: number; active: boolean };
  lastTouchAt: number;
  liBtn: { x: number; y: number; w: number; h: number; active: boolean };
  camera: { x: number };
}

/* ---------- letreiros (sólidos — B.O 1) ---------- */
export const nameBlocks: TextBlock[] = generateTextBlocks('MARCOS', 1820, 250, 8);
export const titleBlocks: TextBlock[] = generateTextBlocks('PORTFOLIO', 1830, 310, 6);
export const nameBounds = { x: 1810, y: 240, w: 380, h: 50 };

/* ---------- factories ---------- */
export function freshPlayer(): PlayerState {
  return {
    x: 50, y: 280, w: PW, h: PH, speed: 4.5, velY: 0, gravity: 0.55, jumpPower: 13,
    jumping: false, moving: false, crouching: false, shooting: false, dir: 1,
    lives: 3, maxLives: 3, invulnerable: false, invulnerableTimer: 0, hasGun: true,
    shootCooldown: 0, onGround: false, hasShield: false, shieldTimer: 0,
    hasSuperAmmo: false, superShots: 0, healedByName: false,
  };
}
export function freshPlatforms(): Rect[] {
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
    { x: 1460, y: 350, w: 220, h: 100 },   // FIX — termina em 1680: buraco REAL (120px) antes do MARCOS
    { x: 1800, y: 350, w: 640, h: 100 },   // até a mina (2440)
    { x: 2440, y: 350, w: 110, h: 100 },   // piso da passagem
    { x: 2550, y: 350, w: 850, h: 100 },   // câmara da mina (2550-3400)
    { x: 2650, y: 250, w: 100, h: 20 },
    { x: 2900, y: 200, w: 100, h: 20 },
    { x: 3050, y: 270, w: 100, h: 20 },
    { x: 3400, y: 350, w: 700, h: 100 },   // base (agora sempre visível)
  ];
}
export function freshCoins(): Coin[] {
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
export function freshBoss(): BossState {
  return {
    x: 2900, y: 100, w: BW, h: BH, speed: 2, dir: -1, frame: 0, timer: 0,
    hp: 10, maxHp: 10, hitsReceived: 0, shootCooldown: 0, active: false, defeated: false,
    pattern: 0, patternTimer: 0, baseY: 100, lastX: 2900, lastY: 200,
      deathT: 0, hidden: false, fallVelY: 0,
      stunned: 0,                                        // ⬅️ NOVO
    };
}
export function freshRobos(): Robo[] {
  return [
    { x: 2230, hp: 3, fallen: false, agitated: 0, running: false, crying: false },
    { x: 2285, hp: 3, fallen: false, agitated: 0, running: false, crying: false },
    { x: 2340, hp: 3, fallen: false, agitated: 0, running: false, crying: false },
    { x: 2395, hp: 3, fallen: false, agitated: 0, running: false, crying: false },
  ];
}
export function freshEnemiesData(): EnemySpawn[] {
  return [
    { id: 1, spawnX: 310, y: 312, speed: 1.5, dir: 1, alive: true, respawnTimer: 0 },
    { id: 2, spawnX: 580, y: 312, speed: 1.2, dir: -1, alive: true, respawnTimer: 0 },
    { id: 3, spawnX: 1500, y: 312, speed: 1.8, dir: 1, alive: true, respawnTimer: 0 },
    { id: 4, spawnX: 1650, y: 312, speed: 1.4, dir: -1, alive: true, respawnTimer: 0 },
    { id: 5, spawnX: 2650, y: 312, speed: 2.0, dir: 1, alive: true, respawnTimer: 0 },
  ];
}

/* ---------- estado inicial / reset ---------- */
function initialState(): GameState {
  return {
    gameState: 'LOADING',
    loadProgress: 0,
    introCharIndex: 0, introTimer: 0, introComplete: false, introSkipped: false,
    bobbyRunFrame: 0,
    frameCount: 0, lastTime: Date.now(), screenShake: 0,
    score: 0, timeLeft: GAME_TIME, gameOver: false,
    hasSteppedOnMarcos: false, sunriseProgress: 0,
    player: freshPlayer(),
    platforms: freshPlatforms(),
    coins: freshCoins(),
    healthItem: { x: 1260, y: 155, w: 36, h: 36, collected: false },
    chamberHeart: { x: 3150, y: 250, w: 36, h: 36, collected: false },
    shieldItem: { x: 440, y: 180, w: 30, h: 30, collected: false },
    superAmmo: { x: 0, y: 0, w: 36, h: 36, spawned: false, collected: false },
    enemiesData: freshEnemiesData(),
    enemies: [], enemiesInitialized: false,
    bullets: [], playerBullets: [], particles: [], smokeParticles: [],
    bombProjs: [], scorchMarks: [],
    bombs: 1, coinsCollected: 0, starsCollected: 0, bombNotice: 0,
    boss: freshBoss(),
    d3Active: false, d3Done: false, mineSealed: false,
    d3T: 0, d3PhaseT: 0, d3Phase: 0, d3Battery: 0, d3Glow: 0,
    csBoss: { x: 2490, y: 150 },
    missile: null,
    robozinhos: freshRobos(),
    rocks: [],
    victoryPhase: 0, cutsceneTimer: 0, rocketY: -200,
    playerEnteredRocket: false, rocketTakingOff: false,
    gateDestroyed: false,
    goldenKey: { x: 0, y: 0, w: 40, h: 40, active: false, collected: false, bobT: 0 },
    keyFlyT: -1, bossBurnTimer: 0,
    defeatPhase: 0, defeatTimer: 0, defeatSignY: -260,
    defeatExplosions: [],
    keys: {},
    joy: { id: -1, active: false, baseX: 0, baseY: 0, x: 0, y: 0, jumpHeld: false },
    fire: { id: -1, active: false },
    lastTouchAt: 0,
    liBtn: { x: 0, y: 0, w: 0, h: 0, active: false },
    camera: { x: 0 },
  };
}

export const G: GameState = initialState();

/* restaura tudo pro estado de fábrica (o restartGame do engine chama isto) */
export function resetGame(): void {
  Object.assign(G, initialState());
}

/* ---------- caches de renderização (sobrevivem ao reset — de propósito) ---------- */
export const caches = {
  skyKey: '',
  skyGrad: null as CanvasGradient | null,
  hudGrad: null as CanvasGradient | null,
  levelLayer: null as HTMLCanvasElement | null,
};
export const glowCache = new Map<string, HTMLCanvasElement>();

/* =====================================================
 *  UTILIDADES COMPARTILHADAS
 * ===================================================== */
export function drawGlow(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, r: number): void {
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

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function spawnParticles(x: number, y: number, colors: string[], count = 10): void {
  if (G.particles.length + count > 160) count = Math.max(0, 160 - G.particles.length);
  for (let i = 0; i < count; i++)
    G.particles.push({ x, y, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 2) * 4, life: 40, color: colors[Math.floor(Math.random() * colors.length)], size: Math.random() * 3 + 2 });
}
export function spawnSmoke(x: number, y: number): void {
  if (G.smokeParticles.length >= 50) G.smokeParticles.shift();
  G.smokeParticles.push({ x: x + (Math.random() - 0.5) * 15, y, size: 3 + Math.random() * 4, alpha: 0.9, vy: -0.6 - Math.random() * 0.8, vx: (Math.random() - 0.5) * 0.3 });
}
export function updateParticles(): void {
  for (let i = G.particles.length - 1; i >= 0; i--) {
    const p = G.particles[i];
    p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life--;
    if (p.life <= 0) G.particles.splice(i, 1);
  }
}
export function drawParticles(ctx: CanvasRenderingContext2D): void {
  G.particles.forEach((p) => {
    ctx.globalAlpha = p.life / 40;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - G.camera.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  });
  ctx.globalAlpha = 1;
}
export function updateSmoke(): void {
  for (let i = G.smokeParticles.length - 1; i >= 0; i--) {
    const s = G.smokeParticles[i];
    s.y += s.vy; s.x += s.vx; s.alpha -= 0.012; s.size += 0.15;
    if (s.alpha <= 0) G.smokeParticles.splice(i, 1);
  }
}
export function drawSmoke(ctx: CanvasRenderingContext2D): void {
  G.smokeParticles.forEach((s) => {
    ctx.globalAlpha = Math.max(0, s.alpha * 0.5);
    ctx.fillStyle = '#c8c8c8';
    ctx.beginPath(); ctx.arc(s.x - G.camera.x, s.y, s.size, 0, Math.PI * 2); ctx.fill();
  });
  ctx.globalAlpha = 1;
}

/* =====================================================
 *  MECÂNICAS PURAS (só mexem em G + sons)
 * ===================================================== */
export function doJump(): void {
  if (G.gameState !== 'GAME' || G.gameOver || G.victoryPhase > 2 || G.d3Active) return;
  if (G.player.onGround && !G.player.crouching) {
    G.player.jumping = true; G.player.velY = -G.player.jumpPower; G.player.onGround = false;
    SOUNDS.jump();
  }
}

export function triggerDefeat(): void {
  G.gameOver = true; G.gameState = 'DEFEAT';
  G.defeatPhase = 0; G.defeatTimer = 0; G.defeatExplosions = []; G.defeatSignY = -260;
  SOUNDS.gameOver();
}

export function takeDamage(): void {
  if (G.player.invulnerable || G.gameOver || G.victoryPhase > 0) return;
  if (G.player.hasShield) {
    G.player.hasShield = false; G.player.shieldTimer = 0;
    SOUNDS.shield();
    spawnParticles(G.player.x + G.player.w / 2, G.player.y + G.player.h / 2, ['#0088ff', '#fff'], 15);
    return;
  }
  G.player.lives--; SOUNDS.hit();
  G.screenShake = Math.max(G.screenShake, 5);
  if (G.player.lives <= 0) triggerDefeat();
  else { G.player.invulnerable = true; G.player.invulnerableTimer = 90; }
}

/* pouso seguro (Bobby não morre mais depois que o boss cai) */
export function landSafe(): void {
  let best: Rect | null = null;
  let bestEdge = -1;
  G.platforms.forEach((p) => {
    if (G.player.x + G.player.w > p.x && G.player.x < p.x + p.w) { best = p; bestEdge = -2; }
    else if (bestEdge !== -2 && p.x + p.w <= G.player.x + G.player.w && p.x + p.w > bestEdge) { bestEdge = p.x + p.w; best = p; }
  });
  if (best !== null) {
    const bp: Rect = best;
    if (bestEdge >= 0) G.player.x = Math.min(G.player.x, bestEdge - G.player.w - 6);
    G.player.x = Math.max(0, G.player.x);
    G.player.y = bp.y - G.player.h;
  } else {
    G.player.x = 60; G.player.y = 350 - G.player.h;
  }
  G.player.velY = 0; G.player.onGround = true;
  G.player.invulnerable = true; G.player.invulnerableTimer = 60;
  SOUNDS.respawn();
}

export function grantBomb(): void {
  if (G.bombs < 3) {
    G.bombs++;
    G.bombNotice = 120;
    SOUNDS.bombGet();
  }
}

/* ---------- paredes da mina ---------- */
export function getWallRects(): Rect[] {
  if (G.mineSealed || !G.d3Done) return [{ x: MINE_X, y: MINE_TOP, w: MINE_W, h: 310 }];
  return [
    { x: MINE_X, y: MINE_TOP, w: 40, h: 220 },        // acima da entrada EM PÉ (260)
    { x: MINE_X + 40, y: MINE_TOP, w: 70, h: 245 },   // acima do trecho AGACHADO (305)
    { x: MINE_X + 40, y: 260, w: 30, h: 45 },         // teto baixo do agachar (305)
  ];
}
export function resolveWallCollision(): void {
  for (const w of getWallRects()) {
    if (G.player.x < w.x + w.w && G.player.x + G.player.w > w.x && G.player.y < w.y + w.h && G.player.y + G.player.h > w.y) {
      const fromLeft = G.player.x + G.player.w - w.x;
      const fromRight = w.x + w.w - G.player.x;
      if (fromLeft < fromRight) G.player.x = w.x - G.player.w;
      else G.player.x = w.x + w.w;
    }
  }
}
export function canStand(): boolean {
  const feet = G.player.y + G.player.h;
  const standTop = feet - PH;
  for (const w of getWallRects()) {
    if (G.player.x < w.x + w.w && G.player.x + G.player.w > w.x && standTop < w.y + w.h && feet > w.y) return false;
  }
  return true;
}

/* B.O 1 — letras (MARCOS/PORTFOLIO) sólidas também nas laterais */
export function resolveLetterCollision(): void {
  const solids = nameBlocks.concat(titleBlocks);
  for (const b of solids) {
    const overlapX = G.player.x < b.x + b.w && G.player.x + G.player.w > b.x;
    const overlapY = G.player.y < b.y + b.h && G.player.y + G.player.h > b.y;
    if (overlapX && overlapY && G.player.y + G.player.h > b.y + 10) {
      const fromLeft = G.player.x + G.player.w - b.x;
      const fromRight = b.x + b.w - G.player.x;
      if (fromLeft < fromRight) G.player.x = b.x - G.player.w;
      else G.player.x = b.x + b.w;
    }
  }
}

/* portão da fortaleza (bloqueia a saída até o boss morrer) */
export function resolveGateCollision(): void {
  if (G.gateDestroyed) return; // explode com o boss → passagem livre p/ a cutscene
  /* FIX A — a coluna INTEIRA é sólida enquanto o portão está fechado:
     antes só o portão (y 230–350) bloqueava, e Bobby PULAVA pelo vão
     invisível acima dele (y < 230) */
  const g = { x: GATE_X, y: 0, w: GATE_W, h: 350 };
  if (G.player.x < g.x + g.w && G.player.x + G.player.w > g.x && G.player.y < g.y + g.h && G.player.y + G.player.h > g.y) {
    G.player.x = g.x - G.player.w; // Bobby só pode vir da esquerda
  }
}
