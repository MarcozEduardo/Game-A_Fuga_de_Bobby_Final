// ═══════════════════════════════════════════════════════════════
//  A FUGA DE BOBBY — engine v3.0 "Covil do Socram"
//
//  NOVIDADES DESTA VERSÃO
//  • Viewport dinâmico (mobile 1:1 fullscreen) + escala de UI legível
//  • Duplo analógico: esquerdo move/pula, direito mira e atira (360°)
//  • Bombas: 2 foguetinhos vermelhos = 1 bomba (tecla B / botão)
//    → explode, mata inimigos e deixa o chão queimado (fogo residual)
//  • Covil do Socram: caverna, mina com roda giratória, correntes,
//    soldados caídos, plataformas, portão da fortaleza
//  • Cutscene narrativa ao pisar no nome MARCOS (módulo story.ts)
//  • Chefão com física de morte: cai, queima, caminha e explode o portão
//  • Chave com timer de 10s → voa até o Bobby
//  • Moedas: a cada 10 = +1 vida | Coração = +1 vida (4 no mapa)
//
//  BUGS CORRIGIDOS NESTA RODADA
//  ✅ baseY do chefão 100 → 150 (dava pra alcançar / pular na cabeça)
//  ✅ cair no abismo durante a vitória = pouso seguro (não quebra o final)
//  ✅ estrelas do céu determinísticas (cintilação senoidal, sem tremer)
//  ✅ aviso de abismo parou de piscar em vermelho
//  ✅ LAG: cache de gradientes, glows, sprites e chão pré-renderizado
//  ✅ LAG: áudio com teto de 10 vozes + throttle de 35ms
//  ✅ câmera filma TODA a cutscene final (não "trava" mais)
//  ✅ fumacinha do Bobby com 1 vida restaurada
//  ✅ stomp funciona mesmo levando dano (invulnerável ainda pisa)
//  ✅ balas do jogador continuam vivas durante a morte do chefão
// ═══════════════════════════════════════════════════════════════

import {
  BOBBY_FACE, BOBBY_RUN, BOBBY_KNEEL, HERO_FRAMES, HERO_FRAMES_DMG,
  ENEMY_FRAMES, MECHA, COIN_FRAMES, STAR_FRAMES, HEALTH_FRAMES,
  BULLET_FRAMES, PIXEL_LETTERS,
  PAL_BOBBY, PAL_HERO_3, PAL_HERO_2, PAL_HERO_1, PAL_ENEMY, PAL_COIN,
  PAL_STAR, PAL_HEALTH, PAL_MECHA, PAL_MECHA_RAGE, PAL_MECHA_BURN_A,
  PAL_MECHA_BURN_B, type Palette,
} from './sprites';
import { audio } from './audio';
import {
  StoryScene, MOUNTAIN_X0, MOUNTAIN_X1, MOUNTAIN_TOP,
  TUNNEL_X0, TUNNEL_X1, TUNNEL_TOP, MOUTH_X1, MOUTH_TOP,
} from './story';

export type GamePhase = 'LOADING' | 'INTRO' | 'GAME' | 'DEFEAT' | 'VICTORY';
export type EmitFn = (type: string, payload?: unknown) => void;
export type VirtualKey = 'left' | 'right' | 'jump' | 'down' | 'shoot' | 'bomb';

export interface ScoreEntry { name: string; score: number; flawless: boolean; date: string }

export function saveScore(name: string, score: number, flawless: boolean): ScoreEntry[] {
  let board: ScoreEntry[] = [];
  try {
    const raw = localStorage.getItem('bobby-board');
    if (raw) { const a = JSON.parse(raw); if (Array.isArray(a)) board = a; }
  } catch { /* noop */ }
  board.push({
    name: (name || 'ANÔNIMO').slice(0, 12).toUpperCase(),
    score, flawless,
    date: new Date().toLocaleDateString('pt-BR'),
  });
  board.sort((a, b) => b.score - a.score);
  board = board.slice(0, 10);
  try { localStorage.setItem('bobby-board', JSON.stringify(board)); } catch { /* noop */ }
  return board;
}

export function getBoard(): ScoreEntry[] {
  try {
    const raw = localStorage.getItem('bobby-board');
    if (!raw) return [];
    const a = JSON.parse(raw);
    return Array.isArray(a) ? a.slice(0, 10) : [];
  } catch { return []; }
}

export interface GameHandle {
  destroy(): void;
  input(key: VirtualKey, down: boolean): void;
  setAxis(side: 'move' | 'aim', x: number, y: number): void;
  primary(): void;
  togglePause(): void;
  toggleMute(): void;
  restart(toIntro: boolean): void;
  resize(cssW: number, cssH: number, mobile: boolean): void;
}

interface Rect { x: number; y: number; w: number; h: number }
type PlatKind = 'ground' | 'small' | 'wood' | 'cave' | 'ramp';
interface Platform extends Rect { kind: PlatKind }
interface Coin extends Rect { collected: boolean; type: 'coin' | 'star'; points: number }
interface Pickup extends Rect { collected: boolean }
interface EnemyData { id: number; spawnX: number; y: number; speed: number; dir: number; alive: boolean; respawnTimer: number }
interface Enemy extends Rect { id: number; speed: number; dir: number; frame: number; timer: number; shootCooldown: number; velY: number; stompCount: number }
interface Bullet extends Rect { vx: number; vy: number; isSuper?: boolean; damage?: number; range?: number }
interface Impact { x: number; y: number; t: number; big: boolean }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number }
interface Smoke { x: number; y: number; size: number; alpha: number; vy: number; vx: number }
interface FloatText { x: number; y: number; txt: string; life: number; color: string }
interface Explosion { x: number; y: number; size: number; life: number }
interface Bomb { x: number; y: number; vx: number; vy: number; fuse: number }
interface Scorch { x: number; y: number; w: number; t: number }

const H = 450;
const HUD_H = 60;
const PIXEL = 3;
const PW = 36, PH = 48, PH_CROUCH = 30;
const EW = 36, EH = 33;
const CW = 24, SW = 36;
const LEVEL_WIDTH = 4700;
const GAME_TIME = 300;
const ABYSS_Y = 520;
const STEP = 1000 / 60;
// 🎯 alcance dos tiros (em px) — obriga a chegar perto pra acertar
const SHOT_RANGE = 300;
const SUPER_RANGE = 460;
const ENEMY_SHOT_RANGE = 330;

// Covil / fortaleza — a MONTANHA é a entrada (túnel baixo, só agachado)
const CAVE_X0 = TUNNEL_X1, CAVE_X1 = 3620;
const GATE_X = 3560, GATE_W = 28;
const BOSS_MIN = 3020, BOSS_MAX = 3520;
const BASE_X = 3760;
const ANTENNA_X = BASE_X + 200;
const ROCKET_X = ANTENNA_X - 70;

// Fases da vitória
const VP_NONE = 0, VP_BOSS_DEATH = 1, VP_KEY = 2, VP_WALK_BASE = 3,
      VP_CONSOLE = 4, VP_SIGNAL = 5, VP_ROCKET_DOWN = 6, VP_BOARD = 7,
      VP_TAKEOFF = 8, VP_SCREEN = 9;

const INTRO_TEXT =
  'Olá, eu sou o Bobby IA, um sistema semântico criado pelo Marcão. Quando usado, eu consigo ser um instrumento para ele. ' +
  'Consigo produzir qualquer tipo de projeto que o Marcão orquestra. Hiperfocado e perfeccionista, ele me guia, debugando ' +
  'linha por linha, iteração atrás da outra, até finalizar com excelência. Agora Socram tomou a mina e está caçando os nossos. ' +
  'Chegou a hora da fuga.';

const GAME_CODES = new Set([
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'Enter',
  'KeyA', 'KeyD', 'KeyW', 'KeyS', 'KeyP', 'KeyM', 'KeyB',
]);

export function startBobbyGame(canvas: HTMLCanvasElement, emit: EmitFn): GameHandle {
  const _c = canvas.getContext('2d', { alpha: false });
  if (!_c) throw new Error('Canvas 2D não suportado');
  const ctx: CanvasRenderingContext2D = _c;

  let VW = 800;
  let uiScale = 1;
  let compact = false;

  // ═══════════ CACHES (anti-lag) ═══════════
  const gradCache = new Map<string, CanvasGradient>();
  const glowCache = new Map<string, HTMLCanvasElement>();
  const sprCache = new Map<string, HTMLCanvasElement>();
  const platCache = new Map<string, HTMLCanvasElement>();
  let caveBg: HTMLCanvasElement | null = null;
  let minaBg: HTMLCanvasElement | null = null;

  function clearCaches() {
    gradCache.clear();
    platCache.clear();
    caveBg = null;
    minaBg = null;
  }

  function linGrad(key: string, x0: number, y0: number, x1: number, y1: number, stops: [number, string][]) {
    let g = gradCache.get(key);
    if (!g) {
      g = ctx.createLinearGradient(x0, y0, x1, y1);
      stops.forEach(([o, c]) => g!.addColorStop(o, c));
      gradCache.set(key, g);
    }
    return g;
  }

  function glowSprite(color: string, radius: number) {
    const key = `${color}|${radius}`;
    let c = glowCache.get(key);
    if (!c) {
      c = document.createElement('canvas');
      c.width = c.height = radius * 2;
      const g = c.getContext('2d')!;
      const rg = g.createRadialGradient(radius, radius, 1, radius, radius, radius);
      rg.addColorStop(0, color);
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = rg;
      g.fillRect(0, 0, radius * 2, radius * 2);
      glowCache.set(key, c);
    }
    return c;
  }
  function drawGlow(color: string, radius: number, cx: number, cy: number) {
    ctx.drawImage(glowSprite(color, radius), cx - radius, cy - radius);
  }

  const idMap = new WeakMap<object, number>();
  let idSeq = 0;
  function idOf(o: object) {
    let v = idMap.get(o);
    if (v === undefined) { v = ++idSeq; idMap.set(o, v); }
    return v;
  }
  function spriteOf(frames: string[][], fi: number, pal: Palette, sc: number, flip: boolean) {
    const i = ((fi % frames.length) + frames.length) % frames.length;
    const key = `${idOf(frames)}:${i}:${sc}:${flip ? 1 : 0}:${pal.join('')}`;
    let c = sprCache.get(key);
    if (!c) {
      const frame = frames[i];
      c = document.createElement('canvas');
      c.width = frame[0].length * sc;
      c.height = frame.length * sc;
      const g = c.getContext('2d')!;
      const map: Record<string, string> = { R: pal[0], B: pal[1], W: pal[2], Y: pal[3], S: pal[4] };
      for (let r = 0; r < frame.length; r++)
        for (let col = 0; col < frame[r].length; col++) {
          const ch = frame[r][col];
          if (ch === '.') continue;
          g.fillStyle = map[ch] || '#fff';
          g.fillRect((flip ? frame[r].length - 1 - col : col) * sc, r * sc, sc, sc);
        }
      sprCache.set(key, c);
    }
    return c;
  }
  function drawPixelArt(frames: string[][], fi: number, pal: Palette, x: number, y: number, sc: number, flip: boolean) {
    ctx.drawImage(spriteOf(frames, fi, pal, sc, flip), Math.round(x), Math.round(y));
  }
  const KNEEL_FRAMES = [BOBBY_KNEEL];

  function fnt(px: number, bold = true) {
    return `${bold ? 'bold ' : ''}${Math.round(px * uiScale)}px "Courier New", monospace`;
  }

  // ═══════════ ESTADO ═══════════
  let phase: GamePhase = 'LOADING';
  let raf = 0;
  let destroyed = false;
  let paused = false;
  let frameCount = 0;
  let loadProgress = 0;

  let introCharIndex = 0;
  let introTimer = 0;
  let introComplete = false;
  let introSkipped = false;

  let victoryPhase = VP_NONE;
  let cutsceneTimer = 0;
  let rocketY = -240;
  let playerEnteredRocket = false;
  let rocketTakingOff = false;
  let screenShake = 0;
  let baseAlpha = 0;
  let gateDestroyed = false;
  let keyTimer = 0;
  let goldenKey = { x: 0, y: 0, w: 40, h: 40, active: false, collected: false, bobT: 0, flying: false };

  let defeatPhase = 0;
  let defeatTimer = 0;
  let defeatExplosions: Explosion[] = [];
  let defeatSignY = -200;
  let deathPos = { x: 100, y: 300 };

  let hasSteppedOnMarcos = false;
  let storyDelay = 0;
  let sunriseProgress = 0;

  const camera = { x: 0 };
  const keys: Record<string, boolean> = {};
  const vkeys = { left: false, right: false, jump: false, down: false, shoot: false, bomb: false };
  const axMove = { x: 0, y: 0 };
  const axAim = { x: 0, y: 0 };
  let jumpBuffer = 0;
  let coyote = 0;
  let bombLatch = false;

  const makePlayer = () => ({
    x: 50, y: 280, w: PW, h: PH, speed: 5, velY: 0, gravity: 0.55, jumpPower: 13.4,
    jumping: false, moving: false, crouching: false, shooting: false, dir: 1,
    lives: 3, maxLives: 4, invulnerable: false, invulnerableTimer: 0,
    shootCooldown: 0, onGround: false, hasShield: false, shieldTimer: 0,
    hasSuperAmmo: false, superShots: 0, healedByName: false,
    coinsCollected: 0, rockets: 0, bombs: 0, bombCooldown: 0, stompLock: 0,
    flawless: true,   // 🏆 nenhum dano sofrido na partida inteira
  });
  let player = makePlayer();

  const PLATFORMS: Platform[] = [
    { x: 0, y: 350, w: 750, h: 100, kind: 'ground' },
    { x: 240, y: 270, w: 130, h: 20, kind: 'wood' },
    { x: 440, y: 220, w: 130, h: 20, kind: 'wood' },
    { x: 620, y: 170, w: 130, h: 20, kind: 'wood' },
    { x: 930, y: 350, w: 80, h: 100, kind: 'ground' },
    { x: 1060, y: 300, w: 55, h: 15, kind: 'small' },
    { x: 1160, y: 250, w: 55, h: 15, kind: 'small' },
    { x: 1260, y: 200, w: 55, h: 15, kind: 'small' },
    { x: 1460, y: 350, w: 300, h: 100, kind: 'ground' },
    { x: 1560, y: 250, w: 110, h: 18, kind: 'wood' },
    { x: 1860, y: 350, w: 840, h: 100, kind: 'ground' },  // nome + rampa + base da montanha
    { x: 2440, y: 350, w: 1180, h: 100, kind: 'ground' },  // frente da masmorra + túnel + covil
    { x: 3060, y: 268, w: 96, h: 16, kind: 'cave' },
    { x: 3220, y: 214, w: 96, h: 16, kind: 'cave' },
    { x: 3360, y: 266, w: 96, h: 16, kind: 'cave' },
    { x: 3480, y: 206, w: 96, h: 16, kind: 'cave' },
    { x: 3620, y: 350, w: 1080, h: 100, kind: 'ground' },
  ];
  const ABYSSES: [number, number][] = [[750, 930], [1760, 1860]];

  // ── 🛝 RAMPA SEM VOLTA (logo depois do nome) ──
  const RAMP_X0 = 2300, RAMP_X1 = 2440, RAMP_TOP = 296;
  for (let i = 0; i < 14; i++) {
    const w = (RAMP_X1 - RAMP_X0) / 14;
    PLATFORMS.push({
      x: RAMP_X0 + i * w, y: 350 - ((i + 1) / 14) * (350 - RAMP_TOP),
      w: w + 1, h: 14, kind: 'ramp',
    });
  }
  PLATFORMS.push({ x: RAMP_X1, y: RAMP_TOP, w: 70, h: 14, kind: 'ramp' });
  let rampSealed = false;

  // ── 🧱 PAREDES: montanha lacrada → buraco (entra EM PÉ, segue AGACHADO) ──
  // 🪨 PLATAFORMA RACHADA — a última do abismo: treme → racha → cai → renasce
  const CRUMBLE = { x: 1360, y: 250, w: 55, h: 15, baseY: 250, state: 0, t: 0, vy: 0 };
  // state: 0=parada, 1=tremendo, 2=rachando, 3=caindo, 4=renascendo

  let tunnelCollapsed = false;
  function wallsNow(): Rect[] {
    const out: Rect[] = [];
    if (!story.holeOpen) {
      out.push({ x: TUNNEL_X0, y: 0, w: TUNNEL_X1 - TUNNEL_X0, h: 350 });
    } else {
      // boca alta: dá pra entrar em pé
      out.push({ x: TUNNEL_X0, y: 0, w: MOUTH_X1 - TUNNEL_X0, h: MOUTH_TOP });
      // fundo baixo: só agachado
      out.push({ x: MOUTH_X1, y: 0, w: TUNNEL_X1 - MOUTH_X1, h: TUNNEL_TOP });
      if (tunnelCollapsed) out.push({ x: TUNNEL_X0 - 20, y: 0, w: 46, h: 350 });
    }
    if (rampSealed) out.push({ x: RAMP_X0 - 34, y: 0, w: 40, h: 350 });
    return out;
  }

  function generateTextBlocks(text: string, startX: number, startY: number, size: number): Rect[] {
    const blocks: Rect[] = [];
    let cx = startX;
    for (const ch of text) {
      const letter = PIXEL_LETTERS[ch];
      if (!letter) { cx += size * 4; continue; }
      for (let r = 0; r < letter.length; r++)
        for (let c = 0; c < letter[r].length; c++)
          if (letter[r][c] === 'X') blocks.push({ x: cx + c * size, y: startY + r * size, w: size, h: size });
      cx += (letter[0].length + 1) * size;
    }
    return blocks;
  }
  const nameBlocks = generateTextBlocks('MARCOS', 1900, 250, 8);
  const titleBlocks = generateTextBlocks('PORTFOLIO', 1905, 310, 6);
  const nameBounds = { x: 1890, y: 240, w: 300, h: 52 };

  // ── coletáveis ─────────────────────────────────────────────
  // ⚖️ BALANCEAMENTO: poucas moedas de chão e todas em lugar arriscado.
  // O grosso das moedas vem de MATAR OS MONSTRINHOS (eles dropam).
  const COIN_POS: [number, number][] = [
    [300, 232], [345, 232],        // sobre plataforma
    [498, 182], [536, 182],        // plataforma alta
    [678, 132],                    // topo arriscado
    [1075, 258], [1175, 208], [1275, 158], [1375, 208],  // pulos sobre o abismo
    [1600, 206],
    [2350, 268], [2408, 244],      // subindo a rampa
    [3065, 224], [3225, 170], [3365, 222], [3485, 162],  // dentro do covil
  ];
  const STAR_POS: [number, number, number][] = [
    [660, 128, 50], [1275, 118, 75], [2470, 240, 75], [3540, 138, 100],
  ];
  // 💗 só 2 corações no mapa inteiro — dá pra morrer fácil
  const HEART_POS: [number, number][] = [[1275, 60], [3225, 118]];
  // 🎆 foguetinho vermelho (2 = 1 bomba) — 4 no mapa = 2 bombas
  const ROCKET_POS: [number, number][] = [[512, 138], [1700, 200], [2410, 196], [3365, 172]];

  let coins: Coin[] = [];
  let hearts: Pickup[] = [];
  let rockets: Pickup[] = [];
  let shieldItem: Pickup = { x: 440, y: 178, w: 30, h: 30, collected: false };
  let superAmmo = { x: 0, y: 0, w: 36, h: 36, spawned: false, collected: false };

  function buildCollectibles() {
    coins = [
      ...COIN_POS.map(([x, y]) => ({ x, y, w: CW, h: CW, collected: false, type: 'coin' as const, points: 10 })),
      ...STAR_POS.map(([x, y, p]) => ({ x, y, w: SW, h: SW, collected: false, type: 'star' as const, points: p })),
    ];
    hearts = HEART_POS.map(([x, y]) => ({ x, y, w: 36, h: 36, collected: false }));
    rockets = ROCKET_POS.map(([x, y]) => ({ x, y, w: 30, h: 34, collected: false }));
    shieldItem = { x: 440, y: 178, w: 30, h: 30, collected: false };
    superAmmo = { x: 0, y: 0, w: 36, h: 36, spawned: false, collected: false };
  }

  const ENEMY_SEED: [number, number, number, number][] = [
    [1, 310, 1.5, 1], [2, 580, 1.2, -1], [3, 1500, 1.8, 1], [4, 1660, 1.4, -1],
    [5, 1920, 1.6, 1], [6, 2120, 1.5, -1], [7, 2360, 1.9, 1], [8, 2640, 2.0, 1],
    [9, 2820, 1.7, -1], [10, 3320, 2.1, 1],
  ];
  const enemiesData: EnemyData[] = ENEMY_SEED.map(([id, spawnX, speed, dir]) => ({
    id, spawnX, y: 312, speed, dir, alive: true, respawnTimer: 0,
  }));
  let enemies: Enemy[] = [];
  let bullets: Bullet[] = [];
  let playerBullets: Bullet[] = [];
  let bombs: Bomb[] = [];
  let scorches: Scorch[] = [];
  let particles: Particle[] = [];
  let smokeParticles: Smoke[] = [];
  let floatTexts: FloatText[] = [];
  // 🪙 moedas que saltam do inimigo morto
  interface CoinDrop { x: number; y: number; vx: number; vy: number; spin: number; rest: number }
  let coinDrops: CoinDrop[] = [];
  // 🎯 marcas de tiro na parede
  let impacts: Impact[] = [];

  function addImpact(x: number, y: number, big = false) {
    impacts.push({ x, y, t: 0, big });
    if (impacts.length > 70) impacts.shift();
  }
  function updateImpacts() {
    for (let i = impacts.length - 1; i >= 0; i--) {
      impacts[i].t++;
      if (impacts[i].t > 260) impacts.splice(i, 1);
    }
  }
  function drawImpacts() {
    for (const m of impacts) {
      const sx = m.x - camera.x;
      if (sx < -20 || sx > VW + 20) continue;
      const k = m.t / 260;
      // faísca inicial
      if (m.t < 10) {
        ctx.fillStyle = `rgba(255,240,180,${(1 - m.t / 10).toFixed(2)})`;
        ctx.beginPath(); ctx.arc(sx, m.y, (m.big ? 9 : 6) * (1 - m.t / 14), 0, Math.PI * 2); ctx.fill();
      }
      // furo que permanece
      ctx.globalAlpha = Math.max(0, 0.75 - k * 0.75);
      ctx.fillStyle = '#1a1410';
      const r = m.big ? 4 : 2.5;
      ctx.fillRect(sx - r, m.y - r, r * 2, r * 2);
      ctx.fillStyle = '#5b4c3e';
      ctx.fillRect(sx - r - 1, m.y - 1, 2, 2);
      ctx.fillRect(sx + r - 1, m.y - 1, 2, 2);
      ctx.globalAlpha = 1;
    }
  }

  function updateCoinDrops() {
    for (let i = coinDrops.length - 1; i >= 0; i--) {
      const c = coinDrops[i];
      if (c.rest < 240) {
        c.vy += 0.5;
        c.x += c.vx;
        c.y += c.vy;
        c.spin += 0.28;
        const gy = groundYAt(c.x + CW / 2) - CW;
        if (c.y >= gy) {
          c.y = gy;
          if (Math.abs(c.vy) > 1.6) { c.vy *= -0.42; c.vx *= 0.7; audio.uiMove(); }
          else { c.vy = 0; c.vx *= 0.8; c.rest++; }
        }
      } else c.rest++;
      // ímã suave quando o Bobby chega perto
      const dx = player.x + player.w / 2 - (c.x + CW / 2);
      const dy = player.y + player.h / 2 - (c.y + CW / 2);
      const d = Math.hypot(dx, dy);
      if (d < 70) { c.x += dx * 0.14; c.y += dy * 0.14; }
      if (d < 26) {
        coinDrops.splice(i, 1);
        score += 10;
        player.coinsCollected++;
        audio.coin();
        spawnParticles(c.x + CW / 2, c.y + CW / 2, ['#ffd700', '#fff', '#ffa500'], 12);
        if (player.coinsCollected % 10 === 0) gainLife('10 MOEDAS = +1 VIDA');
        else addFloatText(c.x + CW / 2, c.y, '+10', '#ffd700');
        continue;
      }
      if (c.rest > 900) coinDrops.splice(i, 1);
    }
  }

  function drawCoinDrops() {
    for (const c of coinDrops) {
      const sx = c.x - camera.x;
      if (sx < -40 || sx > VW + 40) continue;
      const fade = c.rest > 780 && Math.floor(frameCount / 5) % 2 === 0 ? 0.35 : 1;
      ctx.globalAlpha = fade;
      drawGlow('rgba(255,215,0,0.45)', 26, sx + CW / 2, c.y + CW / 2);
      // giro 3D fake usando os 4 frames da moeda
      const fi = Math.floor(c.spin) % 4;
      drawPixelArt(COIN_FRAMES, fi, PAL_COIN, sx, c.y, PIXEL, false);
      ctx.globalAlpha = 1;
    }
  }

  const makeBoss = () => ({
    x: 3200, y: 150, w: 60, h: 54, speed: 2.2, dir: -1, frame: 0, timer: 0,
    hp: 30, maxHp: 30, hitsReceived: 0, shootCooldown: 0, active: false,
    defeated: false, pattern: 0, patternTimer: 0, baseY: 150,
    burnT: 0, fallVel: 0, grounded: false, hidden: false, hurtFlash: 0,
    stagger: 0,
  });
  let boss = makeBoss();

  let score = 0;
  let timeLeft = GAME_TIME;
  let lastSafe = { x: 50, y: 350 };
  let highScore = 0;
  try { highScore = parseInt(localStorage.getItem('bobby-hiscore') || '0', 10) || 0; } catch { /* noop */ }

  // Estrelas determinísticas (fix do piscar)
  const starField = Array.from({ length: 90 }, (_, i) => ({
    x: (i * 149) % LEVEL_WIDTH,
    y: 70 + ((i * 37) % 210),
    s: i % 9 === 0 ? 2 : 1.5,
    ph: (i * 0.7) % (Math.PI * 2),
  }));

  // ═══════════ STORY ═══════════
  const story = new StoryScene({
    ctx,
    getVW: () => VW,
    H,
    getCam: () => camera.x,
    uiScale: () => uiScale,
    drawFrames: (f, i, p, x, y, sc, flip) => drawPixelArt(f, i, p as Palette, x, y, sc, flip),
    smoke: (x, y) => spawnSmoke(x, y),
    burst: (x, y, c, n, pw) => spawnParticles(x, y, c, n, pw ?? 1),
    shake: (v) => { screenShake = Math.max(screenShake, v); },
    boom: (x, y, s) => boom(x, y, s),
  });
  story.onFinish = () => {
    // o Boss só é liberado DEPOIS que o laranja morre
    boss.active = true;
    audio.bossRoar();
    addFloatText(player.x + PW / 2, player.y - 16, 'AGACHE PRA PASSAR!', '#ff8c1a');
  };

  // ═══════════ PARTÍCULAS ═══════════
  function spawnSmoke(x: number, y: number) {
    if (smokeParticles.length > 90) return;
    smokeParticles.push({ x: x + (Math.random() - 0.5) * 15, y, size: 3 + Math.random() * 4, alpha: 0.9, vy: -0.6 - Math.random() * 0.8, vx: (Math.random() - 0.5) * 0.3 });
  }
  function updateSmoke() {
    for (let i = smokeParticles.length - 1; i >= 0; i--) {
      const s = smokeParticles[i];
      s.y += s.vy; s.x += s.vx; s.alpha -= 0.012; s.size += 0.15;
      if (s.alpha <= 0) smokeParticles.splice(i, 1);
    }
  }
  function drawSmoke() {
    if (!smokeParticles.length) return;
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 1.5;
    smokeParticles.forEach((s) => {
      const sx = s.x - camera.x;
      if (sx < -20 || sx > VW + 20) return;
      ctx.globalAlpha = s.alpha;
      ctx.beginPath(); ctx.arc(sx, s.y, s.size, 0, Math.PI * 2); ctx.stroke();
    });
    ctx.globalAlpha = 1;
  }
  function spawnParticles(x: number, y: number, colors: string[], count = 10, power = 1) {
    if (particles.length > 420) return;
    for (let i = 0; i < count; i++)
      particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 6 * power,
        vy: (Math.random() - 2) * 4 * power,
        life: 40, max: 40,
        color: colors[(Math.random() * colors.length) | 0],
        size: Math.random() * 3 + 2,
      });
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
      const sx = p.x - camera.x;
      if (sx < -20 || sx > VW + 20) return;
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.fillRect(sx - p.size / 2, p.y - p.size / 2, p.size, p.size);
    });
    ctx.globalAlpha = 1;
  }
  // ═══ 💥 EXPLOSÕES DE VERDADE ═══
  // anel de choque + bola de fogo em camadas + estilhaços + clarão
  interface Boom { x: number; y: number; t: number; max: number; s: number }
  let booms: Boom[] = [];
  let flashT = 0;

  function boom(x: number, y: number, s = 1) {
    booms.push({ x, y, t: 0, max: Math.round(34 * (0.6 + s * 0.5)), s });
    flashT = Math.max(flashT, 6 * s);
    // estilhaços quentes
    for (let i = 0; i < 14 * s; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = (3 + Math.random() * 7) * s;
      particles.push({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2,
        life: 34, max: 34,
        color: ['#fff3b0', '#ffd24a', '#ff8a1f', '#ff4b1f'][(Math.random() * 4) | 0],
        size: 2 + Math.random() * 3.5 * s,
      });
    }
    for (let i = 0; i < 5 * s; i++) spawnSmoke(x + (Math.random() - 0.5) * 34 * s, y);
  }

  function updateBooms() {
    if (flashT > 0) flashT--;
    for (let i = booms.length - 1; i >= 0; i--) {
      booms[i].t++;
      if (booms[i].t > booms[i].max) booms.splice(i, 1);
    }
  }

  function drawBooms() {
    for (const b of booms) {
      const k = b.t / b.max;
      const sx = b.x - camera.x;
      if (sx < -140 || sx > VW + 140) continue;
      const R = 58 * b.s;
      // anel de choque
      if (k < 0.55) {
        ctx.strokeStyle = `rgba(255,255,255,${(0.75 * (1 - k / 0.55)).toFixed(2)})`;
        ctx.lineWidth = 3 * (1 - k);
        ctx.beginPath();
        ctx.arc(sx, b.y, R * (0.35 + k * 1.7), 0, Math.PI * 2);
        ctx.stroke();
      }
      // bola de fogo em camadas
      const layers: [number, string][] = [
        [1.0, 'rgba(180,40,10,'], [0.78, 'rgba(255,110,20,'],
        [0.52, 'rgba(255,190,50,'], [0.26, 'rgba(255,248,200,'],
      ];
      for (const [f, col] of layers) {
        const rad = R * f * (0.35 + k * 0.9);
        const a = Math.max(0, (1 - k) * (0.55 + f * 0.4));
        ctx.fillStyle = `${col}${a.toFixed(2)})`;
        ctx.beginPath();
        // formato irregular (pixel-fire)
        for (let s = 0; s < 10; s++) {
          const ang = (s / 10) * Math.PI * 2;
          const wob = 1 + Math.sin(s * 2.3 + b.t * 0.4) * 0.16;
          const px = sx + Math.cos(ang) * rad * wob;
          const py = b.y + Math.sin(ang) * rad * wob * 0.86;
          if (s === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  function addFloatText(x: number, y: number, txt: string, color: string) {
    floatTexts.push({ x, y, txt, life: 60, color });
  }
  function updateFloatTexts() {
    for (let i = floatTexts.length - 1; i >= 0; i--) {
      const f = floatTexts[i];
      f.y -= 0.8; f.life--;
      if (f.life <= 0) floatTexts.splice(i, 1);
    }
  }
  function drawFloatTexts() {
    if (!floatTexts.length) return;
    ctx.textAlign = 'center';
    ctx.font = fnt(13);
    floatTexts.forEach((f) => {
      ctx.globalAlpha = Math.min(1, f.life / 30);
      ctx.fillStyle = f.color;
      ctx.fillText(f.txt, f.x - camera.x, f.y);
    });
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }

  // ═══════════ INPUT ═══════════
  function queueJump() { jumpBuffer = 8; audio.unlock(); }
  function handleConfirmPress() {
    audio.unlock();
    // 🎬 pular a cutscene exige 8 toques (evita cortar sem querer)
    if (story.active) { story.requestSkip(); return; }
    if (phase === 'INTRO') {
      if (!introComplete && !introSkipped) { introSkipped = true; introComplete = true; }
      else startGame();
    } else if (phase === 'DEFEAT' && defeatPhase >= 4) restartGame(false);
    else if (phase === 'VICTORY') restartGame(false);
  }
  function onKeyDown(e: KeyboardEvent) {
    // ⌨️ se o foco está num campo de texto (ex.: nome no placar),
    // o jogo NÃO captura a tecla — senão é impossível digitar.
    const el = e.target as HTMLElement | null;
    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
    if (GAME_CODES.has(e.code)) e.preventDefault();
    audio.unlock();
    if (keys[e.code]) return;
    keys[e.code] = true;
    if (e.code === 'KeyM') { toggleMute(); return; }
    if (e.code === 'KeyP' && phase === 'GAME' && (victoryPhase === VP_NONE || paused)) { togglePause(); return; }
    if (paused) return;
    if (e.code === 'Enter' || e.code === 'Space') handleConfirmPress();
    if (phase === 'GAME' && !story.active && victoryPhase <= VP_KEY) {
      // ↑ / W = PULAR   |   ESPAÇO = SÓ ATIRAR
      if (e.code === 'ArrowUp' || e.code === 'KeyW') queueJump();
      if (e.code === 'Space') player.shooting = true;
      if (e.code === 'KeyB') throwBomb();
    }
  }
  function onKeyUp(e: KeyboardEvent) {
    const el = e.target as HTMLElement | null;
    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
    keys[e.code] = false;
    if (e.code === 'Space') player.shooting = false;
  }
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  // ═══════════ FLUXO ═══════════
  function startGame() { phase = 'GAME'; emit('state', phase); }

  function spawnEnemy(d: EnemyData): Enemy {
    return {
      id: d.id, x: d.spawnX, y: d.y, w: EW, h: EH, speed: d.speed, dir: d.dir,
      frame: 0, timer: (d.id * 7) % 14, shootCooldown: 60 + d.id * 15, velY: 0, stompCount: 0,
    };
  }

  function restartGame(toIntro: boolean) {
    player = makePlayer();
    buildCollectibles();
    enemiesData.forEach((d) => { d.alive = true; d.respawnTimer = 0; });
    enemies = enemiesData.map(spawnEnemy);
    boss = makeBoss();
    bullets = []; playerBullets = []; bombs = []; scorches = [];
    particles = []; smokeParticles = []; floatTexts = [];
    score = 0; timeLeft = GAME_TIME;
    camera.x = 0;
    hasSteppedOnMarcos = false; sunriseProgress = 0;
    defeatPhase = 0; defeatTimer = 0; defeatExplosions = []; defeatSignY = -200;
    victoryPhase = VP_NONE; cutsceneTimer = 0; rocketY = -240;
    playerEnteredRocket = false; rocketTakingOff = false; screenShake = 0;
    baseAlpha = 0; gateDestroyed = false; keyTimer = 0;
    goldenKey = { x: 0, y: 0, w: 40, h: 40, active: false, collected: false, bobT: 0, flying: false };
    lastSafe = { x: 50, y: 350 };
    jumpBuffer = 0; coyote = 0;
    paused = false;
    storyDelay = 0;
    tunnelCollapsed = false;
    rampSealed = false;
    enemiesFleeing = false;
    coinDrops = []; booms = []; flashT = 0; impacts = [];
    CRUMBLE.state = 0; CRUMBLE.y = CRUMBLE.baseY; CRUMBLE.vy = 0; CRUMBLE.t = 0;
    story.active = false; story.finished = false; story.holeOpen = false; story.corpses = [];
    emit('paused', false);
    if (toIntro) {
      phase = 'INTRO';
      introCharIndex = 0; introTimer = 0; introComplete = false; introSkipped = false;
    } else phase = 'GAME';
    emit('state', phase);
  }

  function endOfRun(win: boolean) {
    // 🏆 passou sem levar UM dano sequer → troféu + 1000 pontos
    const flawless = win && player.flawless;
    if (flawless) {
      score += 1000;
      audio.lifeUp();
    }
    if (score > highScore) {
      highScore = score;
      try { localStorage.setItem('bobby-hiscore', String(highScore)); } catch { /* noop */ }
    }
    // pode registrar o nome se GANHOU e fez mais de 1200 pontos
    emit('end', {
      win, score, high: highScore, flawless,
      canRegister: win && score > 1200,
      board: loadBoard(),
    });
  }

  // ═══ 🏅 PLACAR PERSISTENTE ═══
  function loadBoard(): ScoreEntry[] {
    try {
      const raw = localStorage.getItem('bobby-board');
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr.slice(0, 10) : [];
    } catch { return []; }
  }

  // ═══════════ FÍSICA / HELPERS ═══════════
  function groundUnder(px: number, py: number, pw: number, ph: number, velY: number): Platform | null {
    for (const p of PLATFORMS) {
      if (px + pw > p.x && px < p.x + p.w && py + ph > p.y && py + ph < p.y + p.h * 0.6 && velY >= 0) return p;
    }
    return null;
  }
  function groundYAt(x: number): number {
    let best = 350;
    for (const p of PLATFORMS) if (x > p.x && x < p.x + p.w && p.y >= 200) best = Math.min(best, p.y);
    return best;
  }
  function nearestSolid(x: number): Platform {
    let best = PLATFORMS[0];
    let bd = Infinity;
    for (const p of PLATFORMS) {
      if (p.h < 100) continue;
      const cx = Math.max(p.x + 20, Math.min(p.x + p.w - 20, x));
      const d = Math.abs(cx - x);
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  }

  function throwBomb() {
    if (player.bombs <= 0 || player.bombCooldown > 0 || victoryPhase > VP_KEY) return;
    player.bombs--;
    player.bombCooldown = 30;
    bombs.push({ x: player.x + player.w / 2, y: player.y + 10, vx: player.dir * 6.5, vy: -7, fuse: 150 });
    audio.throwBomb();
  }

  function explodeBomb(x: number, y: number) {
    audio.bomb();
    audio.explosion();
    screenShake = Math.max(screenShake, 16);
    boom(x, y, 1.75);
    spawnParticles(x, y, ['#ff4400', '#ffaa00', '#ffff66', '#fff', '#666'], 46, 1.9);
    const gy = groundYAt(x);
    scorches.push({ x: x - 46, y: gy, w: 92, t: 460 });
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (Math.hypot(e.x + e.w / 2 - x, e.y + e.h / 2 - y) < 92) {
        killEnemy(i, 40);
      }
    }
    if (boss.active && !boss.defeated && Math.hypot(boss.x + boss.w / 2 - x, boss.y + boss.h / 2 - y) < 130) {
      damageBoss(10, boss.x + boss.w / 2, boss.y + 14); // 3 bombas = 30
      boss.stagger = Math.max(boss.stagger, 50);
    }
  }

  function killEnemy(index: number, points: number) {
    const e = enemies[index];
    const d = enemiesData.find((x) => x.id === e.id);
    if (d) { d.alive = false; d.respawnTimer = 420; }
    enemies.splice(index, 1);
    score += points;
    addFloatText(e.x + e.w / 2, e.y, `+${points}`, '#ffd700');
    // 💥 morte com explosão rápida (estilo da do Bobby, só que ligeira)
    boom(e.x + e.w / 2, e.y + e.h / 2, 0.62);
    spawnParticles(e.x + e.w / 2, e.y + e.h / 2, ['#e74c3c', '#c0392b', '#fff'], 22, 1.2);
    // 🪙 a moeda SALTA com estilo e cai no chão — o Bobby tem que buscar
    dropCoin(e.x + e.w / 2 - CW / 2, e.y + 4);
  }

  function dropCoin(x: number, y: number) {
    coinDrops.push({ x, y, vx: (Math.random() - 0.5) * 3.4, vy: -7.5 - Math.random() * 2, spin: 0, rest: 0 });
    audio.uiMove();
  }

  // 🎯 VIDA CALIBRADA: 6 tiros comuns | 3 de bazuca | 3 bombas | 10 pulos.
  // Dano fixo por arma (sem blindagem aleatória): normal=5, super=10,
  // bomba=10, pulo=3 → 30 de vida. O visor e os propulsores continuam
  // só como marcação visual de onde mirar.
  function damageBoss(dmg: number, fx: number, fy: number) {
    if (boss.defeated) return;
    boss.hp -= dmg;
    boss.hitsReceived++;
    boss.hurtFlash = 10;
    audio.bossHit();
    screenShake = Math.max(screenShake, 4);
    spawnParticles(fx, fy, ['#d64541', '#ffaa00', '#fff'], 8 + Math.min(28, dmg * 3));
    if (boss.hitsReceived === 3 && !superAmmo.spawned) {
      superAmmo.spawned = true;
      superAmmo.x = Math.max(TUNNEL_X1 + 60, Math.min(BOSS_MAX - 40, player.x + (Math.random() > 0.5 ? 120 : -120)));
      superAmmo.y = 300;
      audio.superAmmo();
      addFloatText(superAmmo.x + 18, 280, 'SUPER MUNIÇÃO!', '#00ffff');
    }
    if (boss.hp <= 0) startBossDeath();
  }

  function startBossDeath() {
    boss.defeated = true;
    boss.burnT = 0;
    boss.fallVel = 0;
    boss.grounded = false;
    score += 800;
    victoryPhase = VP_BOSS_DEATH;
    cutsceneTimer = 0;
    bullets = [];
    screenShake = 14;
    audio.explosion();
    addFloatText(boss.x + boss.w / 2, boss.y, '+800', '#ff8800');
    spawnParticles(boss.x + boss.w / 2, boss.y + boss.h / 2, ['#d64541', '#ffaa00', '#ffd700'], 50, 1.5);
  }

  // ═══════════ UPDATE: JOGADOR ═══════════
  function updatePlayer() {
    player.moving = false;
    const analogX = Math.abs(axMove.x) > 0.22 ? axMove.x : 0;
    const left = keys['ArrowLeft'] || keys['KeyA'] || vkeys.left || analogX < 0;
    const right = keys['ArrowRight'] || keys['KeyD'] || vkeys.right || analogX > 0;
    const down = keys['ArrowDown'] || keys['KeyS'] || vkeys.down || axMove.y > 0.62;
    const speedMul = analogX ? Math.min(1, Math.max(0.45, Math.abs(analogX) / 0.85)) : 1;

    if (left && !right) { player.x -= player.speed * speedMul; player.moving = true; player.dir = -1; }
    if (right && !left) { player.x += player.speed * speedMul; player.moving = true; player.dir = 1; }
    if (axMove.y < -0.65) queueJump();

    // 🥷 agachar é TÁTICA de batalha — liberado sempre (só a cutscene final trava)
    if (down && victoryPhase < VP_WALK_BASE) {
      if (!player.crouching) { player.crouching = true; player.y += PH - PH_CROUCH; player.h = PH_CROUCH; }
    } else if (player.crouching) {
      player.crouching = false; player.y -= PH - PH_CROUCH; player.h = PH;
    }

    // ── tiro (com mira analógica 360°) ──
    player.shootCooldown--;
    player.bombCooldown--;
    player.stompLock--;
    const aimMag = Math.hypot(axAim.x, axAim.y);
    const aiming = aimMag > 0.22;              // mira móvel a partir de um toque leve
    // 🔫 encostou no analógico da mira → JÁ ATIRA (mesmo parado no centro)
    const wantShoot = player.shooting || vkeys.shoot || aiming;
    if (aiming && Math.abs(axAim.x) > 0.25) player.dir = axAim.x > 0 ? 1 : -1;
    if (wantShoot && player.shootCooldown <= 0) {
      const isSuper = player.hasSuperAmmo && player.superShots > 0;
      const spd = isSuper ? 14 : 11;
      let vx = player.dir * spd, vy = 0;
      if (aiming) { vx = (axAim.x / aimMag) * spd; vy = (axAim.y / aimMag) * spd; }
      const bw = isSuper ? 18 : 12, bh = isSuper ? 8 : 5;
      playerBullets.push({
        x: player.x + player.w / 2 - bw / 2 + Math.sign(vx) * 18,
        y: player.y + 14 + (vy < 0 ? -8 : 0),
        // 8 tiros comuns (3.75) | 3 de bazuca (10) para os 30 de vida
        vx, vy, w: bw, h: bh, isSuper, damage: isSuper ? 10 : 3.75,
        // 🎯 ALCANCE limitado — não dá pra sniperizar o boss do início da fase
        range: isSuper ? SUPER_RANGE : SHOT_RANGE,
      });
      player.shootCooldown = isSuper ? 20 : 12;
      if (isSuper) {
        player.superShots--;
        audio.superShot();
        if (player.superShots <= 0) player.hasSuperAmmo = false;
      } else audio.shoot();
    }
    if (vkeys.bomb && !bombLatch) { bombLatch = true; throwBomb(); }
    if (!vkeys.bomb) bombLatch = false;

    // ── pulo ──
    if (jumpBuffer > 0 && (player.onGround || coyote > 0) && !player.crouching) {
      player.velY = -player.jumpPower;
      player.onGround = false;
      jumpBuffer = 0;
      coyote = 0;
      audio.jump();
    }
    if (jumpBuffer > 0) jumpBuffer--;

    player.velY += player.gravity;
    if (player.velY > 18) player.velY = 18;
    player.y += player.velY;
    player.onGround = false;

    const g = groundUnder(player.x, player.y, player.w, player.h, player.velY);
    if (g) { player.velY = 0; player.y = g.y - player.h; player.onGround = true; }
    for (const b of nameBlocks) {
      if (player.x + player.w > b.x && player.x < b.x + b.w && player.y + player.h > b.y && player.y + player.h < b.y + b.h + 6 && player.velY >= 0) {
        player.velY = 0; player.y = b.y - player.h; player.onGround = true;
      }
    }
    for (const b of titleBlocks) {
      if (player.x + player.w > b.x && player.x < b.x + b.w && player.y + player.h > b.y && player.y + player.h < b.y + b.h + 6 && player.velY >= 0) {
        player.velY = 0; player.y = b.y - player.h; player.onGround = true;
      }
    }
    // 🪨 plataforma rachada (one-way) — começa a tremer quando o Bobby pisa
    if (CRUMBLE.state <= 3 &&
        player.x + player.w > CRUMBLE.x && player.x < CRUMBLE.x + CRUMBLE.w &&
        player.y + player.h > CRUMBLE.y && player.y + player.h < CRUMBLE.y + CRUMBLE.h + 12 && player.velY >= 0) {
      player.velY = 0; player.y = CRUMBLE.y - player.h; player.onGround = true;
      if (CRUMBLE.state === 0) { CRUMBLE.state = 1; CRUMBLE.t = 0; }
    }
    if (player.onGround) coyote = 7;
    else if (coyote > 0) coyote--;

    player.x = Math.max(0, Math.min(LEVEL_WIDTH - player.w, player.x));
    if (!gateDestroyed && player.x > GATE_X - player.w - 6) player.x = GATE_X - player.w - 6;

    // 🧱 paredes — resolve pelo MENOR eixo e nunca "cospe" o Bobby
    for (const w of wallsNow()) {
      if (!(player.x + player.w > w.x && player.x < w.x + w.w &&
            player.y + player.h > w.y && player.y < w.y + w.h)) continue;
      const pRight = w.x + w.w - player.x;        // empurra p/ direita
      const pLeft = player.x + player.w - w.x;    // empurra p/ esquerda
      const pDown = w.y + w.h - player.y;         // empurra p/ baixo
      if (pDown < Math.min(pLeft, pRight)) {
        player.y = w.y + w.h;
        if (player.velY < 0) player.velY = 0;     // bateu a cabeça
      } else if (pLeft < pRight) {
        player.x = w.x - player.w;
      } else {
        player.x = w.x + w.w;
      }
      if (story.holeOpen && !player.crouching && player.x + player.w > MOUTH_X1 - 30 &&
          player.x < TUNNEL_X1 && frameCount % 40 === 0)
        addFloatText(player.x + player.w / 2, player.y - 14, 'AGACHE! (↓)', '#ffd700');
    }

    // 🛝 passou da rampa → desaba atrás, sem volta
    if (!rampSealed && player.x > RAMP_X1 + 30) {
      rampSealed = true;
      screenShake = 12;
      audio.gateBoom();
      boom(RAMP_X0 - 14, 320, 1.1);
      spawnParticles(RAMP_X0 - 14, 330, ['#8a7a6a', '#5b4c3e', '#333'], 46, 1.8);
      for (let i = 0; i < 8; i++) spawnSmoke(RAMP_X0 - 30 + Math.random() * 50, 340);
      addFloatText(player.x + player.w / 2, player.y - 22, 'SEM VOLTA!', '#ff5555');
    }
    // 💥 atravessou o túnel → DESMORONA atrás dele (sem volta)
    if (story.holeOpen && !tunnelCollapsed && player.x > TUNNEL_X1 - 10) {
      tunnelCollapsed = true;
      screenShake = 16;
      audio.gateBoom();
      boom(TUNNEL_X0 + 2, 322, 1.3);
      spawnParticles(TUNNEL_X0, 330, ['#8a7a6a', '#5b4c3e', '#333', '#ffaa00'], 60, 2);
      for (let i = 0; i < 10; i++) spawnSmoke(TUNNEL_X0 - 20 + Math.random() * 70, 340);
      addFloatText(player.x + player.w / 2, player.y - 20, 'FECHOU ATRÁS!', '#ff5555');
    }

    if (player.onGround && victoryPhase === VP_NONE) {
      const gp = groundUnder(player.x, player.y + 1, player.w, player.h, 0.1);
      if (gp && gp.h >= 100) lastSafe = { x: player.x, y: gp.y };
    }

    // ── abismo ──
    if (player.y > ABYSS_Y) {
      if (victoryPhase !== VP_NONE || story.active) {
        // ✅ pouso seguro durante a vitória
        const p = nearestSolid(player.x);
        player.x = Math.max(p.x + 24, Math.min(p.x + p.w - 24 - player.w, player.x));
        player.y = p.y - player.h;
        player.velY = 0;
        spawnParticles(player.x + player.w / 2, player.y + player.h, ['#5bc8f5', '#fff'], 16);
        audio.respawn();
      } else {
        audio.fall();
        player.lives--;
        player.flawless = false;   // 🏆 cair também tira o troféu
        if (player.lives <= 0) { deathPos = { x: lastSafe.x, y: lastSafe.y - PH }; triggerDefeat(); return; }
        player.x = lastSafe.x;
        player.y = lastSafe.y - PH;
        player.velY = 0;
        player.invulnerable = true;
        player.invulnerableTimer = 90;
        camera.x = Math.max(0, Math.min(LEVEL_WIDTH - VW, player.x - VW / 3));
        spawnParticles(player.x + player.w / 2, player.y + player.h / 2, ['#5bc8f5', '#fff', '#2176ae'], 20);
      }
    }

    if (player.invulnerable) { player.invulnerableTimer--; if (player.invulnerableTimer <= 0) player.invulnerable = false; }
    if (player.hasShield) { player.shieldTimer--; if (player.shieldTimer <= 0) player.hasShield = false; }

    // ── 🎬 dispara por POSIÇÃO (X): tanto faz pisar-andar ou pisar-PULAR ──
    if (!hasSteppedOnMarcos && player.x + player.w > nameBounds.x + 10) {
      hasSteppedOnMarcos = true;
      storyDelay = 60;
    }
    if (storyDelay > 0) {
      storyDelay--;
      if (storyDelay === 0) story.start(player.x + PW / 2);
    }
  }

  function updateCrumble() {
    if (CRUMBLE.state === 1) {          // tremendo
      CRUMBLE.t++;
      if (CRUMBLE.t > 34) { CRUMBLE.state = 2; CRUMBLE.t = 0; }
    } else if (CRUMBLE.state === 2) {   // rachando
      CRUMBLE.t++;
      if (CRUMBLE.t > 22) { CRUMBLE.state = 3; CRUMBLE.t = 0; CRUMBLE.vy = 0; audio.uiMove(); }
    } else if (CRUMBLE.state === 3) {   // caindo
      CRUMBLE.vy += 0.6;
      CRUMBLE.y += CRUMBLE.vy;
      if (CRUMBLE.y > 560) { CRUMBLE.state = 4; CRUMBLE.t = 0; }
    } else if (CRUMBLE.state === 4) {   // renascendo
      CRUMBLE.t++;
      if (CRUMBLE.t > 160) {
        CRUMBLE.state = 0; CRUMBLE.y = CRUMBLE.baseY; CRUMBLE.vy = 0; CRUMBLE.t = 0;
        spawnParticles(CRUMBLE.x + CRUMBLE.w / 2, CRUMBLE.y, ['#e74c3c', '#fff', '#c0392b'], 14);
        audio.respawn();
      }
    }
  }

  function triggerDefeat() {
    phase = 'DEFEAT';
    defeatPhase = 0; defeatTimer = 0; defeatExplosions = []; defeatSignY = -200;
    audio.gameOver();
    emit('state', phase);
  }

  function takeDamage() {
    if (player.invulnerable || phase !== 'GAME' || victoryPhase >= VP_WALK_BASE) return;
    if (player.hasShield) {
      player.hasShield = false; player.shieldTimer = 0;
      audio.shield();
      spawnParticles(player.x + player.w / 2, player.y + player.h / 2, ['#0088ff', '#fff'], 15);
      return;
    }
    player.lives--;
    player.flawless = false;   // 🏆 perdeu o troféu
    audio.hit();
    screenShake = Math.max(screenShake, 6);
    spawnParticles(player.x + player.w / 2, player.y + player.h / 2, ['#ff4444', '#fff'], 15);
    if (player.lives <= 0) { deathPos = { x: player.x, y: player.y + player.h - PH }; triggerDefeat(); }
    else { player.invulnerable = true; player.invulnerableTimer = 90; }
  }

  function gainLife(reason: string) {
    if (player.lives < player.maxLives) {
      player.lives++;
      audio.lifeUp();
      addFloatText(player.x + PW / 2, player.y - 14, reason, '#ff3388');
    } else {
      score += 100;
      addFloatText(player.x + PW / 2, player.y - 14, '+100', '#ffd700');
    }
  }

  // ═══════════ UPDATE: INIMIGOS ═══════════
  function updateEnemies() {
    enemiesData.forEach((d) => {
      if (!d.alive) {
        d.respawnTimer--;
        if (d.respawnTimer <= 0) { d.alive = true; enemies.push(spawnEnemy(d)); audio.respawn(); }
      }
    });
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      e.velY += 0.55;
      e.y += e.velY;
      let onPlat = false;
      for (const p of PLATFORMS) {
        if (p.kind === 'small') continue;
        if (e.x + e.w > p.x && e.x < p.x + p.w && e.y + e.h > p.y && e.y + e.h < p.y + p.h * 0.6 && e.velY >= 0) {
          e.velY = 0; e.y = p.y - e.h; onPlat = true;
        }
      }
      if (e.y > ABYSS_Y) {
        const d = enemiesData.find((x) => x.id === e.id);
        if (d) { d.alive = false; d.respawnTimer = 300; }
        enemies.splice(i, 1);
        continue;
      }
      // fogo residual das bombas mata
      let burned = false;
      for (const s of scorches) {
        if (s.t > 150 && e.x + e.w > s.x && e.x < s.x + s.w && Math.abs(e.y + e.h - s.y) < 26) burned = true;
      }
      if (burned) { killEnemy(i, 25); continue; }

      e.x += e.speed * e.dir;
      const frontX = e.dir === 1 ? e.x + e.w + 2 : e.x - 2;
      let ahead = false;
      for (const p of PLATFORMS) {
        if (frontX > p.x && frontX < p.x + p.w && e.y + e.h + 10 > p.y && e.y + e.h < p.y + 20) ahead = true;
      }
      if (onPlat && !ahead) e.dir *= -1;
      if (e.x <= 0 || e.x >= LEVEL_WIDTH - e.w) e.dir *= -1;

      e.shootCooldown--;
      const dx = Math.abs(player.x - e.x), dy = Math.abs(player.y - e.y);
      if (dx < 260 && dy < 80 && e.shootCooldown <= 0 && victoryPhase === VP_NONE) {
        bullets.push({ x: e.x + e.w / 2, y: e.y + e.h / 2, vx: (player.x > e.x ? 1 : -1) * 4, vy: 0, w: 12, h: 12 });
        e.shootCooldown = 95;
        audio.shoot();
      }
      if (dx < 200) {
        if (player.x < e.x && e.dir === 1) e.dir = -1;
        if (player.x > e.x && e.dir === -1) e.dir = 1;
      }

      // ✅ stomp funciona mesmo invulnerável
      if (player.velY > 0 &&
          player.x + player.w - 8 > e.x + 4 && player.x + 8 < e.x + e.w - 4 &&
          player.y + player.h > e.y && player.y + player.h < e.y + e.h * 0.55) {
        e.stompCount++;
        player.velY = -9;
        audio.stomp();
        spawnParticles(e.x + e.w / 2, e.y, ['#ff6666', '#fff'], 8);
        if (e.stompCount >= 2) killEnemy(i, 30);
      }
    }
  }

  // 🏃 quando o chefão explode o portão, os capangas debandam
  let enemiesFleeing = false;
  function updateFleeing() {
    if (!enemiesFleeing) return;
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      e.dir = -1;
      e.x -= 5.5;
      e.velY += 0.55;
      e.y += e.velY;
      const g = groundUnder(e.x, e.y, e.w, e.h, e.velY);
      if (g) { e.velY = 0; e.y = g.y - e.h; }
      if (frameCount % 9 === 0) spawnSmoke(e.x + e.w / 2, e.y + e.h);
      if (e.x < camera.x - 120) enemies.splice(i, 1);
    }
  }
  function startFleeing() {
    if (enemiesFleeing) return;
    enemiesFleeing = true;
    enemiesData.forEach((d) => { d.alive = false; d.respawnTimer = 1e9; });
    enemies.forEach((e) => addFloatText(e.x + e.w / 2, e.y - 8, 'CORRE!', '#ffcf5a'));
  }

  // ═══════════ UPDATE: BOSS ═══════════
  function updateBoss() {
    if (!boss.active || boss.defeated) return;
    if (boss.hurtFlash > 0) boss.hurtFlash--;
    // 💫 propulsor atingido → ele despenca e fica vulnerável (janela de ataque)
    if (boss.stagger > 0) {
      boss.stagger--;
      boss.y += 3.4;
      boss.y = Math.min(276, boss.y);
      if (frameCount % 4 === 0) spawnSmoke(boss.x + boss.w / 2, boss.y + boss.h);
      if (player.velY > 0 && player.stompLock <= 0 &&
          player.x + player.w - 6 > boss.x && player.x + 6 < boss.x + boss.w &&
          player.y + player.h > boss.y && player.y + player.h < boss.y + boss.h * 0.6) {
        player.velY = -12;
        player.stompLock = 20;
        damageBoss(3, player.x + player.w / 2, boss.y + 14);
        audio.stomp();
      }
      return;
    }
    boss.patternTimer++;
    if (boss.patternTimer > 200) { boss.pattern = (boss.pattern + 1) % 3; boss.patternTimer = 0; }
    const rage = boss.hp <= boss.maxHp * 0.4;
    const spd = boss.speed * (rage ? 1.35 : 1);

    switch (boss.pattern) {
      case 0:
        boss.x += spd * boss.dir;
        boss.y = boss.baseY + Math.sin(frameCount * 0.035) * 46;
        if (boss.x <= BOSS_MIN || boss.x >= BOSS_MAX - boss.w) boss.dir *= -1;
        boss.shootCooldown--;
        if (boss.shootCooldown <= 0) {
          bullets.push({ x: boss.x + boss.w / 2, y: boss.y + boss.h, vx: 0, vy: 4.5, w: 12, h: 12 });
          boss.shootCooldown = rage ? 30 : 42;
          audio.shoot();
        }
        break;
      case 1: {
        const tx = player.x - boss.x, ty = (player.y - 70) - boss.y;
        boss.x += Math.sign(tx) * 3;
        boss.y += Math.sign(ty) * 2;
        boss.y = Math.max(96, Math.min(250, boss.y));
        boss.dir = tx > 0 ? 1 : -1;
        boss.shootCooldown--;
        if (boss.shootCooldown <= 0) {
          for (let a = -1; a <= 1; a++)
            bullets.push({ x: boss.x + boss.w / 2, y: boss.y + boss.h, vx: a * 3, vy: 4.5, w: 12, h: 12 });
          boss.shootCooldown = rage ? 42 : 56;
          audio.shoot();
        }
        break;
      }
      case 2:
        boss.x += spd * boss.dir * 0.5;
        boss.y = boss.baseY + Math.sin(frameCount * 0.05) * 62;
        if (boss.x <= BOSS_MIN || boss.x >= BOSS_MAX - boss.w) boss.dir *= -1;
        boss.shootCooldown--;
        if (boss.shootCooldown <= 0) {
          for (let i = 0; i < 5; i++) {
            const ang = Math.PI * 0.3 + Math.PI * 0.4 * (i / 4);
            bullets.push({ x: boss.x + boss.w / 2, y: boss.y + boss.h, vx: Math.cos(ang) * 3, vy: Math.sin(ang) * 3, w: 12, h: 12 });
          }
          boss.shootCooldown = rage ? 30 : 40;
          audio.shoot();
        }
        break;
    }
    boss.x = Math.max(BOSS_MIN, Math.min(BOSS_MAX - boss.w, boss.x));

    // ✅ pular na cabeça do Socram
    if (player.velY > 0 && player.stompLock <= 0 &&
        player.x + player.w - 6 > boss.x && player.x + 6 < boss.x + boss.w &&
        player.y + player.h > boss.y && player.y + player.h < boss.y + boss.h * 0.5) {
      player.velY = -12;
      player.stompLock = 22;
      damageBoss(3, player.x + player.w / 2, boss.y + 14); // 10 pulos = 30
      audio.stomp();
      screenShake = Math.max(screenShake, 5);
      return;
    }
    if (!player.invulnerable && !player.hasShield &&
        player.x + player.w > boss.x + 6 && player.x < boss.x + boss.w - 6 &&
        player.y + player.h > boss.y + 8 && player.y < boss.y + boss.h) takeDamage();
  }

  // ═══════════ UPDATE: PROJÉTEIS / BOMBAS ═══════════
  function bulletHitsPlatform(b: Bullet) {
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    for (const p of PLATFORMS) if (cx > p.x && cx < p.x + p.w && cy > p.y && cy < p.y + p.h) return true;
    // 🧱 paredes de rocha da masmorra também param o tiro
    for (const w of wallsNow()) if (cx > w.x && cx < w.x + w.w && cy > w.y && cy < w.y + w.h) return true;
    return false;
  }

  function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.vx; b.y += b.vy;
      let dead = false;
      const hitsPlayer = victoryPhase === VP_NONE && !story.active &&
        player.x < b.x + b.w && player.x + player.w > b.x && player.y < b.y + b.h && player.y + player.h > b.y;
      if (hitsPlayer && !player.invulnerable && !player.hasShield) {
        takeDamage();
        spawnParticles(b.x, b.y, ['#ff0000', '#ff6666', '#fff'], 15);
        dead = true;
      } else if (hitsPlayer && player.hasShield) {
        player.hasShield = false; player.shieldTimer = 0;
        spawnParticles(b.x, b.y, ['#0088ff', '#00aaff', '#fff'], 10);
        audio.shield();
        dead = true;
      } else if (bulletHitsPlatform(b)) {
        addImpact(b.x + b.w / 2, b.y + b.h / 2, false);
        spawnParticles(b.x, b.y, ['#666', '#999'], 4);
        dead = true;
      } else {
        b.range = (b.range ?? ENEMY_SHOT_RANGE) - Math.hypot(b.vx, b.vy);
        if (b.range <= 0) dead = true;
      }
      if (!dead && (b.x < -30 || b.x > LEVEL_WIDTH + 30 || b.y > 520 || b.y < -60)) dead = true;
      if (dead) bullets.splice(i, 1);
    }

    for (let i = playerBullets.length - 1; i >= 0; i--) {
      const b = playerBullets[i];
      b.x += b.vx;
      b.y += b.vy;
      let dead = false;
      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        if (e.x < b.x + b.w && e.x + e.w > b.x && e.y < b.y + b.h && e.y + e.h > b.y) {
          killEnemy(j, 25);
          dead = true;
          break;
        }
      }
      if (!dead && !boss.defeated && boss.active &&
          boss.x < b.x + b.w && boss.x + boss.w > b.x && boss.y < b.y + b.h && boss.y + boss.h > b.y) {
        damageBoss(b.damage || 1, b.x, b.y);
        dead = true;
      }
      // 🧱 bateu na parede/chão → marca o ponto de impacto
      if (!dead && bulletHitsPlatform(b)) {
        addImpact(b.x + b.w / 2, b.y + b.h / 2, !!b.isSuper);
        spawnParticles(b.x, b.y, ['#ffe9a8', '#8a8072', '#fff'], b.isSuper ? 10 : 5);
        audio.uiMove();
        dead = true;
      }
      // 🎯 acabou o alcance → o tiro se dissipa no ar
      if (!dead) {
        b.range = (b.range ?? SHOT_RANGE) - Math.hypot(b.vx, b.vy);
        if (b.range <= 0) {
          spawnParticles(b.x + b.w / 2, b.y + b.h / 2, ['#9ad9a0', '#cfe9c4'], 4);
          dead = true;
        }
      }
      if (!dead && (b.x < -30 || b.x > LEVEL_WIDTH + 30 || b.y < -60 || b.y > 520)) dead = true;
      if (dead) playerBullets.splice(i, 1);
    }

    for (let i = bombs.length - 1; i >= 0; i--) {
      const bo = bombs[i];
      bo.vy += 0.42;
      bo.x += bo.vx;
      bo.y += bo.vy;
      bo.fuse--;
      if (frameCount % 3 === 0) spawnSmoke(bo.x, bo.y);
      const gy = groundYAt(bo.x);
      let boom = bo.fuse <= 0;
      if (bo.y + 10 >= gy && bo.vy > 0) { bo.y = gy - 10; boom = true; }
      for (const e of enemies) {
        if (bo.x > e.x - 8 && bo.x < e.x + e.w + 8 && bo.y > e.y - 8 && bo.y < e.y + e.h + 8) boom = true;
      }
      if (boss.active && !boss.defeated && bo.x > boss.x && bo.x < boss.x + boss.w && bo.y > boss.y && bo.y < boss.y + boss.h) boom = true;
      if (boom) { explodeBomb(bo.x, bo.y); bombs.splice(i, 1); }
    }

    for (let i = scorches.length - 1; i >= 0; i--) {
      scorches[i].t--;
      if (scorches[i].t <= 0) scorches.splice(i, 1);
    }
  }

  // ═══════════ COLETAS ═══════════
  function checkCollections() {
    for (const c of coins) {
      if (c.collected) continue;
      if (player.x < c.x + c.w && player.x + player.w > c.x && player.y < c.y + c.h && player.y + player.h > c.y) {
        c.collected = true;
        score += c.points;
        if (c.type === 'coin') {
          player.coinsCollected++;
          audio.coin();
          spawnParticles(c.x + c.w / 2, c.y + c.h / 2, ['#ffd700', '#fff', '#ffa500'], 12);
          if (player.coinsCollected % 10 === 0) gainLife('10 MOEDAS = +1 VIDA');
          else addFloatText(c.x + c.w / 2, c.y, `+${c.points}`, '#ffd700');
        } else {
          audio.star();
          addFloatText(c.x + c.w / 2, c.y, `+${c.points}`, '#ff8800');
          spawnParticles(c.x + c.w / 2, c.y + c.h / 2, ['#ffd700', '#ff8800', '#fff'], 25);
        }
      }
    }
    for (const h of hearts) {
      if (h.collected) continue;
      if (player.x < h.x + h.w && player.x + player.w > h.x && player.y < h.y + h.h && player.y + player.h > h.y) {
        h.collected = true;
        audio.heal();
        gainLife('+1 VIDA');
        spawnParticles(h.x + 18, h.y + 18, ['#ff0066', '#ff3388', '#fff'], 30);
      }
    }
    for (const r of rockets) {
      if (r.collected) continue;
      if (player.x < r.x + r.w && player.x + player.w > r.x && player.y < r.y + r.h && player.y + player.h > r.y) {
        r.collected = true;
        player.rockets++;
        score += 25;
        audio.superAmmo();
        spawnParticles(r.x + 15, r.y + 17, ['#e74c3c', '#ffaa00', '#fff'], 22);
        if (player.rockets % 2 === 0) {
          player.bombs++;
          addFloatText(r.x + 15, r.y - 4, '💣 +1 BOMBA!', '#ff8800');
        } else {
          addFloatText(r.x + 15, r.y - 4, 'FOGUETE 1/2', '#e74c3c');
        }
      }
    }
    if (!shieldItem.collected &&
        player.x < shieldItem.x + shieldItem.w && player.x + player.w > shieldItem.x &&
        player.y < shieldItem.y + shieldItem.h && player.y + player.h > shieldItem.y) {
      shieldItem.collected = true;
      player.hasShield = true;
      player.shieldTimer = 900;
      audio.shield();
      addFloatText(shieldItem.x + 15, shieldItem.y, 'ESCUDO!', '#00aaff');
      spawnParticles(shieldItem.x + 15, shieldItem.y + 15, ['#0088ff', '#00aaff', '#fff'], 20);
    }
    if (superAmmo.spawned && !superAmmo.collected &&
        player.x < superAmmo.x + superAmmo.w && player.x + player.w > superAmmo.x &&
        player.y < superAmmo.y + superAmmo.h && player.y + player.h > superAmmo.y) {
      superAmmo.collected = true;
      player.hasSuperAmmo = true;
      player.superShots = 3;
      audio.superAmmo();
      addFloatText(superAmmo.x + 18, superAmmo.y, 'SUPER TIRO x3!', '#00ffff');
      spawnParticles(superAmmo.x + 18, superAmmo.y + 18, ['#00ffff', '#fff', '#ffff00'], 30);
    }
    if (!player.invulnerable && !player.hasShield && victoryPhase === VP_NONE) {
      for (const e of enemies) {
        if (player.x + 6 < e.x + e.w - 6 && player.x + player.w - 6 > e.x + 6 &&
            player.y + player.h > e.y + e.h * 0.55 && player.y + 6 < e.y + e.h && player.velY <= 0) {
          takeDamage();
          break;
        }
      }
    }
    if (goldenKey.active && !goldenKey.collected) {
      const ky = goldenKey.flying ? goldenKey.y : goldenKey.y + Math.sin(goldenKey.bobT) * 8;
      if (player.x + player.w > goldenKey.x && player.x < goldenKey.x + goldenKey.w &&
          player.y + player.h > ky && player.y < ky + goldenKey.h) {
        goldenKey.collected = true;
        audio.keyGet();
        spawnParticles(goldenKey.x + 20, ky + 20, ['#ffd700', '#fff', '#fff8a0'], 40);
        addFloatText(goldenKey.x + 20, ky - 10, 'CHAVE CONQUISTADA!', '#ffd700');
        victoryPhase = VP_WALK_BASE;
        cutsceneTimer = 0;
        player.shooting = false;
      }
    }
  }

  // ═══════════ CUTSCENE FINAL ═══════════
  function autoWalk(targetX: number, speed: number, dir: number) {
    player.dir = dir;
    player.x += speed * dir;
    player.velY += player.gravity;
    player.y += player.velY;
    player.onGround = false;
    const g = groundUnder(player.x, player.y, player.w, player.h, player.velY);
    if (g) { player.velY = 0; player.y = g.y - player.h; player.onGround = true; }
    if ((dir === 1 && player.x >= targetX) || (dir === -1 && player.x <= targetX)) { player.x = targetX; return true; }
    return false;
  }

  function updateVictory() {
    cutsceneTimer++;
    if (victoryPhase >= VP_KEY && baseAlpha < 1) baseAlpha = Math.min(1, baseAlpha + 0.015);

    if (victoryPhase === VP_BOSS_DEATH) {
      // 🔥 física da morte: cai, queima e caminha até o portão
      boss.burnT++;
      if (!boss.grounded) {
        boss.fallVel += 0.55;
        boss.y += boss.fallVel;
        if (boss.y >= 350 - boss.h) {
          boss.y = 350 - boss.h;
          boss.grounded = true;
          screenShake = 9;
          audio.explosion();
          spawnParticles(boss.x + boss.w / 2, 350, ['#886644', '#ffaa00', '#666'], 26, 1.4);
        }
      } else if (boss.x < GATE_X - 62) {
        boss.x += 2.1;
      }
      if (frameCount % 3 === 0)
        spawnParticles(boss.x + boss.w / 2 + (Math.random() - 0.5) * 46, boss.y + Math.random() * boss.h, ['#ff4400', '#ffaa00', '#ffff00'], 2);
      if (frameCount % 5 === 0) spawnSmoke(boss.x + boss.w / 2, boss.y + 10);

      if (boss.grounded && boss.x >= GATE_X - 64 && boss.burnT > 40) {
        boss.hidden = true;
        gateDestroyed = true;
        startFleeing();          // 🏃 capangas debandam
        boom(GATE_X, 300, 2.4);
        screenShake = 22;
        audio.gateBoom();
        spawnParticles(GATE_X, 300, ['#ff8800', '#ffcc00', '#555', '#333'], 60, 2);
        spawnParticles(boss.x + boss.w / 2, boss.y, ['#ff4400', '#ffd700', '#d64541'], 45, 1.8);
        goldenKey.x = GATE_X - 96;
        goldenKey.y = 276;
        goldenKey.active = true;
        keyTimer = 0;
        victoryPhase = VP_KEY;
        cutsceneTimer = 0;
        addFloatText(GATE_X - 76, 250, 'O PORTÃO CAIU!', '#ffd700');
      }
    } else if (victoryPhase === VP_KEY) {
      goldenKey.bobT += 0.06;
      keyTimer++;
      // ⏱ 10 segundos → a chave voa até o Bobby
      if (keyTimer > 600 && !goldenKey.flying) {
        goldenKey.flying = true;
        audio.signal();
        addFloatText(goldenKey.x + 20, goldenKey.y - 20, 'A CHAVE VEM ATÉ VOCÊ!', '#ffd700');
      }
      if (goldenKey.flying) {
        goldenKey.x += (player.x + player.w / 2 - 20 - goldenKey.x) * 0.07;
        goldenKey.y += (player.y + 4 - goldenKey.y) * 0.07;
        if (frameCount % 3 === 0) spawnParticles(goldenKey.x + 20, goldenKey.y + 20, ['#ffd700', '#fff8a0'], 2);
      }
    } else if (victoryPhase === VP_WALK_BASE) {
      if (autoWalk(ANTENNA_X - 34, 3, 1)) { victoryPhase = VP_CONSOLE; cutsceneTimer = 0; audio.unlockGate(); }
    } else if (victoryPhase === VP_CONSOLE) {
      if (cutsceneTimer > 90) { victoryPhase = VP_SIGNAL; cutsceneTimer = 0; audio.signal(); }
    } else if (victoryPhase === VP_SIGNAL) {
      if (cutsceneTimer > 150) { victoryPhase = VP_ROCKET_DOWN; cutsceneTimer = 0; audio.rocket(); rocketY = -240; }
    } else if (victoryPhase === VP_ROCKET_DOWN) {
      rocketY += 2.6;
      if (rocketY >= 243) {
        rocketY = 243;
        victoryPhase = VP_BOARD;
        cutsceneTimer = 0;
        screenShake = 6;
        audio.explosion();
      }
    } else if (victoryPhase === VP_BOARD) {
      if (autoWalk(ROCKET_X + 10, 2.2, -1)) {
        playerEnteredRocket = true;
        victoryPhase = VP_TAKEOFF;
        cutsceneTimer = 0;
        audio.rocket();
      }
    } else if (victoryPhase === VP_TAKEOFF) {
      if (cutsceneTimer > 45) {
        rocketTakingOff = true;
        rocketY -= 4 + cutsceneTimer * 0.035;
        screenShake = 6;
        if (frameCount % 3 === 0) spawnSmoke(ROCKET_X + (Math.random() - 0.5) * 36, rocketY + 105);
        if (rocketY < -300) {
          victoryPhase = VP_SCREEN;
          cutsceneTimer = 0;
          screenShake = 0;
          audio.victory();
          phase = 'VICTORY';
          emit('state', phase);
          endOfRun(true);
        }
      }
    }

    // ✅ a câmera acompanha TODA a cutscene
    if (victoryPhase >= VP_BOSS_DEATH && victoryPhase <= VP_TAKEOFF) {
      let focus = player.x;
      if (victoryPhase === VP_BOSS_DEATH) focus = (player.x + boss.x) / 2;
      if (victoryPhase === VP_TAKEOFF) focus = ROCKET_X;
      const target = Math.max(0, Math.min(LEVEL_WIDTH - VW, focus - VW / 2));
      camera.x += (target - camera.x) * 0.06;
    }
  }

  // ═══════════ DERROTA ═══════════
  function updateDefeat() {
    defeatTimer++;
    if (defeatPhase === 0) { if (defeatTimer > 60) { defeatPhase = 1; defeatTimer = 0; } }
    else if (defeatPhase === 1) {
      if (defeatTimer % 15 === 0) {
        defeatExplosions.push({ x: deathPos.x + Math.random() * PW, y: deathPos.y + Math.random() * PH, size: 5 + Math.random() * 10, life: 30 });
        audio.hit();
      }
      if (defeatTimer > 90) { defeatPhase = 2; defeatTimer = 0; audio.explosion(); }
    } else if (defeatPhase === 2) { if (defeatTimer > 60) { defeatPhase = 3; defeatTimer = 0; } }
    else if (defeatPhase === 3) {
      defeatSignY += 8;
      if (defeatSignY >= 140) { defeatSignY = 140; defeatPhase = 4; endOfRun(false); }
    }
    for (let i = defeatExplosions.length - 1; i >= 0; i--) {
      defeatExplosions[i].life--;
      defeatExplosions[i].size += 0.5;
      if (defeatExplosions[i].life <= 0) defeatExplosions.splice(i, 1);
    }
  }

  function updateTimer() {
    if (victoryPhase !== VP_NONE || story.active) return;
    timeLeft -= 1 / 60;
    if (timeLeft <= 0) {
      timeLeft = 0;
      deathPos = { x: player.x, y: player.y + player.h - PH };
      player.lives = 0;
      triggerDefeat();
    }
  }
  function updateCamera() {
    const tx = player.x - VW / 3;
    camera.x += (tx - camera.x) * 0.1;
    camera.x = Math.max(0, Math.min(LEVEL_WIDTH - VW, camera.x));
  }

  // ═══════════════ DESENHO ═══════════════
  function lerpColor(c1: string, c2: string, t: number) {
    const r1 = parseInt(c1.slice(1, 3), 16), g1 = parseInt(c1.slice(3, 5), 16), b1 = parseInt(c1.slice(5, 7), 16);
    const r2 = parseInt(c2.slice(1, 3), 16), g2 = parseInt(c2.slice(3, 5), 16), b2 = parseInt(c2.slice(5, 7), 16);
    return `#${[r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
  }

  function drawBackground() {
    if (hasSteppedOnMarcos && sunriseProgress < 1) sunriseProgress += 0.0007;
    const step = Math.round(sunriseProgress * 24) / 24; // quantiza p/ cachear gradiente
    let top: string, bot: string;
    if (!hasSteppedOnMarcos) { top = '#0a0a1a'; bot = '#1a1a3a'; }
    else if (step < 0.5) { const t = step * 2; top = lerpColor('#0a0a1a', '#2c3e50', t); bot = lerpColor('#1a1a3a', '#4a69bd', t); }
    else { const t = (step - 0.5) * 2; top = lerpColor('#2c3e50', '#87ceeb', t); bot = lerpColor('#4a69bd', '#98d8c8', t); }
    ctx.fillStyle = linGrad(`sky${top}${bot}`, 0, 0, 0, H, [[0, top], [1, bot]]);
    ctx.fillRect(0, 0, VW, H);

    if (sunriseProgress < 0.6) {
      const ma = Math.max(0, 1 - sunriseProgress * 1.7);
      const mx = 700 - camera.x * 0.1;
      if (mx > -60 && mx < VW + 60) {
        ctx.globalAlpha = ma;
        drawGlow('rgba(255,251,230,0.5)', 60, mx, 100);
        ctx.fillStyle = '#fffbe6';
        ctx.beginPath(); ctx.arc(mx, 100, 30, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ddd';
        ctx.beginPath(); ctx.arc(mx - 10, 95, 5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(mx + 10, 108, 4, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    if (sunriseProgress > 0.2) {
      const sa = Math.min(1, (sunriseProgress - 0.2) * 2);
      const sy = 450 - sunriseProgress * 350;
      const sx = 100 - camera.x * 0.1;
      ctx.globalAlpha = sa;
      drawGlow('rgba(255,250,205,0.55)', 90, sx, sy);
      ctx.fillStyle = '#FFFACD';
      ctx.beginPath(); ctx.arc(sx, sy, 35, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }

    // ✅ estrelas determinísticas
    const sta = Math.max(0, 1 - sunriseProgress * 1.5);
    if (sta > 0) {
      for (const st of starField) {
        const sx = ((st.x - camera.x * 0.3) % LEVEL_WIDTH + LEVEL_WIDTH) % LEVEL_WIDTH;
        if (sx < -10 || sx > VW + 10) continue;
        const tw = 0.55 + 0.45 * Math.sin(frameCount * 0.045 + st.ph);
        ctx.fillStyle = `rgba(255,255,255,${(sta * tw).toFixed(3)})`;
        ctx.fillRect(sx, st.y, st.s, 1.5);
      }
    }

    const ca = hasSteppedOnMarcos ? Math.min(0.75, 0.1 + sunriseProgress * 0.65) : 0.1;
    ctx.fillStyle = `rgba(255,255,255,${ca.toFixed(2)})`;
    for (let i = 0; i < 5; i++) {
      const cx = ((i * 300 + frameCount * 0.2 - camera.x * 0.1) % (VW + 400)) - 200;
      ctx.fillRect(cx, 130 + i * 20, 60, 15);
      ctx.fillRect(cx + 15, 120 + i * 20, 30, 15);
    }

    // montanhas parallax
    const far = hasSteppedOnMarcos ? lerpColor('#15152e', '#5a7a9a', sunriseProgress) : '#15152e';
    const near = hasSteppedOnMarcos ? lerpColor('#101024', '#40607a', sunriseProgress) : '#101024';
    ctx.fillStyle = far;
    for (let i = 0; i < 14; i++) {
      const mx = ((i * 340 - camera.x * 0.15) % 2400) - 200;
      ctx.beginPath();
      ctx.moveTo(mx, 350); ctx.lineTo(mx + 120, 200 + (i % 3) * 25); ctx.lineTo(mx + 240, 350);
      ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = near;
    for (let i = 0; i < 12; i++) {
      const mx = ((i * 420 - camera.x * 0.35) % 2800) - 200;
      ctx.beginPath();
      ctx.moveTo(mx, 350); ctx.lineTo(mx + 150, 245 + (i % 2) * 30); ctx.lineTo(mx + 300, 350);
      ctx.closePath(); ctx.fill();
    }
  }

  // ✅ buraco SEMPRE preto — não fica cinza/lacrado de dia
  function drawAbyss() {
    for (const [start, end] of ABYSSES) {
      const sx = start - camera.x, w = end - start;
      if (sx + w < -20 || sx > VW + 20) continue;
      // poço sólido (cobre o céu claro do amanhecer)
      ctx.fillStyle = '#05050a';
      ctx.fillRect(sx, 350, w, H - 350);
      // paredes laterais do poço
      ctx.fillStyle = '#241a12';
      ctx.fillRect(sx, 350, 7, H - 350);
      ctx.fillRect(sx + w - 7, 350, 7, H - 350);
      ctx.fillStyle = '#3d2a1c';
      ctx.fillRect(sx, 350, w, 5);
      // profundidade
      ctx.fillStyle = linGrad('pit', 0, 350, 0, H, [[0, 'rgba(60,40,25,0.55)'], [1, 'rgba(0,0,0,0)']]);
      ctx.fillRect(sx + 7, 350, w - 14, H - 350);
      // faixas de perigo nas bordas
      ctx.fillStyle = 'rgba(255,180,0,0.6)';
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(sx - 16 + i * 8, 346, 4, 5);
        ctx.fillRect(sx + w + 4 - i * 8, 346, 4, 5);
      }
    }
  }

  function platformSprite(p: Platform): HTMLCanvasElement {
    const key = `${p.kind}:${p.w}:${p.h}`;
    let c = platCache.get(key);
    if (c) return c;
    c = document.createElement('canvas');
    c.width = p.w; c.height = p.h;
    const g = c.getContext('2d')!;
    if (p.kind === 'ground') {
      g.fillStyle = '#5dbb63'; g.fillRect(0, 0, p.w, 10);
      g.fillStyle = '#3a8c41'; g.fillRect(0, 10, p.w, 6);
      const dg = g.createLinearGradient(0, 16, 0, p.h);
      dg.addColorStop(0, '#6B3F2A'); dg.addColorStop(1, '#3d2010');
      g.fillStyle = dg; g.fillRect(0, 16, p.w, p.h - 16);
      g.fillStyle = 'rgba(0,0,0,0.09)';
      for (let bx = 8; bx < p.w; bx += 40) g.fillRect(bx, 30, 3, 12);
      g.fillStyle = 'rgba(255,255,255,0.06)';
      for (let bx = 24; bx < p.w; bx += 56) g.fillRect(bx, 52, 10, 3);
    } else if (p.kind === 'small') {
      g.fillStyle = '#c0392b'; g.fillRect(0, 0, p.w, p.h);
      g.fillStyle = '#e74c3c'; g.fillRect(2, 2, p.w - 4, p.h - 4);
    } else if (p.kind === 'ramp') {
      g.fillStyle = '#7a5433'; g.fillRect(0, 0, p.w, p.h);
      g.fillStyle = '#a9773f'; g.fillRect(0, 0, p.w, 4);
      g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(0, p.h - 3, p.w, 3);
    } else if (p.kind === 'cave') {
      g.fillStyle = '#463a2e'; g.fillRect(0, 0, p.w, p.h);
      g.fillStyle = '#6a5844'; g.fillRect(0, 0, p.w, 4);
      g.fillStyle = '#2f261d';
      for (let bx = 6; bx < p.w; bx += 18) g.fillRect(bx, 7, 8, 4);
    } else {
      g.fillStyle = '#8B5E3C'; g.fillRect(0, 0, p.w, p.h);
      g.fillStyle = '#c8945a'; g.fillRect(0, 0, p.w, 5);
      g.fillStyle = 'rgba(0,0,0,0.15)';
      for (let bx = 10; bx < p.w; bx += 26) g.fillRect(bx, 6, 2, p.h - 8);
    }
    platCache.set(key, c);
    return c;
  }

  function drawPlatforms() {
    for (const p of PLATFORMS) {
      const sx = p.x - camera.x;
      if (sx + p.w < -40 || sx > VW + 40) continue;
      ctx.drawImage(platformSprite(p), Math.round(sx), p.y);
    }
    // chão queimado das bombas
    for (const s of scorches) {
      const sx = s.x - camera.x;
      if (sx + s.w < -20 || sx > VW + 20) continue;
      const a = Math.min(1, s.t / 120);
      ctx.globalAlpha = 0.75 * a;
      ctx.fillStyle = '#140d08';
      ctx.beginPath(); ctx.ellipse(sx + s.w / 2, s.y + 5, s.w / 2, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      if (s.t > 150) {
        for (let i = 0; i < 5; i++) {
          const fx = sx + 12 + i * (s.w - 24) / 4;
          const fh = 10 + Math.abs(Math.sin(frameCount * 0.2 + i * 1.7)) * 14;
          ctx.fillStyle = i % 2 ? 'rgba(255,140,0,0.85)' : 'rgba(255,215,0,0.8)';
          ctx.beginPath();
          ctx.moveTo(fx - 5, s.y + 4);
          ctx.lineTo(fx, s.y + 4 - fh);
          ctx.lineTo(fx + 5, s.y + 4);
          ctx.closePath(); ctx.fill();
        }
      }
    }
    // letreiro MARCOS
    for (const b of nameBlocks) {
      const sx = b.x - camera.x;
      if (sx + b.w < -10 || sx > VW + 10) continue;
      const gl = Math.sin(frameCount * 0.03 + b.x * 0.01) * 0.3 + 0.7;
      ctx.fillStyle = `rgba(255,215,0,${gl.toFixed(2)})`;
      ctx.fillRect(sx, b.y, b.w, b.h);
      ctx.fillStyle = '#B8860B';
      ctx.fillRect(sx, b.y, 1, b.h);
      ctx.fillRect(sx, b.y, b.w, 1);
    }
    for (const b of titleBlocks) {
      const sx = b.x - camera.x;
      if (sx + b.w < -10 || sx > VW + 10) continue;
      ctx.fillStyle = 'rgba(205,205,225,0.85)';
      ctx.fillRect(sx, b.y, b.w, b.h);
    }
    // 🪨 plataforma rachada (treme/racha/cai)
    if (CRUMBLE.state <= 3) {
      const sx = CRUMBLE.x - camera.x;
      if (sx + CRUMBLE.w > -30 && sx < VW + 30) {
        const shake = CRUMBLE.state === 1 ? (Math.random() - 0.5) * 3
                    : CRUMBLE.state === 2 ? (Math.random() - 0.5) * 6 : 0;
        const px = Math.round(sx + shake);
        const py = Math.round(CRUMBLE.y);
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(px, py, CRUMBLE.w, CRUMBLE.h);
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(px + 2, py + 2, CRUMBLE.w - 4, CRUMBLE.h - 4);
        // rachaduras
        if (CRUMBLE.state >= 2) {
          ctx.strokeStyle = '#3a0d0d';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(px + 8, py + 2); ctx.lineTo(px + 20, py + 7);
          ctx.lineTo(px + 14, py + CRUMBLE.h - 2);
          ctx.moveTo(px + 30, py + 1); ctx.lineTo(px + 34, py + 8);
          ctx.lineTo(px + 42, py + CRUMBLE.h - 1);
          ctx.stroke();
        }
        // alerta piscando
        if (CRUMBLE.state <= 2 && Math.floor(frameCount / 6) % 2 === 0) {
          ctx.fillStyle = 'rgba(255,80,60,0.85)';
          ctx.font = fnt(9);
          ctx.textAlign = 'center';
          ctx.fillText(CRUMBLE.state === 1 ? '!' : '!!', px + CRUMBLE.w / 2, py - 4);
          ctx.textAlign = 'left';
        }
      }
    }
    // 🪨 entulho selando a rampa (sem volta)
    if (rampSealed) {
      const rx = RAMP_X0 - 34 - camera.x;
      if (rx > -80 && rx < VW + 80) {
        ctx.fillStyle = '#4a3d32';
        ctx.fillRect(rx, 210, 40, 140);
        ctx.fillStyle = '#5b4c3e';
        for (let i = 0; i < 11; i++)
          ctx.fillRect(rx + 3 + ((i * 13) % 28), 216 + i * 12, 15, 12);
        ctx.fillStyle = '#332b23';
        for (let i = 0; i < 6; i++)
          ctx.fillRect(rx + 8 + ((i * 17) % 22), 230 + i * 20, 8, 7);
      }
    }
    drawAbyss();
  }

  // ══ A MONTANHA = ENTRADA DO COVIL ══
  // Geometria SÓLIDA no mundo (não é fundo). A roda do moinho com
  // correntes marca a entrada da masmorra do Boss.
  function buildMina() {
    const w = MOUNTAIN_X1 - MOUNTAIN_X0;
    const c = document.createElement('canvas');
    c.width = w; c.height = 350;
    const g = c.getContext('2d')!;
    const T = MOUNTAIN_TOP;
    // silhueta ALTA da masmorra
    g.fillStyle = '#463c34';
    g.beginPath();
    g.moveTo(0, 350); g.lineTo(26, 200); g.lineTo(70, 108);
    g.lineTo(140, T + 26); g.lineTo(196, T); g.lineTo(258, T + 34);
    g.lineTo(330, T + 8); g.lineTo(410, 118); g.lineTo(462, 226);
    g.lineTo(w, 350);
    g.closePath(); g.fill();
    // segunda camada (volume)
    g.fillStyle = '#524740';
    g.beginPath();
    g.moveTo(58, 350); g.lineTo(96, 150); g.lineTo(170, T + 46);
    g.lineTo(250, T + 62); g.lineTo(330, 132); g.lineTo(400, 350);
    g.closePath(); g.fill();
    // face rochosa com blocos
    g.fillStyle = '#5d5248';
    g.fillRect(70, 140, w - 150, 210);
    g.fillStyle = '#4a4038';
    for (let ry = 150, row = 0; ry < 344; ry += 24, row++)
      for (let rx = 76; rx < w - 90; rx += 32) g.fillRect(rx + (row % 2 ? 10 : 0), ry, 16, 11);
    g.fillStyle = '#6e6254';
    g.fillRect(70, 140, w - 150, 4);
    // torre de madeira ALTA da roda do moinho
    g.strokeStyle = '#6e4a2a'; g.lineWidth = 8;
    g.beginPath();
    g.moveTo(196, 142); g.lineTo(228, T + 34);
    g.moveTo(272, 142); g.lineTo(248, T + 34);
    g.stroke();
    g.strokeStyle = '#5a3c22'; g.lineWidth = 4;
    for (let ty = T + 60; ty < 140; ty += 30) {
      g.beginPath(); g.moveTo(200, ty); g.lineTo(268, ty + 14); g.stroke();
      g.beginPath(); g.moveTo(268, ty); g.lineTo(200, ty + 14); g.stroke();
    }
    g.fillStyle = '#6e4a2a';
    g.fillRect(188, 136, 92, 10);
    return c;
  }

  function drawMina() {
    const base = Math.round(MOUNTAIN_X0 - camera.x);
    const w = MOUNTAIN_X1 - MOUNTAIN_X0;
    if (base + w < -30 || base > VW + 30) return;
    if (!minaBg) minaBg = buildMina();
    ctx.drawImage(minaBg, base, 0);

    // ── RODA DO MOINHO (entrada da masmorra) — bem no alto ──
    const cx = base + 238, cy = MOUNTAIN_TOP + 30, spin = frameCount * 0.05;
    ctx.fillStyle = '#2e2e2e';
    ctx.beginPath(); ctx.arc(cx, cy, 26, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#7b7b7b'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(cx, cy, 26, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#9a9a9a'; ctx.lineWidth = 3;
    for (let s = 0; s < 4; s++) {
      const a = spin + s * Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx - Math.cos(a) * 22, cy - Math.sin(a) * 22);
      ctx.lineTo(cx + Math.cos(a) * 22, cy + Math.sin(a) * 22);
      ctx.stroke();
    }
    ctx.fillStyle = '#ffd700';
    ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
    // correntes LONGAS descendo da roda
    const sway = Math.sin(frameCount * 0.06) * 4;
    ctx.strokeStyle = '#8a8a8a'; ctx.lineWidth = 2;
    for (const side of [-1, 1]) {
      const chx = cx + side * 26;
      const end = 132;
      for (let ly = cy + 30; ly < end; ly += 9) {
        const off = sway * ((ly - cy - 30) / (end - cy - 30));
        ctx.strokeRect(chx + off - 2, ly, 4, 6);
      }
      ctx.fillStyle = '#6f6f6f';
      ctx.beginPath(); ctx.arc(chx + sway, end + 5, 5, 0, Math.PI * 2); ctx.fill();
    }

    // ── ENTRADA DA MASMORRA ──
    const tx = TUNNEL_X0 - camera.x;
    const tw = TUNNEL_X1 - TUNNEL_X0;
    const mw = MOUTH_X1 - TUNNEL_X0;
    const rockBlocks = (x0: number, y0: number, w: number, y1: number) => {
      ctx.fillStyle = '#3f352c';
      ctx.fillRect(x0, y0, w, y1 - y0);
      ctx.fillStyle = '#332b23';
      for (let ry = y0 + 8, row = 0; ry < y1 - 8; ry += 22, row++)
        for (let rx = 4; rx < w - 10; rx += 30) ctx.fillRect(x0 + rx + (row % 2 ? 9 : 0), ry, 18, 10);
    };

    if (!story.holeOpen) {
      rockBlocks(tx, 140, tw, 350);
      ctx.fillStyle = '#8a2b2b';
      ctx.fillRect(tx + tw / 2 - 34, 244, 68, 26);
      ctx.fillStyle = '#ffd25a';
      ctx.font = fnt(10);
      ctx.textAlign = 'center';
      ctx.fillText('BLOQUEADO', tx + tw / 2, 261);
      ctx.textAlign = 'left';
    } else {
      // escuridão do vão
      ctx.fillStyle = '#08070b';
      ctx.fillRect(tx, MOUTH_TOP, mw, 350 - MOUTH_TOP);
      ctx.fillStyle = '#08070b';
      ctx.fillRect(tx + mw, TUNNEL_TOP, tw - mw, 350 - TUNNEL_TOP);
      // rocha por cima: boca ALTA (entra em pé) e fundo BAIXO (agachado)
      rockBlocks(tx, 140, mw, MOUTH_TOP);
      rockBlocks(tx + mw, 140, tw - mw, TUNNEL_TOP);
      // bordas estilhaçadas
      ctx.fillStyle = '#5b4c3e';
      for (let i = 0; i < mw; i += 16) ctx.fillRect(tx + i, MOUTH_TOP - 4 + ((i * 5) % 7), 10, 5);
      for (let i = 0; i < tw - mw; i += 16) ctx.fillRect(tx + mw + i, TUNNEL_TOP - 4 + ((i * 5) % 7), 10, 5);
      drawGlow('rgba(255,120,0,0.18)', 46, tx + mw / 2, 330);

      if (tunnelCollapsed) {
        ctx.fillStyle = '#4a3d32';
        ctx.fillRect(tx - 20, 240, 46, 110);
        ctx.fillStyle = '#5b4c3e';
        for (let i = 0; i < 8; i++)
          ctx.fillRect(tx - 16 + (i * 11) % 34, 250 + i * 12, 16, 12);
      } else if (player.x < MOUTH_X1 && Math.floor(frameCount / 22) % 2 === 0) {
        ctx.fillStyle = '#ffd700';
        ctx.font = fnt(10);
        ctx.textAlign = 'center';
        ctx.fillText('ENTRE', tx + mw / 2, MOUTH_TOP - 10);
        ctx.fillStyle = '#ff9838';
        ctx.fillText('▼ AGACHE ▼', tx + mw + (tw - mw) / 2, TUNNEL_TOP - 10);
        ctx.textAlign = 'left';
      }
    }
    // vigas de madeira da entrada
    ctx.fillStyle = '#6e4a2a';
    ctx.fillRect(tx - 7, 292, 9, 58);
    ctx.fillRect(tx - 9, 284, 26, 9);
  }

  // ── COVIL (caverna) ─────────────────────────────────────
  function buildCave() {
    const w = CAVE_X1 - CAVE_X0;
    const c = document.createElement('canvas');
    c.width = w; c.height = 350;
    const g = c.getContext('2d')!;
    g.fillStyle = 'rgba(20,14,10,0.72)';
    g.fillRect(0, 0, w, 350);
    g.fillStyle = '#3a2f26';
    g.fillRect(0, 0, w, 70);
    g.fillStyle = '#2c231c';
    for (let x = 0; x < w; x += 34) {
      const jag = 12 + ((x * 2654435761) >>> 28);
      g.beginPath();
      g.moveTo(x, 70); g.lineTo(x + 17, 70 + jag); g.lineTo(x + 34, 70);
      g.closePath(); g.fill();
    }
    // vigas — finas e translúcidas pra lerem como fundo, não como parede
    g.globalAlpha = 0.5;
    for (let x = 40; x < w; x += 190) {
      g.fillStyle = '#6e4a2a'; g.fillRect(x, 88, 7, 262);
      g.fillStyle = '#8a5e36'; g.fillRect(x + 1, 88, 2, 262);
      g.fillStyle = '#6e4a2a'; g.fillRect(x - 18, 76, 44, 8);
    }
    g.globalAlpha = 1;
    // trilhos
    g.fillStyle = '#4a3a2c'; g.fillRect(0, 350 - 4, w, 4);
    for (let x = 6; x < w - 20; x += 26) {
      g.fillStyle = '#2e2218'; g.fillRect(x, 340, 14, 8);
      g.fillStyle = '#6f6f6f'; g.fillRect(x - 4, 341, 22, 2); g.fillRect(x - 4, 346, 22, 2);
    }
    return c;
  }

  function drawCave() {
    const sx = CAVE_X0 - camera.x;
    if (sx + (CAVE_X1 - CAVE_X0) < -20 || sx > VW + 20) return;
    if (!caveBg) caveBg = buildCave();
    ctx.drawImage(caveBg, Math.round(sx), 0);
    // lampiões tremulando
    for (let x = 40; x < CAVE_X1 - CAVE_X0; x += 160) {
      const lx = sx + x + 24;
      if (lx < -30 || lx > VW + 30) continue;
      const flick = 0.45 + 0.3 * Math.sin(frameCount * 0.12 + x);
      ctx.fillStyle = `rgba(255,200,80,${flick.toFixed(2)})`;
      ctx.fillRect(lx - 4, 98, 10, 12);
      ctx.globalAlpha = 0.10 * flick;
      drawGlow('rgba(255,190,90,1)', 52, lx, 104);
      ctx.globalAlpha = 1;
    }
    // correntes penduradas
    ctx.strokeStyle = 'rgba(150,150,150,0.75)';
    ctx.lineWidth = 2;
    for (let x = 100; x < CAVE_X1 - CAVE_X0; x += 118) {
      const cx = sx + x;
      if (cx < -20 || cx > VW + 20) continue;
      const sway = Math.sin(frameCount * 0.045 + x * 0.02) * 4;
      for (let ly = 70; ly < 150; ly += 9) {
        const off = sway * ((ly - 70) / 80);
        ctx.strokeRect(cx + off - 2, ly, 4, 6);
      }
      ctx.fillStyle = '#777';
      ctx.beginPath(); ctx.arc(cx + sway, 156, 5, 0, Math.PI * 2); ctx.fill();
    }
    // soldados caídos do Bobby
    [2900, 2985, 3070, 3190, 3300, 3400].forEach((wx, i) => {
      const x = wx - camera.x;
      if (x < -50 || x > VW + 50) return;
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.translate(x + 16, 344);
      ctx.rotate(-Math.PI / 2);
      drawPixelArt(BOBBY_RUN, 0, ['#5f5f5f', '#2c2c2c', '#8a8a8a', '#7a7a55', '#1f1f1f'], -18, -16, 3, i % 2 === 0);
      ctx.restore();
      ctx.globalAlpha = 1;
    });
  }

  function drawGate() {
    const gx = GATE_X - camera.x;
    if (gx < -80 || gx > VW + 80) return;
    ctx.fillStyle = '#3a2f26';
    ctx.fillRect(gx - 6, 0, GATE_W + 12, 224);
    ctx.fillStyle = '#2c231c';
    ctx.fillRect(gx, 100, GATE_W, 4);
    ctx.fillRect(gx - 3, 140, GATE_W + 6, 4);
    ctx.fillRect(gx, 180, GATE_W, 4);
    if (gateDestroyed) {
      ctx.fillStyle = '#3a2f26'; ctx.fillRect(gx - 4, 320, GATE_W + 8, 30);
      ctx.fillStyle = '#55443a'; ctx.fillRect(gx, 330, 10, 20); ctx.fillRect(gx + 14, 326, 12, 24);
      if (frameCount % 7 === 0) spawnSmoke(GATE_X + 14, 330);
      return;
    }
    ctx.fillStyle = '#555'; ctx.fillRect(gx - 6, 224, GATE_W + 12, 8);
    ctx.fillStyle = '#666'; ctx.fillRect(gx, 230, GATE_W, 120);
    ctx.fillStyle = '#444';
    for (let i = 0; i < 3; i++) ctx.fillRect(gx + 4 + i * 9, 234, 4, 112);
    ctx.fillStyle = '#333';
    ctx.fillRect(gx, 268, GATE_W, 5);
    ctx.fillRect(gx, 300, GATE_W, 5);
    ctx.fillStyle = '#ffd700'; ctx.fillRect(gx + 8, 280, 12, 12);
    ctx.fillStyle = '#b8860b'; ctx.fillRect(gx + 12, 284, 4, 4);
  }

  // ── BASE SECRETA ────────────────────────────────────────
  function drawSecretBase() {
    if (baseAlpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = baseAlpha;
    for (let fx = BASE_X - 40; fx < BASE_X + 300; fx += 18) {
      const fsx = fx - camera.x;
      if (fsx < -20 || fsx > VW + 20) continue;
      ctx.fillStyle = '#8B7355'; ctx.fillRect(fsx, 310, 6, 40);
      ctx.fillStyle = '#A08060'; ctx.fillRect(fsx + 1, 310, 4, 40);
      ctx.fillStyle = '#999'; ctx.fillRect(fsx, 316, 18, 2); ctx.fillRect(fsx, 330, 18, 2);
    }
    const hx = BASE_X + 70 - camera.x;
    if (hx > -120 && hx < VW + 120) {
      ctx.fillStyle = '#5a5a6a'; ctx.fillRect(hx, 290, 70, 60);
      ctx.fillStyle = '#4a4a5a'; ctx.fillRect(hx, 290, 70, 4); ctx.fillRect(hx, 346, 70, 4);
      ctx.fillStyle = '#3a3a4a'; ctx.fillRect(hx - 5, 282, 80, 12);
      ctx.fillStyle = '#333'; ctx.fillRect(hx + 25, 310, 20, 40);
      ctx.fillStyle = '#555'; ctx.fillRect(hx + 27, 312, 16, 36);
      const lp = Math.sin(frameCount * 0.05) * 0.15 + 0.85;
      ctx.fillStyle = '#333'; ctx.fillRect(hx + 8, 300, 14, 12);
      ctx.fillStyle = `rgba(255,255,100,${lp.toFixed(2)})`; ctx.fillRect(hx + 10, 302, 10, 8);
    }
    const tx = ANTENNA_X - camera.x;
    if (tx > -120 && tx < VW + 120) {
      ctx.fillStyle = '#555'; ctx.fillRect(tx - 18, 320, 36, 30);
      ctx.fillStyle = '#666'; ctx.fillRect(tx - 16, 322, 32, 26);
      ctx.fillStyle = '#777'; ctx.fillRect(tx - 6, 200, 12, 120);
      ctx.strokeStyle = '#888'; ctx.lineWidth = 2;
      for (let ty = 200; ty < 320; ty += 20) {
        ctx.beginPath(); ctx.moveTo(tx - 6, ty); ctx.lineTo(tx + 6, ty + 20); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(tx + 6, ty); ctx.lineTo(tx - 6, ty + 20); ctx.stroke();
      }
      ctx.fillStyle = '#999';
      ctx.fillRect(tx - 14, 260, 28, 4); ctx.fillRect(tx - 14, 230, 28, 4); ctx.fillRect(tx - 14, 200, 28, 4);
      ctx.fillStyle = '#bbb'; ctx.beginPath(); ctx.ellipse(tx, 195, 30, 18, 0, Math.PI, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#999'; ctx.beginPath(); ctx.ellipse(tx, 195, 26, 14, 0, Math.PI, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#777'; ctx.beginPath(); ctx.ellipse(tx, 195, 20, 10, 0, Math.PI, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ddd'; ctx.fillRect(tx - 2, 175, 4, 20);
      ctx.fillStyle = '#ff4444'; ctx.fillRect(tx - 3, 172, 6, 6);
      if (Math.floor(frameCount / 20) % 2 === 0) {
        ctx.fillStyle = '#ff0000';
        ctx.beginPath(); ctx.arc(tx, 172, 3, 0, Math.PI * 2); ctx.fill();
      }
      // console da chave
      ctx.fillStyle = '#2f3640'; ctx.fillRect(tx - 34, 306, 22, 44);
      ctx.fillStyle = '#00d1b2'; ctx.fillRect(tx - 30, 312, 14, 10);
      ctx.fillStyle = victoryPhase >= VP_SIGNAL ? '#2ecc71' : '#ffd700';
      ctx.fillRect(tx - 26, 328, 6, 6);
      if (victoryPhase >= VP_SIGNAL && victoryPhase < VP_ROCKET_DOWN) {
        const sa = Math.sin(frameCount * 0.3) * 0.4 + 0.6;
        ctx.strokeStyle = `rgba(0,255,255,${sa.toFixed(2)})`;
        ctx.lineWidth = 3;
        for (let i = 1; i <= 5; i++) {
          ctx.beginPath(); ctx.arc(tx, 185, 35 + i * 20, -Math.PI * 0.8, -Math.PI * 0.2); ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  function drawGoldenKey() {
    if (!goldenKey.active || goldenKey.collected) return;
    const kx = goldenKey.x - camera.x;
    const ky = goldenKey.flying ? goldenKey.y : goldenKey.y + Math.sin(goldenKey.bobT) * 8;
    if (kx < -80 || kx > VW + 80) return;
    drawGlow('rgba(255,215,0,0.7)', 62, kx + 20, ky + 20);
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(kx + 6, ky, 28, 4);
    ctx.fillRect(kx + 2, ky + 4, 4, 16);
    ctx.fillRect(kx + 34, ky + 4, 4, 16);
    ctx.fillRect(kx + 6, ky + 20, 28, 4);
    ctx.fillRect(kx + 16, ky + 24, 8, 20);
    ctx.fillRect(kx + 24, ky + 32, 8, 4);
    ctx.fillRect(kx + 24, ky + 40, 8, 4);
    ctx.fillStyle = '#fff8a0';
    ctx.fillRect(kx + 10, ky + 6, 8, 8);
    if (!goldenKey.flying) {
      ctx.fillStyle = '#ffd700';
      ctx.font = fnt(13);
      ctx.textAlign = 'center';
      ctx.globalAlpha = Math.sin(frameCount * 0.1) * 0.3 + 0.7;
      ctx.fillText('PEGUE A CHAVE!', kx + 20, ky - 16);
      const left = Math.max(0, Math.ceil((600 - keyTimer) / 60));
      ctx.font = fnt(10, false);
      ctx.fillText(`voa até você em ${left}s`, kx + 20, ky - 2);
      ctx.globalAlpha = 1;
      ctx.textAlign = 'left';
    }
  }

  // ── FOGUETE ─────────────────────────────────────────────
  function drawRocket(rx: number, ry: number) {
    if (rocketTakingOff) {
      for (let i = 0; i < 6; i++) {
        const fh = 60 + Math.random() * 80;
        ctx.fillStyle = '#ffdd00';
        ctx.beginPath();
        ctx.moveTo(rx - 15 + i * 7, ry + 95);
        ctx.lineTo(rx - 10 + i * 7, ry + 95 + fh);
        ctx.lineTo(rx - 5 + i * 7, ry + 95);
        ctx.fill();
      }
      ctx.globalAlpha = 0.8;
      for (let i = 0; i < 8; i++) {
        const fh = 40 + Math.random() * 70;
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.moveTo(rx - 20 + i * 6, ry + 95);
        ctx.lineTo(rx - 15 + i * 6, ry + 95 + fh);
        ctx.lineTo(rx - 10 + i * 6, ry + 95);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(rx - 8 + i * 6, ry + 95);
        ctx.lineTo(rx - 5 + i * 6, ry + 95 + 24);
        ctx.lineTo(rx - 2 + i * 6, ry + 95);
        ctx.fill();
      }
    }
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 22, ry + 35); ctx.lineTo(rx + 22, ry + 35); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ff6666';
    ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 10, ry + 20); ctx.lineTo(rx + 10, ry + 20); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#eee'; ctx.fillRect(rx - 22, ry + 35, 44, 55);
    ctx.fillStyle = '#ddd'; ctx.fillRect(rx - 22, ry + 35, 8, 55); ctx.fillRect(rx + 14, ry + 35, 8, 55);
    ctx.fillStyle = '#2176ae'; ctx.fillRect(rx - 22, ry + 48, 44, 8);
    ctx.fillStyle = '#e74c3c'; ctx.fillRect(rx - 22, ry + 70, 44, 6);
    ctx.fillStyle = '#00aaff'; ctx.beginPath(); ctx.arc(rx, ry + 42, 8, 0, Math.PI * 2); ctx.fill();
    if (playerEnteredRocket) {
      ctx.fillStyle = '#00ff88'; ctx.fillRect(rx - 3, ry + 39, 6, 5);
      ctx.fillStyle = '#003311'; ctx.fillRect(rx - 2, ry + 40, 2, 2); ctx.fillRect(rx + 1, ry + 40, 2, 2);
    } else {
      ctx.fillStyle = '#88ddff'; ctx.beginPath(); ctx.arc(rx - 2, ry + 40, 4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#555'; ctx.fillRect(rx - 18, ry + 90, 36, 8);
    ctx.fillStyle = '#333'; ctx.fillRect(rx - 14, ry + 94, 28, 4);
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath(); ctx.moveTo(rx - 22, ry + 70); ctx.lineTo(rx - 40, ry + 98); ctx.lineTo(rx - 22, ry + 95); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(rx + 22, ry + 70); ctx.lineTo(rx + 40, ry + 98); ctx.lineTo(rx + 22, ry + 95); ctx.closePath(); ctx.fill();
    if (!rocketTakingOff) {
      ctx.fillStyle = '#777';
      ctx.fillRect(rx - 35, ry + 94, 8, 10); ctx.fillRect(rx + 27, ry + 94, 8, 10);
      ctx.fillRect(rx - 38, ry + 102, 14, 3); ctx.fillRect(rx + 24, ry + 102, 14, 3);
    }
    ctx.fillStyle = '#ffd700';
    ctx.font = fnt(13);
    ctx.textAlign = 'center';
    ctx.fillText('M', rx, ry + 85);
    ctx.textAlign = 'left';
  }

  // ── ITENS ───────────────────────────────────────────────
  // 🎆 FOGUETINHO VERMELHO (munição de bomba) — de propósito BEM diferente
  // do foguete-nave que resgata o Bobby no final. Este é tipo um rojão.
  function drawRocketItem(sx: number, y: number, pulse: number) {
    ctx.save();
    ctx.translate(sx + 15, y + 17);
    ctx.rotate(Math.sin(frameCount * 0.05) * 0.18);
    ctx.scale(pulse, pulse);
    // vareta do rojão
    ctx.fillStyle = '#8a6a3a';
    ctx.fillRect(-1.5, 6, 3, 16);
    // corpo
    ctx.fillStyle = '#e0342b';
    ctx.fillRect(-7, -8, 14, 15);
    ctx.fillStyle = '#ff6a5e';
    ctx.fillRect(-7, -8, 4, 15);
    // faixas
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(-7, -3, 14, 2);
    ctx.fillRect(-7, 2, 14, 2);
    // ogiva
    ctx.fillStyle = '#b02020';
    ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(-7, -8); ctx.lineTo(7, -8); ctx.closePath(); ctx.fill();
    // faísca
    const fl = 4 + Math.abs(Math.sin(frameCount * 0.5)) * 6;
    ctx.fillStyle = '#ffe066';
    ctx.beginPath(); ctx.arc(0, 22 + fl * 0.2, 2.5 + fl * 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawCollectibles() {
    coins.forEach((coin, idx) => {
      if (coin.collected) return;
      const sx = coin.x - camera.x;
      if (sx + coin.w < -40 || sx > VW + 40) return;
      const cxm = sx + coin.w / 2, cym = coin.y + coin.h / 2;
      if (coin.type === 'coin') {
        drawGlow('rgba(255,215,0,0.4)', 30, cxm, cym);
        drawPixelArt(COIN_FRAMES, Math.floor((frameCount + idx * 7) / 7), PAL_COIN, sx, coin.y, PIXEL, false);
      } else {
        drawGlow('rgba(255,136,0,0.5)', 46, cxm, cym);
        ctx.save();
        ctx.translate(cxm, cym);
        ctx.rotate((frameCount + idx * 10) * 0.02);
        drawPixelArt(STAR_FRAMES, 0, PAL_STAR, -coin.w / 2, -coin.h / 2, PIXEL, false);
        ctx.restore();
      }
    });
    for (const h of hearts) {
      if (h.collected) continue;
      const sx = h.x - camera.x;
      if (sx < -50 || sx > VW + 50) continue;
      const pulse = Math.sin(frameCount * 0.1) * 0.18 + 1;
      drawGlow('rgba(255,0,102,0.5)', 44, sx + 18, h.y + 18);
      ctx.save();
      ctx.translate(sx + 18, h.y + 18);
      ctx.scale(pulse, pulse);
      drawPixelArt(HEALTH_FRAMES, 0, PAL_HEALTH, -18, -18, PIXEL, false);
      ctx.restore();
    }
    for (const r of rockets) {
      if (r.collected) continue;
      const sx = r.x - camera.x;
      if (sx < -50 || sx > VW + 50) continue;
      drawGlow('rgba(231,76,60,0.45)', 42, sx + 15, r.y + 17);
      drawRocketItem(sx, r.y, Math.sin(frameCount * 0.09) * 0.12 + 1);
      ctx.fillStyle = '#ff9a8a';
      ctx.font = fnt(9);
      ctx.textAlign = 'center';
      ctx.fillText('BOMBA ½', sx + 15, r.y - 8);
      ctx.textAlign = 'left';
    }
    if (!shieldItem.collected) {
      const sx = shieldItem.x - camera.x;
      if (sx > -50 && sx < VW + 50) {
        const pulse = Math.sin(frameCount * 0.08) * 0.15 + 1;
        ctx.save();
        ctx.translate(sx + 15, shieldItem.y + 15);
        ctx.scale(pulse, pulse);
        ctx.fillStyle = '#0088ff'; ctx.fillRect(-12, -12, 24, 24);
        ctx.fillStyle = '#00aaff'; ctx.fillRect(-10, -10, 20, 20);
        ctx.fillStyle = '#fff'; ctx.fillRect(-4, -8, 8, 4); ctx.fillRect(-2, -4, 4, 12);
        ctx.restore();
      }
    }
    if (superAmmo.spawned && !superAmmo.collected) {
      const sx = superAmmo.x - camera.x;
      if (sx > -50 && sx < VW + 50) {
        drawGlow('rgba(0,255,255,0.6)', 54, sx + 18, superAmmo.y + 18);
        ctx.save();
        ctx.translate(sx + 18, superAmmo.y + 18);
        ctx.scale(Math.sin(frameCount * 0.15) * 0.25 + 1, Math.sin(frameCount * 0.15) * 0.25 + 1);
        ctx.rotate(frameCount * 0.05);
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
      if (sx + e.w < -40 || sx > VW + 40) return;
      e.timer++;
      if (e.timer % 14 === 0) e.frame = (e.frame + 1) % 2;
      if (Math.abs(player.x - e.x) < 200 && victoryPhase === VP_NONE) {
        ctx.fillStyle = 'rgba(255,0,0,0.7)';
        ctx.beginPath(); ctx.arc(sx + e.w / 2, e.y + 8, 4, 0, Math.PI * 2); ctx.fill();
      }
      if (e.stompCount >= 1) ctx.globalAlpha = 0.6 + Math.sin(frameCount * 0.3) * 0.2;
      drawPixelArt(ENEMY_FRAMES, e.frame, PAL_ENEMY, sx, e.y, PIXEL, e.dir === -1);
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(sx + 4, e.y + e.h, e.w - 8, 4);
    });
  }

  function drawBoss() {
    if (!boss.active || boss.hidden) return;
    const sx = boss.x - camera.x;
    if (sx < -140 || sx > VW + 140) return;
    if (boss.defeated) {
      const pal = Math.floor(frameCount / 3) % 2 === 0 ? PAL_MECHA_BURN_A : PAL_MECHA_BURN_B;
      ctx.globalAlpha = Math.max(0.35, 1 - boss.burnT / 500);
      drawPixelArt(MECHA, Math.floor(frameCount / 5), pal, sx, boss.y, PIXEL, boss.dir === 1);
      ctx.globalAlpha = 1;
      return;
    }
    boss.timer++;
    if (boss.timer % 12 === 0) boss.frame = (boss.frame + 1) % 2;
    const rage = boss.hp <= boss.maxHp * 0.4;
    const pal = boss.hurtFlash > 0 && frameCount % 4 < 2 ? PAL_MECHA_BURN_A : (rage && Math.floor(frameCount / 6) % 2 === 0 ? PAL_MECHA_RAGE : PAL_MECHA);
    drawPixelArt(MECHA, boss.frame, pal, sx, boss.y, PIXEL, boss.dir === 1);
    // 🎯 VISOR = ponto fraco (pisca marcando o alvo)
    const vp = 0.45 + Math.abs(Math.sin(frameCount * 0.12)) * 0.5;
    ctx.strokeStyle = `rgba(255,215,0,${vp.toFixed(2)})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(sx + 7, boss.y + 8, boss.w - 14, 14);
    ctx.fillStyle = `rgba(255,60,60,${(vp * 0.35).toFixed(2)})`;
    ctx.fillRect(sx + 8, boss.y + 9, boss.w - 16, 12);
    // propulsores (ponto fraco secundário)
    const tp = boss.stagger > 0 ? 0.2 : 0.45 + Math.random() * 0.4;
    ctx.fillStyle = `rgba(255,150,0,${tp.toFixed(2)})`;
    ctx.fillRect(sx + 20, boss.y + boss.h - 2, 7, 6 + Math.random() * 8);
    ctx.fillRect(sx + 34, boss.y + boss.h - 2, 7, 6 + Math.random() * 8);
    ctx.strokeStyle = `rgba(255,140,40,${(vp * 0.7).toFixed(2)})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(sx + 17, boss.y + boss.h - 6, 28, 8);
    // barra de vida
    const barW = 96, barH = 9;
    const bx = sx + boss.w / 2 - barW / 2;
    ctx.fillStyle = '#221';
    ctx.fillRect(bx - 2, boss.y - 24, barW + 4, barH + 4);
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(bx, boss.y - 22, barW, barH);
    const hpR = Math.max(0, boss.hp / boss.maxHp);
    ctx.fillStyle = hpR > 0.5 ? '#2ecc71' : hpR > 0.25 ? '#ffd700' : '#e74c3c';
    ctx.fillRect(bx, boss.y - 22, barW * hpR, barH);
    ctx.fillStyle = '#ff5555';
    ctx.font = fnt(11);
    ctx.textAlign = 'center';
    ctx.fillText('SOCRAM', sx + boss.w / 2, boss.y - 28);
    ctx.textAlign = 'left';
  }

  function drawBullets() {
    bullets.forEach((b) => {
      const sx = b.x - camera.x;
      if (sx < -20 || sx > VW + 20) return;
      drawPixelArt(BULLET_FRAMES, 0, PAL_ENEMY, sx, b.y, 2, false);
    });
    playerBullets.forEach((b) => {
      const sx = b.x - camera.x;
      if (sx < -20 || sx > VW + 20) return;
      ctx.save();
      ctx.translate(sx + b.w / 2, b.y + b.h / 2);
      ctx.rotate(Math.atan2(b.vy, b.vx));
      if (b.isSuper) {
        ctx.fillStyle = '#00ffff';
        ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 14;
        ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
        ctx.fillStyle = '#fff';
        ctx.fillRect(-b.w / 2 + 2, -b.h / 2 + 1, b.w - 4, b.h - 2);
      } else {
        ctx.fillStyle = '#00ff66';
        ctx.shadowColor = '#00ff66'; ctx.shadowBlur = 8;
        ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
      }
      ctx.shadowBlur = 0;
      ctx.restore();
    });
    bombs.forEach((b) => {
      const sx = b.x - camera.x;
      if (sx < -30 || sx > VW + 30) return;
      ctx.fillStyle = '#1c1c22';
      ctx.beginPath(); ctx.arc(sx, b.y, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3a3a45';
      ctx.beginPath(); ctx.arc(sx - 3, b.y - 3, 3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(sx + 4, b.y - 7); ctx.lineTo(sx + 9, b.y - 14); ctx.stroke();
      ctx.fillStyle = Math.floor(frameCount / 3) % 2 ? '#ffd700' : '#ff6600';
      ctx.beginPath(); ctx.arc(sx + 10, b.y - 15, 3.5, 0, Math.PI * 2); ctx.fill();
    });
  }

  function drawPlayer() {
    if (phase === 'DEFEAT' || playerEnteredRocket) return;
    const sx = player.x - camera.x;
    // ✅ fumacinha com 1 vida
    if (player.lives === 1 && frameCount % 8 === 0 && victoryPhase === VP_NONE)
      spawnSmoke(player.x + player.w / 2, player.y + player.h - 6);
    if (player.hasShield) {
      ctx.strokeStyle = `rgba(0,136,255,${(0.5 + Math.sin(frameCount * 0.2) * 0.3).toFixed(2)})`;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(sx + player.w / 2, player.y + player.h / 2, player.w, 0, Math.PI * 2); ctx.stroke();
    }
    if (player.invulnerable && Math.floor(frameCount / 4) % 2 === 0) ctx.globalAlpha = 0.32;
    const isShooting = player.shooting || vkeys.shoot || Math.hypot(axAim.x, axAim.y) > 0.22;
    let frame: number;
    if (victoryPhase >= VP_WALK_BASE) frame = (Math.floor(frameCount / 8) % 2) + 1;
    else if (player.crouching) frame = 4;
    else if (!player.onGround) frame = 3;
    // 🦵 atirando ANDANDO → pernas continuam animando
    else if (player.moving) frame = (Math.floor(frameCount / 7) % 2) + 1;
    else if (isShooting) frame = 5;
    else frame = 0;
    const pal = player.lives >= 3 ? PAL_HERO_3 : player.lives === 2 ? PAL_HERO_2 : PAL_HERO_1;
    const frames = player.lives >= 3 ? HERO_FRAMES : HERO_FRAMES_DMG;
    const spriteY = player.y + player.h - PH;
    drawPixelArt(frames, frame, pal, sx, spriteY, PIXEL, player.dir === -1);
    ctx.globalAlpha = 1;
    if (victoryPhase < VP_WALK_BASE) {
      const gx = player.dir === 1 ? sx + player.w - 5 : sx - 3;
      ctx.fillStyle = player.lives === 1 ? '#444' : '#666';
      ctx.fillRect(gx, spriteY + 12, 8, 4);
      // 💥 clarão do cano logo após o disparo
      if (isShooting && player.shootCooldown > 8) {
        const mx = player.dir === 1 ? gx + 9 : gx - 1;
        ctx.fillStyle = '#fff6c0';
        ctx.beginPath(); ctx.arc(mx, spriteY + 14, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,190,60,0.75)';
        ctx.beginPath(); ctx.arc(mx, spriteY + 14, 8, 0, Math.PI * 2); ctx.fill();
      }
    }
    if (player.hasSuperAmmo) {
      ctx.fillStyle = '#00ffff';
      ctx.font = fnt(10);
      ctx.textAlign = 'center';
      ctx.fillText(`SUPER x${player.superShots}`, sx + player.w / 2, player.y - 10);
      ctx.textAlign = 'left';
    }
    if (goldenKey.collected && victoryPhase >= VP_WALK_BASE && victoryPhase <= VP_CONSOLE) {
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(sx + player.w + 2, spriteY + 10, 8, 12);
      ctx.fillStyle = '#fff8a0';
      ctx.fillRect(sx + player.w + 3, spriteY + 11, 4, 4);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(sx + 4, player.y + player.h, player.w - 8, 4);
  }

  function drawHeart(x: number, y: number, s: number, filled: boolean) {
    ctx.fillStyle = filled ? '#ff0066' : '#3a3a44';
    ctx.fillRect(x + 1 * s, y, 2 * s, s); ctx.fillRect(x + 4 * s, y, 2 * s, s);
    ctx.fillRect(x, y + 1 * s, 7 * s, s); ctx.fillRect(x, y + 2 * s, 7 * s, s);
    ctx.fillRect(x + 1 * s, y + 3 * s, 5 * s, s); ctx.fillRect(x + 2 * s, y + 4 * s, 3 * s, s);
    ctx.fillRect(x + 3 * s, y + 5 * s, 1 * s, s);
    if (filled) { ctx.fillStyle = '#ff88aa'; ctx.fillRect(x + 1 * s, y + 1 * s, s, s); }
  }

  function drawHUD() {
    ctx.fillStyle = linGrad('hud', 0, 0, 0, HUD_H, [[0, '#1a1a2e'], [1, '#16213e']]);
    ctx.fillRect(0, 0, VW, HUD_H);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, HUD_H); ctx.lineTo(VW, HUD_H); ctx.stroke();

    const danger = timeLeft < 30;
    const hs = compact ? 2 : 3;

    // ── linha 1: corações à esquerda, tempo à direita ──
    for (let i = 0; i < player.maxLives; i++)
      drawHeart(12 + i * (8 * hs + 5), 8, hs, i < player.lives);

    ctx.textAlign = 'right';
    ctx.fillStyle = danger && Math.floor(frameCount / 10) % 2 === 0 ? '#ffff00' : danger ? '#ff4444' : '#00ff88';
    ctx.font = fnt(compact ? 20 : 22);
    ctx.fillText(`${Math.ceil(timeLeft)}s`, VW - 12, 26);

    // ── linha 2: pontos | moedas | bombas ──
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    ctx.font = fnt(compact ? 16 : 19);
    ctx.fillText(String(score), 12, 50);

    const coinX = 12 + (compact ? 62 : 84);
    ctx.fillStyle = '#ffd700';
    ctx.beginPath(); ctx.arc(coinX, 44, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b8860b';
    ctx.beginPath(); ctx.arc(coinX, 44, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffe680';
    ctx.font = fnt(compact ? 11 : 13);
    ctx.fillText(`${player.coinsCollected % 10}/10`, coinX + 10, 49);

    // bombas + progresso do próximo foguete
    ctx.textAlign = 'right';
    ctx.fillStyle = player.bombs > 0 ? '#ff9838' : '#5a5a66';
    ctx.font = fnt(compact ? 12 : 14);
    ctx.fillText(`BOMBA x${player.bombs}`, VW - 12, 49);
    const rw = compact ? 46 : 60;
    ctx.fillStyle = 'rgba(231,76,60,0.3)';
    ctx.fillRect(VW - 12 - rw, 53, rw, 3);
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(VW - 12 - rw, 53, rw * ((player.rockets % 2) / 2), 3);

    // ── barra de progresso do nível (centro) ──
    const barW = compact ? 130 : 230;
    const barX = VW / 2 - barW / 2;
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(barX, 20, barW, 5);
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(barX, 20, barW * Math.min(1, player.x / (LEVEL_WIDTH - PW)), 5);
    ctx.fillStyle = boss.defeated ? '#555' : '#ff5555';
    ctx.fillRect(barX + barW * (BOSS_MIN / LEVEL_WIDTH) - 2, 15, 4, 11);
    ctx.fillStyle = '#5bc8f5';
    ctx.fillRect(barX + barW * Math.min(1, player.x / (LEVEL_WIDTH - PW)) - 2, 16, 4, 11);
    ctx.textAlign = 'left';
  }

  // ── TELAS ───────────────────────────────────────────────
  function drawLoading() {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, VW, H);
    ctx.fillStyle = 'rgba(0,255,0,0.03)';
    for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, VW, 2);
    ctx.fillStyle = '#00ff44';
    ctx.font = fnt(28);
    ctx.textAlign = 'center';
    ctx.shadowColor = '#00ff44'; ctx.shadowBlur = 15;
    ctx.fillText('BOBBY IA', VW / 2, 120);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#00aa33';
    ctx.font = fnt(15, false);
    ctx.fillText('Portfolio do Marcão', VW / 2, 150);
    const bx = VW * 0.22 + loadProgress * (VW * 0.5) / 100;
    const bf = Math.floor(frameCount / 6) % 3;
    for (let i = 3; i >= 1; i--) {
      ctx.globalAlpha = 0.3 / i;
      drawPixelArt(BOBBY_RUN, (bf + i) % 3, PAL_BOBBY, bx - i * 25, 220, 4, false);
    }
    ctx.globalAlpha = 1;
    drawPixelArt(BOBBY_RUN, bf, PAL_BOBBY, bx, 220, 4, false);
    const barX = VW * 0.19, barY = 300, barW = VW * 0.62, barH = 25;
    ctx.strokeStyle = '#00ff44'; ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barW, barH);
    ctx.fillStyle = '#00c236';
    ctx.fillRect(barX + 2, barY + 2, Math.max(0, barW * (loadProgress / 100) - 4), barH - 4);
    ctx.fillStyle = '#00ff44';
    ctx.font = fnt(15);
    ctx.fillText(`${Math.floor(loadProgress)}%`, VW / 2, barY + barH + 30);
    ctx.textAlign = 'left';
  }

  function drawIntro() {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, VW, H);
    ctx.fillStyle = 'rgba(0,255,0,0.03)';
    for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, VW, 2);
    ctx.strokeStyle = '#00ff44'; ctx.lineWidth = 2;
    ctx.strokeRect(22, 16, VW - 44, H - 32);
    ctx.fillStyle = '#002211';
    ctx.fillRect(23, 17, VW - 46, 30);
    ctx.fillStyle = '#00ff44';
    ctx.font = fnt(13);
    ctx.textAlign = 'center';
    ctx.fillText('[ BOBBY IA — TERMINAL v7.0 ]', VW / 2, 38);
    drawPixelArt(BOBBY_FACE, Math.floor(frameCount / 10), PAL_BOBBY, 46, 64, 4, false);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#00ff44';
    ctx.font = fnt(17);
    ctx.fillText('Bobby IA', 130, 90);
    ctx.fillStyle = '#00893a';
    ctx.font = fnt(11, false);
    ctx.fillText('Sistema Semântico v7.0', 130, 110);
    ctx.fillText('Criado por Marcos Eduardo', 130, 127);
    ctx.strokeStyle = '#004422'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(40, 148); ctx.lineTo(VW - 40, 148); ctx.stroke();

    const visible = introSkipped ? INTRO_TEXT : INTRO_TEXT.substring(0, introCharIndex);
    ctx.fillStyle = '#3dff77';
    ctx.font = fnt(14, false);
    const maxWidth = VW - 90;
    let line = '';
    let lineY = 176;
    const lh = Math.round(19 * uiScale);
    for (const word of visible.split(' ')) {
      const test = line + word + ' ';
      if (ctx.measureText(test).width > maxWidth) { ctx.fillText(line, 45, lineY); line = word + ' '; lineY += lh; }
      else line = test;
    }
    ctx.fillText(line, 45, lineY);
    if ((!introComplete && !introSkipped) || Math.floor(frameCount / 15) % 2 === 0)
      ctx.fillRect(45 + ctx.measureText(line).width, lineY - 12, 10, 15);

    ctx.textAlign = 'center';
    if (introComplete || introSkipped) {
      ctx.globalAlpha = Math.sin(frameCount * 0.08) * 0.3 + 0.7;
      ctx.fillStyle = '#00ff44';
      ctx.font = fnt(17);
      ctx.fillText('[ ESPAÇO / TOQUE PARA COMEÇAR ]', VW / 2, H - 42);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = '#00893a';
      ctx.font = fnt(12, false);
      ctx.fillText('[ ENTER / TOQUE PARA PULAR ]', VW / 2, H - 42);
    }
    ctx.textAlign = 'left';
  }

  function drawVictoryOverlay() {
    if (victoryPhase === VP_CONSOLE) {
      const tx = ANTENNA_X - camera.x;
      const prog = Math.min(1, cutsceneTimer / 60);
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(tx - 30 + prog * 4, 312, 8 * (1 - prog * 0.5), 12);
      if (cutsceneTimer > 50 && cutsceneTimer % 5 === 0) spawnParticles(ANTENNA_X - 24, 318, ['#ffd700', '#fff'], 5);
    }
    if (victoryPhase >= VP_ROCKET_DOWN && victoryPhase <= VP_TAKEOFF) drawRocket(ROCKET_X - camera.x, rocketY);
    if (victoryPhase === VP_BOSS_DEATH) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff8800';
      ctx.font = fnt(15);
      ctx.globalAlpha = 0.85;
      ctx.fillText('SOCRAM ESTÁ CAINDO…', VW / 2, 96);
      ctx.globalAlpha = 1;
      ctx.textAlign = 'left';
    }
  }

  function drawVictoryScreen() {
    ctx.fillStyle = 'rgba(0,0,0,0.86)';
    ctx.fillRect(0, 0, VW, H);
    for (let i = 0; i < 8; i++) {
      const fx = VW * 0.1 + i * (VW * 0.11);
      const fy = 70 + Math.sin(frameCount * 0.08 + i) * 40;
      ctx.fillStyle = ['#ff0066', '#ffd700', '#00ff88', '#00aaff', '#ff8800', '#ff00ff', '#00ffff', '#ffff00'][i];
      ctx.globalAlpha = 0.3 + Math.sin(frameCount * 0.1 + i) * 0.2;
      ctx.beginPath(); ctx.arc(fx, fy, 15 + Math.sin(frameCount * 0.15 + i) * 10, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';

    // ── 🏆 MODAL organizado (igual ao da derrota) ──
    const flaw = player.flawless;
    const pw = Math.min(430, VW * 0.82);
    const ph = flaw ? 260 : 236;
    const px = VW / 2 - pw / 2;
    const py = Math.max(46, H / 2 - ph / 2 - 8);
    ctx.fillStyle = '#12241a';
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = '#2ecc71';
    ctx.lineWidth = 4;
    ctx.strokeRect(px, py, pw, ph);
    ctx.strokeStyle = 'rgba(255,215,0,0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 6, py + 6, pw - 12, ph - 12);

    let y = py + 46;
    ctx.fillStyle = '#2ecc71';
    ctx.font = fnt(34);
    ctx.shadowColor = '#2ecc71'; ctx.shadowBlur = 16;
    ctx.fillText('VITÓRIA!', VW / 2, y);
    ctx.shadowBlur = 0;

    y += 22;
    drawPixelArt(BOBBY_FACE, Math.floor(frameCount / 15), PAL_BOBBY, VW / 2 - 34, y, 4, false);
    y += 62;

    ctx.fillStyle = '#ffd700';
    ctx.font = fnt(13, false);
    ctx.fillText('Socram caiu. A mina está livre.', VW / 2, y);

    y += 26;
    ctx.fillStyle = '#fff';
    ctx.font = fnt(19);
    ctx.fillText(`${score} PONTOS`, VW / 2, y);

    if (flaw) {
      y += 22;
      ctx.globalAlpha = Math.sin(frameCount * 0.08) * 0.25 + 0.75;
      ctx.fillStyle = '#ffd700';
      ctx.font = fnt(12);
      ctx.fillText('🏆 PERFEITO — SEM DANO · +1000', VW / 2, y);
      ctx.globalAlpha = 1;
    }
    if (score >= highScore && score > 0) {
      y += 20;
      ctx.fillStyle = '#ffe680';
      ctx.font = fnt(12);
      ctx.fillText('★ NOVO RECORDE ★', VW / 2, y);
    }

    y = py + ph - 20;
    ctx.globalAlpha = Math.sin(frameCount * 0.1) * 0.3 + 0.7;
    ctx.fillStyle = '#ffd700';
    ctx.font = fnt(12);
    ctx.fillText('[ ESPAÇO / TOQUE ] JOGAR DE NOVO', VW / 2, y);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }

  function drawDefeat() {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, VW, H);
    const sx = deathPos.x - camera.x;
    if (defeatPhase < 2) {
      drawPixelArt(KNEEL_FRAMES, 0, PAL_HERO_1, sx, deathPos.y + PH - 42, PIXEL, player.dir === -1);
      enemies.forEach((e) => {
        const esx = e.x - camera.x;
        if (esx > -50 && esx < VW + 50) drawPixelArt(ENEMY_FRAMES, 0, PAL_ENEMY, esx, e.y, PIXEL, deathPos.x < e.x);
      });
    }
    defeatExplosions.forEach((exp) => {
      ctx.globalAlpha = Math.max(0, exp.life / 30);
      ctx.fillStyle = exp.life % 4 < 2 ? '#ff6600' : '#ffaa00';
      ctx.beginPath(); ctx.arc(exp.x - camera.x, exp.y, exp.size, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    if (defeatPhase === 2) {
      ctx.globalAlpha = Math.max(0, 1 - defeatTimer / 60);
      ctx.fillStyle = '#ff4400';
      ctx.beginPath(); ctx.arc(sx + PW / 2, deathPos.y + PH / 2, defeatTimer * 5, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (defeatPhase >= 3) {
      const pw = Math.min(440, VW * 0.62), ph = 190;
      const px = VW / 2 - pw / 2, py = defeatSignY;
      ctx.fillStyle = '#2c2c2c';
      ctx.fillRect(px, py, pw, ph);
      ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 4;
      ctx.strokeRect(px, py, pw, ph);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#e74c3c';
      ctx.font = fnt(26);
      ctx.shadowColor = '#e74c3c'; ctx.shadowBlur = 10;
      ctx.fillText('VOCÊ FOI DERROTADO', VW / 2, py + 50);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff';
      ctx.font = fnt(15, false);
      ctx.fillText(`Pontuação: ${score}`, VW / 2, py + 88);
      if (defeatPhase >= 4) {
        ctx.globalAlpha = Math.sin(frameCount * 0.1) * 0.3 + 0.7;
        ctx.fillStyle = '#ffd700';
        ctx.font = fnt(15);
        ctx.fillText('[ ESPAÇO / TOQUE PARA TENTAR DE NOVO ]', VW / 2, py + 130);
        ctx.globalAlpha = 1;
      }
      ctx.textAlign = 'left';
    }
  }

  function drawPauseOverlay() {
    ctx.fillStyle = 'rgba(0,0,20,0.62)';
    ctx.fillRect(0, 0, VW, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.font = fnt(34);
    ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 12;
    ctx.fillText('PAUSADO', VW / 2, H / 2 - 8);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = fnt(13, false);
    ctx.fillText('[ P ] continuar', VW / 2, H / 2 + 24);
    ctx.textAlign = 'left';
  }

  // ═══════════ LOOP ═══════════
  function update() {
    frameCount++;
    if (screenShake > 0) screenShake = Math.max(0, screenShake - 0.3);

    if (phase === 'LOADING') {
      loadProgress += 0.55;
      if (loadProgress >= 100) { loadProgress = 100; phase = 'INTRO'; emit('state', phase); audio.boot(); }
      return;
    }
    if (phase === 'INTRO') {
      introTimer++;
      if (!introComplete && !introSkipped) {
        if (introTimer % 2 === 0 && introCharIndex < INTRO_TEXT.length) {
          introCharIndex++;
          if (introTimer % 6 === 0) audio.type();
        }
        if (introCharIndex >= INTRO_TEXT.length) introComplete = true;
      }
      return;
    }
    if (phase === 'DEFEAT') {
      updateDefeat(); updateParticles(); updateSmoke(); updateFloatTexts();
      return;
    }
    if (phase === 'VICTORY') { updateParticles(); return; }

    // GAME
    updateParticles();
    updateSmoke();
    updateFloatTexts();
    updateBooms();
    updateCoinDrops();
    updateFleeing();
    updateCrumble();
    updateImpacts();

    if (story.active) {
      story.update();
      // 🎥 a câmera PANORAMIZA no próprio mapa (não troca de cenário)
      const target = Math.max(0, Math.min(LEVEL_WIDTH - VW, story.cameraFocus - VW / 2));
      camera.x += (target - camera.x) * 0.08;
      return;
    }
    if (victoryPhase !== VP_NONE) updateVictory();
    if (victoryPhase <= VP_KEY) {
      updatePlayer();
      if (phase !== 'GAME') return;
      updateEnemies();
      updateBoss();
      updateBullets();
      checkCollections();
      if (victoryPhase === VP_NONE) updateCamera();
      updateTimer();
    }
  }

  function render() {
    ctx.save();
    if (screenShake > 0) ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);

    if (phase === 'LOADING') drawLoading();
    else if (phase === 'INTRO') drawIntro();
    else if (phase === 'VICTORY') { drawBackground(); drawParticles(); drawVictoryScreen(); }
    else {
      drawBackground();
      drawMina();
      drawCave();
      drawPlatforms();
      drawGate();
      drawSecretBase();
      drawSmoke();
      drawParticles();
      drawImpacts();
      drawCollectibles();
      drawCoinDrops();
      drawGoldenKey();
      drawBullets();
      drawEnemies();
      drawBoss();
      drawPlayer();
      story.drawWorld();
      drawBooms();
      if (phase === 'GAME' && victoryPhase !== VP_NONE) drawVictoryOverlay();
      drawFloatTexts();
      if (flashT > 0) {
        ctx.fillStyle = `rgba(255,240,200,${(flashT / 14).toFixed(2)})`;
        ctx.fillRect(0, 0, VW, H);
      }
      if (phase === 'DEFEAT') drawDefeat();
      else if (story.active) story.drawUI();
      else {
        drawHUD();
        if (paused) drawPauseOverlay();
      }
    }
    ctx.restore();
  }

  let last = performance.now();
  let acc = 0;
  function frame(now: number) {
    if (destroyed) return;
    raf = requestAnimationFrame(frame);
    acc += Math.min(120, now - last);
    last = now;
    let steps = 0;
    while (acc >= STEP && steps < 4) {
      if (!paused || phase === 'LOADING' || phase === 'INTRO') update();
      acc -= STEP;
      steps++;
    }
    render();
  }

  function togglePause() {
    if (phase !== 'GAME') return;
    paused = !paused;
    audio.pause();
    emit('paused', paused);
  }
  function toggleMute() {
    audio.muted = !audio.muted;
    try { localStorage.setItem('bobby-muted', audio.muted ? '1' : '0'); } catch { /* noop */ }
    emit('muted', audio.muted);
  }
  try { if (localStorage.getItem('bobby-muted') === '1') audio.muted = true; } catch { /* noop */ }

  buildCollectibles();
  enemies = enemiesData.map(spawnEnemy);
  // buffer correto ANTES do primeiro frame
  canvas.width = VW;
  canvas.height = H;
  ctx.imageSmoothingEnabled = false;
  raf = requestAnimationFrame(frame);
  emit('state', phase);
  emit('muted', audio.muted);

  return {
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    },
    input(key, down) {
      audio.unlock();
      if (paused) return;
      vkeys[key] = down;
      if (key === 'jump' && down && phase === 'GAME' && !story.active && victoryPhase <= VP_KEY) queueJump();
    },
    setAxis(side, x, y) {
      if (side === 'move') { axMove.x = x; axMove.y = y; }
      else { axAim.x = x; axAim.y = y; }
    },
    primary() { if (!paused) handleConfirmPress(); },
    togglePause,
    toggleMute,
    restart: restartGame,
    // Desktop: 800×450 (16:9). Celular: 450×450 (quadrado 1:1).
    // IMPORTANTE: o buffer do canvas é SEMPRE reaplicado — se ficar
    // condicional, o canvas herda o default 300×150 e tudo vira zoom.
    resize(_cssW: number, _cssH: number, mobile: boolean) {
      const target = mobile ? 450 : 800;
      const changed = target !== VW || canvas.width !== target || canvas.height !== H;
      VW = target;
      uiScale = mobile ? 0.82 : 1;
      compact = mobile;
      if (changed) {
        canvas.width = VW;
        canvas.height = H;
        ctx.imageSmoothingEnabled = false;
        clearCaches();
        camera.x = Math.max(0, Math.min(LEVEL_WIDTH - VW, camera.x));
      }
    },
  };
}
