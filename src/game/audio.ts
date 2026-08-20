/* =====================================================
 *  BOBBY IA — motor de áudio: SFX + música dinâmica 3 zonas
 * ===================================================== */

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
    const AC = w.AudioContext ?? w.webkitAudioContext;
    if (!AC) throw new Error('WebAudio não suportado');
    audioCtx = new AC();
  }
  return audioCtx;
}

export function resumeAudio(): void {
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    /* silencioso */
  }
}

/* ---------- controle de polifonia (evita engasgo no mobile em cena cheia) ---------- */
const lastPlayed: Record<string, number> = {};
let activeVoices = 0;
const MAX_VOICES = 10;      // teto de osciladores de SFX tocando ao mesmo tempo
const MIN_GAP_MS = 35;      // não deixa o MESMO som re-disparar mais rápido que isso

export function playTone(freq: number, dur: number, type: OscillatorType = 'sine', seq: number[] = [], key?: string): void {
  try {
    const now = performance.now();
    if (key) {
      const last = lastPlayed[key] ?? 0;
      if (now - last < MIN_GAP_MS) return;      // ignora spam do mesmo som
      lastPlayed[key] = now;
    }
    if (activeVoices >= MAX_VOICES) return;      // corta se já tá lotado

    const ctx = getCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.value = 0.2;
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
    if (seq.length) {
      const s = dur / seq.length;
      seq.forEach((f, i) => o.frequency.setValueAtTime(f, ctx.currentTime + s * i));
    }
    activeVoices++;
    o.onended = () => { activeVoices--; o.disconnect(); g.disconnect(); };
    o.start(ctx.currentTime);
    o.stop(ctx.currentTime + dur);
  } catch {
    activeVoices = Math.max(0, activeVoices - 1);
  }
}

export const SOUNDS = {
  jump: () => playTone(200, 0.1, 'triangle'),
  coin: () => playTone(800, 0.15, 'square', [800, 1200]),
  star: () => playTone(1200, 0.2, 'sine', [1200, 1600, 2000]),
  hit: () => playTone(100, 0.3, 'sawtooth', [100, 80], 'hit'),
  gameOver: () => playTone(200, 0.5, 'sawtooth', [200, 150, 100, 50]),
  victory: () => playTone(600, 0.6, 'sine', [600, 700, 800, 1000, 1200]),
  shoot: () => playTone(350, 0.08, 'square', [350, 300], 'shoot'),
  heal: () => playTone(500, 0.4, 'sine', [500, 700, 900, 1100]),
  respawn: () => playTone(150, 0.2, 'sawtooth', [150, 200, 250]),
  bossHit: () => playTone(80, 0.15, 'sawtooth', [80, 60], 'bossHit'),
  bossRoar: () => playTone(60, 0.6, 'sawtooth', [60, 80, 60, 40, 60]),
  fall: () => playTone(300, 0.4, 'sine', [300, 200, 100, 50]),
  stomp: () => playTone(300, 0.15, 'square', [300, 500]),
  superAmmo: () => playTone(800, 0.4, 'sine', [800, 1000, 1200, 1400, 1600]),
  superShot: () => playTone(100, 0.3, 'sawtooth', [100, 200, 400, 800]),
  shield: () => playTone(600, 0.3, 'sine', [600, 800, 1000]),
  type: () => playTone(800, 0.03, 'square'),
  boot: () => playTone(200, 0.8, 'sine', [200, 400, 600, 800, 1000]),
  explosion: () => playTone(60, 0.5, 'sawtooth', [60, 40, 30, 20]),
  rocket: () => playTone(80, 0.8, 'sawtooth', [80, 100, 120, 150]),
  keyGet: () => playTone(500, 0.5, 'sine', [500, 700, 900, 1100, 1300, 1500]),
  unlock: () => playTone(300, 0.4, 'square', [300, 400, 500, 600]),
  signal: () => playTone(800, 0.6, 'sine', [800, 900, 800, 900, 1000, 1200]),
  punch: () => {
    playTone(180, 0.18, 'sawtooth', [180, 60], 'punch');
    playTone(90, 0.18, 'square', [90, 30], 'punch2');
  },
  bulletHit: () => playTone(600, 0.12, 'square', [600, 150], 'bulletHit'),
  bombThrow: () => playTone(250, 0.15, 'triangle', [250, 160]),
  bombGet: () => playTone(400, 0.35, 'sine', [400, 600, 800, 1000]),
  conquest: () => {
    playTone(523.25, 0.5, 'sine', [523.25, 659.25, 783.99, 1046.5]);
    playTone(261.63, 0.5, 'triangle', [261.63, 329.63, 392, 523.25]);
  },
  charge: () => playTone(900, 0.06, 'square', [900, 1100]),
  chargeFull: () => playTone(600, 0.4, 'sine', [600, 800, 1000, 1200, 1500]),
  collapse: () => {
    playTone(55, 0.7, 'sawtooth', [55, 40, 30]);
    playTone(110, 0.5, 'square', [110, 70, 45]);
  },
  robotDown: () => playTone(300, 0.25, 'sawtooth', [300, 150, 60]),
  rock: () => playTone(220, 0.08, 'triangle', [220, 180]),
  missile: () => playTone(400, 0.4, 'sawtooth', [400, 300, 200, 120]),
  laugh: () => playTone(180, 0.3, 'square', [180, 150, 180, 140, 170]),
};

/* =====================================================
 *  MÚSICA DINÂMICA — 3 zonas (Aventura / Esperança / Batalha)
 * ===================================================== */
export type MusicZone = 'aventura' | 'esperanca' | 'batalha';

interface ZoneDef {
  type: OscillatorType;
  vol: number;
  tempo: number;
  melody: number[];
  bass?: number[];
  harmony?: number;
  sub?: number[];
}

const ZONES: Record<MusicZone, ZoneDef> = {
  aventura: {
    type: 'triangle',
    vol: 0.12,
    tempo: 300,
    melody: [
      220, 261.63, 329.63, 293.66, 261.63, 220, 196, 220, 220, 261.63, 329.63, 349.23, 329.63, 293.66, 261.63, 196,
    ],
    bass: [110, 82.41, 98, 82.41],
  },
  esperanca: {
    type: 'sine',
    vol: 0.13,
    tempo: 340,
    melody: [
      261.63, 329.63, 392, 523.25, 493.88, 440, 392, 349.23, 261.63, 329.63, 349.23, 392, 440, 392, 349.23, 329.63,
    ],
    bass: [130.81, 98, 110, 98],
    harmony: 1.5,
  },
  batalha: {
    type: 'sawtooth',
    vol: 0.14,
    tempo: 170,
    melody: [
      164.81, 164.81, 196, 164.81, 146.83, 164.81, 196, 220, 164.81, 164.81, 196, 246.94, 220, 196, 164.81, 146.83,
    ],
    bass: [82.41, 82.41, 73.42, 98],
    sub: [41.2, 41.2, 36.71, 49],
  },
};

class MusicEngine {
  private gain: GainNode | null = null;
  private timer: number | null = null;
  private fadeTimer: number | null = null;
  private step = 0;
  private zone: MusicZone | null = null;

  setZone(zone: MusicZone): void {
    if (this.zone === zone && this.timer !== null) return;
    if (this.timer !== null || this.fadeTimer !== null) {
      try {
        const ctx = getCtx();
        if (this.gain) {
          this.gain.gain.cancelScheduledValues(ctx.currentTime);
          this.gain.gain.setValueAtTime(Math.max(this.gain.gain.value, 0.0001), ctx.currentTime);
          this.gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
        }
      } catch {
        /* silencioso */
      }
      if (this.fadeTimer !== null) window.clearTimeout(this.fadeTimer);
      this.fadeTimer = window.setTimeout(() => {
        this.fadeTimer = null;
        this.teardown();
        this.start(zone);
      }, 620);
    } else {
      this.start(zone);
    }
  }

  stop(): void {
    if (this.timer === null && this.fadeTimer === null) {
      this.zone = null;
      return;
    }
    try {
      const ctx = getCtx();
      if (this.gain) {
        this.gain.gain.cancelScheduledValues(ctx.currentTime);
        this.gain.gain.setValueAtTime(Math.max(this.gain.gain.value, 0.0001), ctx.currentTime);
        this.gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
      }
    } catch {
      /* silencioso */
    }
    if (this.fadeTimer !== null) window.clearTimeout(this.fadeTimer);
    this.fadeTimer = window.setTimeout(() => {
      this.fadeTimer = null;
      this.teardown();
    }, 650);
    this.zone = null;
  }

  private teardown(): void {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    if (this.gain) {
      try {
        this.gain.disconnect();
      } catch {
        /* silencioso */
      }
      this.gain = null;
    }
  }

  private start(zone: MusicZone): void {
    this.zone = zone;
    this.step = 0;
    const def = ZONES[zone];
    try {
      const ctx = getCtx();
      this.gain = ctx.createGain();
      this.gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      this.gain.gain.exponentialRampToValueAtTime(def.vol, ctx.currentTime + 0.8);
      this.gain.connect(ctx.destination);
      const noteDur = (def.tempo * 0.92) / 1000;
      this.tick(def, noteDur);
      this.timer = window.setInterval(() => this.tick(def, noteDur), def.tempo);
    } catch {
      /* silencioso */
    }
  }

  private tick(def: ZoneDef, noteDur: number): void {
    try {
      const ctx = getCtx();
      const t = ctx.currentTime + 0.03;
      const mel = def.melody[this.step % def.melody.length];
      this.note(mel, def.type, noteDur, 0.5, t);
      if (def.harmony) this.note(mel * def.harmony, def.type, noteDur, 0.26, t);
      if (def.bass && this.step % 2 === 0) this.note(def.bass[(this.step / 2) % def.bass.length], def.type, noteDur * 1.9, 0.45, t);
      if (def.sub) this.note(def.sub[this.step % def.sub.length], 'sine', noteDur * 0.95, 0.8, t);
      this.step++;
    } catch {
      /* silencioso */
    }
  }

  private note(freq: number, type: OscillatorType, dur: number, peak: number, when: number): void {
    if (!this.gain) return;
    const ctx = getCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(peak, when + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g);
    g.connect(this.gain);
    o.start(when);
    o.stop(when + dur + 0.05);
  }
}

export const music = new MusicEngine();
