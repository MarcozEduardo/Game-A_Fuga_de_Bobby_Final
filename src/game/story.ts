// ═══════════════════════════════════════════════════════════════
//  "SOCRAM ESTÁ NOS MATANDO"
//
//  ⚠️ SEM FUNDO FALSO. Zero overlay. Tudo acontece no cenário real
//  do jogo — a câmera só panoramiza até a frente da masmorra.
//
//  Roteiro:
//   • Bobby pisa no nome, anda ~1s → alarme
//   • Robô laranja chega correndo: "Bobby, o caminho é por aqui!"
//   • Chega o quebrado, fumaçando: "Socram… está nos matando!"
//   • O quebrado EXPLODE — sobra a cabecinha com X nos olhos (fica no mapa)
//   • PAN até a masmorra: 4 presos jogam PEDRA no Socram
//   • Socram ATIRA (o tiro original dele) e mata os 3 mais perto.
//     Os CORPOS FICAM no chão.
//   • O 4º vê os corpos, corre com medo pra passagem
//   • Socram ri e o explode → abre o buraco na rocha
//   • O LARANJA vai sozinho até o túnel, entra… e morre lá dentro
//   • Câmera volta pro Bobby — agora armado
// ═══════════════════════════════════════════════════════════════

import {
  BOBBY_RUN, MECHA, BULLET_FRAMES,
  PAL_ORANGE_BOT, PAL_BROKEN_BOT, PAL_MECHA, PAL_ENEMY,
} from './sprites';
import { audio } from './audio';

// ── Geografia no MUNDO ────────────────────────────────────
export const MOUNTAIN_X0 = 2600;
export const MOUNTAIN_X1 = 3130;
export const MOUNTAIN_TOP = 20;
export const TUNNEL_X0 = 2760;
export const TUNNEL_X1 = 2980;
export const MOUTH_X1 = 2846;      // boca alta: entra EM PÉ
export const MOUTH_TOP = 284;
export const TUNNEL_TOP = 310;     // fundo baixo: só AGACHADO (folga maior)
export const HOLE_X = 2790;
export const GROUND_Y = 350;

const ORANGE_ENTER = 2500;
const ORANGE_STOP = 2170;
const BROKEN_ENTER = 2580;
const BROKEN_STOP = 2300;
const SOCRAM_X = 2790;
const SOCRAM_Y = 150;
const PAN_TARGET = 2700;

export interface StoryDeps {
  ctx: CanvasRenderingContext2D;
  getVW: () => number;
  H: number;
  getCam: () => number;
  uiScale: () => number;
  drawFrames: (f: string[][], i: number, pal: string[], x: number, y: number, sc: number, flip: boolean) => void;
  smoke: (x: number, y: number) => void;
  burst: (x: number, y: number, colors: string[], n: number, power?: number) => void;
  shake: (v: number) => void;
  boom: (x: number, y: number, scale: number) => void;
}

interface Bot {
  x: number; y: number; dir: number; alive: boolean;
  state: 'throw' | 'flee'; cd: number; pal: string[];
}
interface Rock { x: number; y: number; vx: number; vy: number; spin: number }
interface Shot { x: number; y: number; vx: number; vy: number; target: Bot | null }
interface Corpse { x: number; y: number; pal: string[]; rot: number; head?: boolean }

const P_ALARM = 0, P_ORANGE_IN = 1, P_TALK1 = 2, P_BROKEN_IN = 3, P_TURN = 4,
      P_ANSWER = 5, P_BROKEN_DIE = 6, P_PAN_OUT = 7, P_RIOT = 8, P_MASSACRE = 9,
      P_FLEE = 10, P_LAUGH = 11, P_BLAST = 12, P_AFTER = 13,
      P_ORANGE_GO = 14, P_ORANGE_IN_TUNNEL = 15, P_ORANGE_DIE = 16,
      P_PAN_BACK = 17, P_ARMED = 18, P_DONE = 19;

const DUR: Record<number, number> = {
  [P_ALARM]: 80, [P_TALK1]: 150, [P_TURN]: 110, [P_ANSWER]: 165,
  [P_BROKEN_DIE]: 90, [P_PAN_OUT]: 80, [P_RIOT]: 200, [P_MASSACRE]: 260,
  [P_FLEE]: 150, [P_LAUGH]: 110, [P_BLAST]: 130, [P_AFTER]: 80,
  [P_ORANGE_IN_TUNNEL]: 70, [P_ORANGE_DIE]: 150, [P_PAN_BACK]: 80, [P_ARMED]: 130,
};

const PAL_BLUE = ['#5bc8f5', '#1b4a6b', '#ffffff', '#ffd700', '#0d2b40'];
const PAL_GREEN = ['#57d98a', '#1d5c37', '#ffffff', '#ffd700', '#0f3521'];
const PAL_PURPLE = ['#b06ae0', '#4a2168', '#ffffff', '#ffd700', '#2a1240'];
const PAL_CYAN = ['#49dfd0', '#12564f', '#ffffff', '#ffd700', '#0a332e'];

export class StoryScene {
  active = false;
  finished = false;
  holeOpen = false;
  phase = P_ALARM;
  corpses: Corpse[] = [];
  private t = 0;
  private f = 0;
  private orangeX = ORANGE_ENTER;
  private orangeDir = -1;
  private orangeGone = false;
  private brokenX = BROKEN_ENTER;
  private brokenAlive = true;
  private bots: Bot[] = [];
  private rocks: Rock[] = [];
  private shots: Shot[] = [];
  private socY = SOCRAM_Y;
  private socHit = 0;
  private socCd = 0;
  private flash = 0;
  private bobbyX = 2000;
  onFinish: (() => void) | null = null;

  constructor(private d: StoryDeps) {}

  get cameraFocus(): number {
    const k = (dur: number) => Math.min(1, this.t / dur);
    switch (this.phase) {
      case P_PAN_OUT: return lerp(this.bobbyX + 120, PAN_TARGET, ease(k(DUR[P_PAN_OUT])));
      case P_RIOT: case P_MASSACRE: case P_FLEE:
      case P_LAUGH: case P_BLAST: case P_AFTER: return PAN_TARGET;
      case P_ORANGE_GO: return Math.max(PAN_TARGET - 120, this.orangeX + 90);
      case P_ORANGE_IN_TUNNEL: case P_ORANGE_DIE: return TUNNEL_X0 + 40;
      case P_PAN_BACK: return lerp(TUNNEL_X0 + 40, this.bobbyX + 120, ease(k(DUR[P_PAN_BACK])));
      default: return this.bobbyX + 120;
    }
  }

  start(bobbyX: number) {
    if (this.active || this.finished) return;
    this.active = true;
    this.phase = P_ALARM;
    this.t = 0;
    this.bobbyX = bobbyX;
    this.orangeX = ORANGE_ENTER;
    this.orangeDir = -1;
    this.orangeGone = false;
    this.brokenX = BROKEN_ENTER;
    this.brokenAlive = true;
    this.rocks = [];
    this.shots = [];
    this.corpses = [];
    this.socY = SOCRAM_Y;
    this.socHit = 0;
    this.socCd = 0;
    this.flash = 0;
    this.bots = [
      { x: 2700, y: 302, dir: 1, alive: true, state: 'throw', cd: 25, pal: PAL_BLUE },
      { x: 2650, y: 302, dir: 1, alive: true, state: 'throw', cd: 60, pal: PAL_GREEN },
      { x: 2596, y: 302, dir: 1, alive: true, state: 'throw', cd: 95, pal: PAL_PURPLE },
      { x: 2542, y: 302, dir: 1, alive: true, state: 'throw', cd: 130, pal: PAL_CYAN },
    ];
    audio.alarm();
  }

  // 🎬 precisa de 8 toques pra pular — não corta a cena sem querer
  skipCount = 0;
  private skipDecay = 0;
  static SKIP_NEEDED = 8;

  requestSkip() {
    if (!this.active) return;
    this.skipCount++;
    this.skipDecay = 150;
    audio.beep();
    if (this.skipCount >= StoryScene.SKIP_NEEDED) this.skip();
  }

  skip() {
    if (!this.active) return;
    this.holeOpen = true;
    this.orangeGone = true;
    if (this.brokenAlive) {
      this.brokenAlive = false;
      this.corpses.push({ x: this.brokenX, y: GROUND_Y - 18, pal: PAL_BROKEN_BOT, rot: 0, head: true });
    }
    this.bots.forEach((b) => {
      if (b.alive) { b.alive = false; this.corpses.push({ x: b.x, y: GROUND_Y - 14, pal: b.pal, rot: (this.corpses.length % 2 ? 1 : -1) * 0.4 }); }
    });
    this.phase = P_PAN_BACK;
    this.t = 0;
  }

  private next() {
    this.phase++;
    this.t = 0;
    if (this.phase >= P_DONE) {
      this.active = false;
      this.finished = true;
      this.onFinish?.();
    }
  }

  private killBot(b: Bot) {
    b.alive = false;
    audio.explosion();
    this.d.boom(b.x + 18, b.y + 22, 0.72);
    this.d.burst(b.x + 18, b.y + 22, ['#ff4400', '#ffaa00', '#fff', b.pal[0]], 26, 1.5);
    this.d.shake(6);
    this.flash = 0.26;
    this.corpses.push({ x: b.x, y: GROUND_Y - 14, pal: b.pal, rot: (this.corpses.length % 2 ? 1 : -1) * 0.42 });
  }

  /** Socram dispara o tiro ORIGINAL dele */
  private socramShoot(target: Bot) {
    const ox = SOCRAM_X + 30, oy = this.socY + 54;
    const dx = target.x + 18 - ox, dy = target.y + 16 - oy;
    const d = Math.hypot(dx, dy) || 1;
    this.shots.push({ x: ox, y: oy, vx: (dx / d) * 6.4, vy: (dy / d) * 6.4, target });
    audio.shoot();
    this.d.burst(ox, oy, ['#ffd24a', '#ff8a1f'], 5);
  }

  update() {
    if (!this.active) return;
    this.f++;
    this.t++;
    if (this.flash > 0) this.flash -= 0.05;
    if (this.skipDecay > 0 && --this.skipDecay === 0) this.skipCount = 0;
    if (this.socHit > 0) this.socHit--;

    // pedras dos presos
    for (let i = this.rocks.length - 1; i >= 0; i--) {
      const r = this.rocks[i];
      r.x += r.vx; r.y += r.vy; r.vy += 0.22; r.spin += 0.2;
      if (Math.abs(r.x - (SOCRAM_X + 30)) < 34 && Math.abs(r.y - (this.socY + 28)) < 30) {
        this.socHit = 8;
        audio.bossHit();
        this.d.burst(r.x, r.y, ['#c9c0b0', '#8a8072', '#fff'], 8);
        this.rocks.splice(i, 1);
        continue;
      }
      if (r.y > GROUND_Y || r.x > MOUNTAIN_X1) this.rocks.splice(i, 1);
    }

    // tiros do Socram
    for (let i = this.shots.length - 1; i >= 0; i--) {
      const s = this.shots[i];
      s.x += s.vx; s.y += s.vy;
      const tg = s.target;
      if (tg && tg.alive && s.x > tg.x - 6 && s.x < tg.x + 42 && s.y > tg.y - 6 && s.y < tg.y + 44) {
        this.killBot(tg);
        this.shots.splice(i, 1);
        continue;
      }
      if (s.y > GROUND_Y || s.x < MOUNTAIN_X0 - 400) {
        this.d.burst(s.x, s.y, ['#8a8072', '#fff'], 5);
        this.shots.splice(i, 1);
      }
    }

    const hover = () => { this.socY = SOCRAM_Y + Math.sin(this.f * 0.055) * 12; };

    switch (this.phase) {
      case P_ALARM:
        if (this.t % 30 === 1) audio.alarm();
        break;

      case P_ORANGE_IN:
        if (this.orangeX > ORANGE_STOP) this.orangeX -= 3.6; else this.next();
        break;

      case P_TALK1:
        if (this.t === 1) audio.beep();
        break;

      case P_BROKEN_IN:
        if (this.brokenX > BROKEN_STOP) {
          this.brokenX -= 1.8;
          if (this.f % 4 === 0) this.d.smoke(this.brokenX + 16, 300);
        } else this.next();
        break;

      case P_TURN:
        if (this.t === 1) { this.orangeDir = 1; audio.beep(); }
        break;

      case P_ANSWER:
        if (this.t === 1) audio.hit();
        if (this.f % 4 === 0) this.d.smoke(this.brokenX + 16, 300);
        break;

      case P_BROKEN_DIE:
        // 💥 ele EXPLODE — sobra a cabecinha
        if (this.t === 24) {
          this.brokenAlive = false;
          audio.explosion();
          this.d.boom(this.brokenX + 18, 322, 0.85);
          this.d.burst(this.brokenX + 18, 322, ['#ff4400', '#ffaa00', '#fff', '#8a8a8a'], 34, 1.7);
          this.d.shake(8);
          this.flash = 0.4;
          this.corpses.push({ x: this.brokenX, y: GROUND_Y - 18, pal: PAL_BROKEN_BOT, rot: 0, head: true });
        }
        if (this.t > 24 && this.f % 7 === 0) this.d.smoke(this.brokenX + 18, 336);
        break;

      case P_RIOT:
        hover();
        for (const b of this.bots) {
          if (!b.alive) continue;
          b.cd--;
          if (b.cd <= 0) {
            b.cd = 70 + Math.random() * 40;
            this.rocks.push({ x: b.x + 22, y: b.y + 6, vx: 3.6 + Math.random() * 1.4, vy: -4.2 - Math.random() * 1.6, spin: 0 });
            audio.throwBomb();
          }
        }
        break;

      case P_MASSACRE: {
        hover();
        for (const b of this.bots) {
          if (!b.alive || b.state !== 'throw') continue;
          b.cd--;
          if (b.cd <= 0) {
            b.cd = 85 + Math.random() * 40;
            this.rocks.push({ x: b.x + 22, y: b.y + 6, vx: 3.4, vy: -4.4, spin: 0 });
          }
        }
        // 🔫 ele ATIRA e mata os 3 mais perto
        this.socCd--;
        const alive = this.bots.filter((b) => b.alive);
        if (this.socCd <= 0 && alive.length > 1 && this.t < 230) {
          this.socCd = 70;
          this.socramShoot(alive.reduce((a, b) => (a.x > b.x ? a : b)));
        }
        break;
      }

      case P_FLEE: {
        hover();
        const last = this.bots.find((b) => b.alive);
        if (last) {
          last.state = 'flee';
          last.dir = 1;
          if (last.x < HOLE_X - 20) last.x += 3.2;
        }
        break;
      }

      case P_LAUGH:
        hover();
        if (this.t === 1) audio.laugh();
        break;

      case P_BLAST: {
        hover();
        const last = this.bots.find((b) => b.alive);
        if (this.t === 20 && last) this.socramShoot(last);
        if (this.t === 52 && !this.holeOpen) {
          if (last?.alive) this.killBot(last);
          this.holeOpen = true;
          this.flash = 1;
          audio.gateBoom();
          this.d.shake(20);
          this.d.boom(HOLE_X + 30, 320, 1.7);
          this.d.burst(HOLE_X + 30, 326, ['#ff4400', '#ffdd00', '#fff', '#8a7a6a', '#5b4c3e'], 72, 2.3);
          for (let i = 0; i < 9; i++) this.d.smoke(HOLE_X + Math.random() * 90, 336);
        }
        break;
      }

      case P_AFTER:
        hover();
        if (this.f % 8 === 0) this.d.smoke(HOLE_X + 20 + Math.random() * 60, 340);
        break;

      case P_ORANGE_GO:
        // 🏃 o laranja vai SOZINHO até o túnel
        hover();
        this.orangeDir = 1;
        this.orangeX += 3.2;
        if (this.orangeX >= TUNNEL_X0 + 20) { this.orangeX = TUNNEL_X0 + 20; this.next(); }
        break;

      case P_ORANGE_IN_TUNNEL:
        // entra no escuro
        this.orangeX += 2.2;
        if (this.t > 40) this.orangeGone = true;
        break;

      case P_ORANGE_DIE:
        // 💀 morre LÁ DENTRO
        if (this.t === 30) audio.bossRoar();
        if (this.t === 74) {
          this.flash = 0.85;
          audio.explosion();
          audio.hit();
          this.d.shake(12);
          this.d.boom(TUNNEL_X0 + 96, 330, 1.0);
          this.d.burst(TUNNEL_X0 + 96, 330, ['#ff4400', '#ffaa00', '#ff8c1a', '#fff'], 30, 1.5);
        }
        if (this.t > 74 && this.f % 6 === 0) this.d.smoke(TUNNEL_X0 + 70 + Math.random() * 50, 342);
        break;

      case P_ARMED:
        if (this.t === 1) audio.bossRoar();
        break;
    }

    const dur = DUR[this.phase];
    if (dur !== undefined && this.t >= dur) this.next();
  }

  private fnt(px: number, bold = true) {
    return `${bold ? 'bold ' : ''}${Math.round(px * this.d.uiScale())}px "Courier New", monospace`;
  }

  /** atores no MUNDO — nenhum overlay, nenhum fundo falso */
  drawWorld() {
    const ctx = this.d.ctx;
    const cam = this.d.getCam();
    const VW = this.d.getVW();

    // 💀 corpos permanentes
    for (const c of this.corpses) {
      const cx = c.x - cam;
      if (cx < -60 || cx > VW + 60) continue;
      if (c.head) {
        // cabecinha apagada com X nos olhos
        ctx.fillStyle = c.pal[0];
        ctx.fillRect(cx + 6, c.y + 6, 26, 20);
        ctx.fillStyle = c.pal[1];
        ctx.fillRect(cx + 6, c.y + 22, 26, 4);
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2.5;
        for (const ex of [cx + 12, cx + 24]) {
          ctx.beginPath();
          ctx.moveTo(ex - 3, c.y + 11); ctx.lineTo(ex + 3, c.y + 17);
          ctx.moveTo(ex + 3, c.y + 11); ctx.lineTo(ex - 3, c.y + 17);
          ctx.stroke();
        }
        // antena torta
        ctx.strokeStyle = c.pal[1];
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx + 19, c.y + 6); ctx.lineTo(cx + 25, c.y - 4);
        ctx.stroke();
        ctx.fillStyle = 'rgba(10,8,14,0.45)';
        ctx.beginPath(); ctx.ellipse(cx + 19, GROUND_Y - 1, 18, 4, 0, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.save();
        ctx.translate(cx + 18, c.y + 20);
        ctx.rotate(Math.PI / 2 + c.rot);
        ctx.globalAlpha = 0.85;
        this.d.drawFrames(BOBBY_RUN, 0, c.pal, -18, -20, 4, false);
        ctx.restore();
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(10,8,14,0.5)';
        ctx.beginPath(); ctx.ellipse(cx + 18, GROUND_Y - 1, 24, 5, 0, 0, Math.PI * 2); ctx.fill();
      }
    }

    if (!this.active) return;
    const atMountain = this.phase >= P_PAN_OUT && this.phase <= P_PAN_BACK;

    if (atMountain) {
      // presos — mesmo sprite do Bobby, cores diferentes, pernas animando
      for (const b of this.bots) {
        if (!b.alive) continue;
        const bx = b.x - cam;
        if (bx < -60 || bx > VW + 60) continue;
        const fi = b.state === 'flee'
          ? Math.floor(this.f / 5) % 3
          : (this.f % 60 < 14 ? 1 + (Math.floor(this.f / 5) % 2) : 0);
        this.d.drawFrames(BOBBY_RUN, fi, b.pal, bx, b.y, 4, b.dir === -1);
        if (b.state === 'throw' && b.cd < 14) {
          ctx.strokeStyle = b.pal[0];
          ctx.lineWidth = 5; ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(bx + 22, b.y + 26);
          ctx.lineTo(bx + 34, b.y + 4);
          ctx.stroke();
          ctx.lineCap = 'butt';
        }
      }
      // pedras
      for (const r of this.rocks) {
        ctx.save();
        ctx.translate(r.x - cam, r.y);
        ctx.rotate(r.spin);
        ctx.fillStyle = '#8a8072'; ctx.fillRect(-5, -5, 10, 10);
        ctx.fillStyle = '#a89c8a'; ctx.fillRect(-5, -5, 5, 5);
        ctx.restore();
      }
      // SOCRAM
      const sx = SOCRAM_X - cam;
      const pal = this.socHit > 0 && this.f % 3 < 2
        ? ['#ffffff', '#ffcccc', '#fff', '#ffd700', '#aa5555'] : PAL_MECHA;
      this.d.drawFrames(MECHA, Math.floor(this.f / 10) % 2, pal, sx, this.socY, 3, true);
      ctx.fillStyle = `rgba(255,150,0,${(0.5 + Math.random() * 0.4).toFixed(2)})`;
      ctx.fillRect(sx + 18, this.socY + 54, 7, 8 + Math.random() * 9);
      ctx.fillRect(sx + 34, this.socY + 54, 7, 8 + Math.random() * 9);
      // tiros dele (sprite original)
      for (const s of this.shots)
        this.d.drawFrames(BULLET_FRAMES, 0, PAL_ENEMY, s.x - cam - 6, s.y - 6, 2, false);
    }

    // laranja e quebrado
    const gy = 302;
    if (this.phase >= P_ORANGE_IN && !this.orangeGone) {
      const ox = this.orangeX - cam;
      const walking = this.phase === P_ORANGE_IN || this.phase === P_ORANGE_GO || this.phase === P_ORANGE_IN_TUNNEL;
      const fi = walking ? Math.floor(this.f / 5) % 3 : 0;
      // entrando no túnel = vai escurecendo
      if (this.phase === P_ORANGE_IN_TUNNEL) ctx.globalAlpha = Math.max(0, 1 - this.t / 45);
      this.d.drawFrames(BOBBY_RUN, fi, PAL_ORANGE_BOT, ox, gy, 4, this.orangeDir === 1);
      ctx.globalAlpha = 1;
      if (this.phase === P_TALK1) {
        const sw = Math.sin(this.f * 0.25) * 9;
        ctx.strokeStyle = PAL_ORANGE_BOT[0];
        ctx.lineWidth = 5; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ox + 4, gy + 26);
        ctx.lineTo(ox - 10 + sw * 0.3, gy + 8 - sw);
        ctx.stroke();
        ctx.lineCap = 'butt';
      }
    }
    if (this.brokenAlive && this.phase >= P_BROKEN_IN) {
      const bx = this.brokenX - cam;
      ctx.save();
      ctx.translate(bx + 18, gy + 44);
      ctx.rotate(Math.sin(this.f * 0.08) * 0.07 - 0.1);
      ctx.translate(-(bx + 18), -(gy + 44));
      const fi = this.phase === P_BROKEN_IN ? Math.floor(this.f / 9) % 3 : 0;
      this.d.drawFrames(BOBBY_RUN, fi, PAL_BROKEN_BOT, bx, gy, 4, true);
      ctx.restore();
      if (Math.floor(this.f / 6) % 2 === 0) {
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(bx + 22, gy + 14, 3, 3);
        ctx.fillRect(bx + 8, gy + 22, 2, 2);
      }
      // pisca vermelho antes de explodir
      if (this.phase === P_BROKEN_DIE && Math.floor(this.f / 4) % 2 === 0) {
        ctx.fillStyle = 'rgba(255,60,40,0.55)';
        ctx.fillRect(bx + 4, gy, 32, 46);
      }
    }
    // olhos do Boss no escuro do túnel
    if (this.phase === P_ORANGE_DIE && this.t > 34 && this.t < 78) {
      const ex = TUNNEL_X0 + 110 - cam;
      const a = 0.55 + Math.abs(Math.sin(this.f * 0.2)) * 0.45;
      ctx.fillStyle = `rgba(255,40,40,${a.toFixed(2)})`;
      ctx.shadowColor = '#ff2222'; ctx.shadowBlur = 18;
      ctx.fillRect(ex, 326, 11, 7);
      ctx.fillRect(ex + 22, 326, 11, 7);
      ctx.shadowBlur = 0;
    }
  }

  drawUI() {
    if (!this.active) return;
    const ctx = this.d.ctx;
    const VW = this.d.getVW();
    const cam = this.d.getCam();
    const gy = 302;

    if (this.phase === P_ALARM || this.phase === P_ORANGE_IN) {
      const p = Math.abs(Math.sin(this.f * 0.09));
      ctx.fillStyle = `rgba(255,0,0,${(0.07 + p * 0.14).toFixed(2)})`;
      ctx.fillRect(0, 0, VW, this.d.H);
    }
    if (this.phase === P_ALARM) {
      ctx.textAlign = 'center';
      ctx.fillStyle = Math.floor(this.f / 14) % 2 === 0 ? '#ff3333' : '#7a1111';
      ctx.font = this.fnt(23);
      ctx.fillText('⚠ ALERTA ⚠', VW / 2, 112);
      ctx.fillStyle = '#ffd700';
      ctx.font = this.fnt(11);
      ctx.fillText('SINAL DE SOCORRO DETECTADO', VW / 2, 134);
      ctx.textAlign = 'left';
    }
    if (this.phase === P_TALK1) this.balloon(this.orangeX - cam + 18, gy - 4, 'Bobby, o caminho é por aqui!', '#ff8c1a');
    if (this.phase === P_TURN) this.balloon(this.orangeX - cam + 18, gy - 4, 'O que houve?!', '#ff8c1a');
    if (this.phase === P_ANSWER) this.balloon(this.brokenX - cam + 18, gy - 4, 'Socram… está nos matando!', '#9aa0a6');
    if (this.phase === P_BROKEN_DIE && this.t > 30) this.caption('NÃO!!!', '#ff8c1a', 17);
    if (this.phase === P_RIOT && this.t > 40) {
      const b = this.bots.find((x) => x.alive);
      if (b) this.balloon(b.x - cam + 18, b.y - 4, 'TOMA, SUCATA!', '#7fd1ff');
    }
    if (this.phase === P_MASSACRE && this.t > 200) this.caption('ELE NÃO PERDOA…', '#ff5555', 15);
    if (this.phase === P_FLEE && this.t > 26) {
      const b = this.bots.find((x) => x.alive);
      if (b) this.balloon(b.x - cam + 18, b.y - 4, 'SOCORRO!!', '#49dfd0');
    }
    if (this.phase === P_LAUGH) this.balloon(SOCRAM_X - cam + 30, this.socY - 4, 'HAHAHA!', '#e74c3c');
    if (this.phase === P_AFTER && this.t > 24) this.caption('A ROCHA CEDEU. A MASMORRA ABRIU.', '#ffd700', 13);
    if (this.phase === P_ORANGE_GO) this.caption('"Eu vou na frente, Bobby!"', '#ff8c1a', 13);
    if (this.phase === P_ORANGE_IN_TUNNEL) this.caption('ELE ENTROU EM PÉ…', '#ff8c1a', 14);
    if (this.phase === P_ORANGE_DIE && this.t > 80) this.caption('AGACHE PARA PASSAR, BOBBY!', '#ffd700', 14);
    if (this.phase === P_ARMED) {
      if (this.t < 62) this.caption('SOCRAM PERCEBEU MAIS UM ROBÔ…', '#ff5555', 14);
      else this.caption('MAS DESSA VEZ, O ROBÔ ESTÁ ARMADO.', '#00ff88', 14);
    }

    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${Math.min(1, this.flash).toFixed(2)})`;
      ctx.fillRect(0, 0, VW, this.d.H);
    }

    const h = 36;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, VW, h);
    ctx.fillRect(0, this.d.H - h, VW, h);
    ctx.strokeStyle = 'rgba(255,215,0,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, h + 0.5); ctx.lineTo(VW, h + 0.5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, this.d.H - h - 0.5); ctx.lineTo(VW, this.d.H - h - 0.5); ctx.stroke();
    // aviso de pular (8x) + barrinha de progresso
    const need = StoryScene.SKIP_NEEDED;
    const left = Math.max(0, need - this.skipCount);
    ctx.textAlign = 'right';
    if (this.skipCount > 0) {
      ctx.fillStyle = '#ffd700';
      ctx.font = this.fnt(10);
      ctx.fillText(`PULAR: MAIS ${left}x`, VW - 12, this.d.H - 15);
      const bw = 92, bx = VW - 12 - bw;
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(bx, this.d.H - 11, bw, 4);
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(bx, this.d.H - 11, bw * (this.skipCount / need), 4);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.font = this.fnt(9, false);
      ctx.fillText(`APERTE ESPAÇO / TOQUE ${need}x PARA PULAR`, VW - 12, this.d.H - 13);
    }
    ctx.textAlign = 'left';
  }

  private caption(text: string, color: string, size: number) {
    const ctx = this.d.ctx;
    const VW = this.d.getVW();
    ctx.textAlign = 'center';
    ctx.font = this.fnt(size);
    const w = ctx.measureText(text).width + 26;
    ctx.fillStyle = 'rgba(0,0,0,0.62)';
    ctx.fillRect(VW / 2 - w / 2, 94, w, 26);
    ctx.fillStyle = color;
    ctx.fillText(text, VW / 2, 112);
    ctx.textAlign = 'left';
  }

  private balloon(cx: number, bottomY: number, text: string, tint: string) {
    const ctx = this.d.ctx;
    const s = this.d.uiScale();
    const VW = this.d.getVW();
    const fs = 13 * s;
    ctx.font = this.fnt(13);
    const maxW = Math.min(250 * s, VW - 60);
    const lines: string[] = [];
    let line = '';
    for (const w of text.split(' ')) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; }
      else line = test;
    }
    if (line) lines.push(line);
    const bw = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 24 * s;
    const bh = lines.length * (fs + 6) + 16 * s;
    const bx = Math.max(8, Math.min(VW - bw - 8, cx - bw / 2));
    const by = Math.max(44, bottomY - bh - 12);
    const tail = Math.max(bx + 12, Math.min(bx + bw - 12, cx));
    ctx.fillStyle = 'rgba(255,255,255,0.96)';
    ctx.strokeStyle = tint;
    ctx.lineWidth = 3;
    const r = 8;
    ctx.beginPath();
    ctx.moveTo(bx + r, by);
    ctx.arcTo(bx + bw, by, bx + bw, by + bh, r);
    ctx.arcTo(bx + bw, by + bh, bx, by + bh, r);
    ctx.arcTo(bx, by + bh, bx, by, r);
    ctx.arcTo(bx, by, bx + bw, by, r);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(tail - 8, by + bh - 1);
    ctx.lineTo(tail, by + bh + 13);
    ctx.lineTo(tail + 8, by + bh - 1);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.96)';
    ctx.fill();
    ctx.strokeStyle = tint;
    ctx.beginPath();
    ctx.moveTo(tail - 8, by + bh); ctx.lineTo(tail, by + bh + 13); ctx.lineTo(tail + 8, by + bh);
    ctx.stroke();
    ctx.fillStyle = '#14141f';
    ctx.textAlign = 'center';
    lines.forEach((l, i) => ctx.fillText(l, bx + bw / 2, by + 13 * s + i * (fs + 6) + 4));
    ctx.textAlign = 'left';
  }
}

function ease(k: number) { return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
