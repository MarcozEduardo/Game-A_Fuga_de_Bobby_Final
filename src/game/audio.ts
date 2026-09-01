// ═══════════════════════════════════════════════
//  ÁUDIO — WebAudio chiptune
//  Corrigido: AudioContext era criado no load da página
//  (browsers modernos suspendem até o 1º gesto do usuário).
//  Agora é lazy + resume seguro + suporte a mute.
// ═══════════════════════════════════════════════

type ToneType = OscillatorType;

class GameAudio {
  private ctx: AudioContext | null = null;
  muted = false;

  private ensure(): AudioContext | null {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AC();
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return this.ctx;
    } catch {
      return null;
    }
  }

  /** chamar no primeiro gesto do usuário */
  unlock() {
    this.ensure();
  }

  // ── limitador de vozes + throttle (fix de LAG) ──────────
  private voices = 0;
  private lastAt = new Map<string, number>();
  private static MAX_VOICES = 10;
  private static THROTTLE_MS = 35;

  private tone(freq: number, dur: number, type: ToneType = 'sine', seq: number[] = [], tag = '') {
    if (this.muted) return;
    const now = performance.now();
    const key = tag || `${freq}|${type}`;
    const prev = this.lastAt.get(key) ?? -1e9;
    if (now - prev < GameAudio.THROTTLE_MS) return;
    if (this.voices >= GameAudio.MAX_VOICES) return;
    const ctx = this.ensure();
    if (!ctx) return;
    try {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      o.connect(g);
      g.connect(ctx.destination);
      g.gain.value = 0.16;
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
      if (seq.length) {
        const s = dur / seq.length;
        seq.forEach((f, i) => o.frequency.setValueAtTime(f, ctx.currentTime + s * i));
      }
      this.voices++;
      this.lastAt.set(key, now);
      o.onended = () => { this.voices = Math.max(0, this.voices - 1); };
      o.start(ctx.currentTime);
      o.stop(ctx.currentTime + dur);
    } catch {
      this.voices = Math.max(0, this.voices - 1);
    }
  }

  jump() { this.tone(200, 0.1, 'triangle'); }
  coin() { this.tone(800, 0.15, 'square', [800, 1200]); }
  star() { this.tone(1200, 0.2, 'sine', [1200, 1600, 2000]); }
  hit() { this.tone(100, 0.3, 'sawtooth', [100, 80]); }
  gameOver() { this.tone(200, 0.5, 'sawtooth', [200, 150, 100, 50]); }
  victory() { this.tone(600, 0.6, 'sine', [600, 700, 800, 1000, 1200]); }
  shoot() { this.tone(350, 0.08, 'square', [350, 300]); }
  heal() { this.tone(500, 0.4, 'sine', [500, 700, 900, 1100]); }
  respawn() { this.tone(150, 0.2, 'sawtooth', [150, 200, 250]); }
  bossHit() { this.tone(80, 0.15, 'sawtooth', [80, 60]); }
  bossRoar() { this.tone(60, 0.6, 'sawtooth', [60, 80, 60, 40, 60]); }
  fall() { this.tone(300, 0.4, 'sine', [300, 200, 100, 50]); }
  stomp() { this.tone(300, 0.15, 'square', [300, 500]); }
  superAmmo() { this.tone(800, 0.4, 'sine', [800, 1000, 1200, 1400, 1600]); }
  superShot() { this.tone(100, 0.3, 'sawtooth', [100, 200, 400, 800]); }
  shield() { this.tone(600, 0.3, 'sine', [600, 800, 1000]); }
  type() { this.tone(800, 0.03, 'square'); }
  boot() { this.tone(200, 0.8, 'sine', [200, 400, 600, 800, 1000]); }
  explosion() { this.tone(60, 0.5, 'sawtooth', [60, 40, 30, 20]); }
  rocket() { this.tone(80, 0.8, 'sawtooth', [80, 100, 120, 150]); }
  keyGet() { this.tone(500, 0.5, 'sine', [500, 700, 900, 1100, 1300, 1500]); }
  unlockGate() { this.tone(300, 0.4, 'square', [300, 400, 500, 600]); }
  signal() { this.tone(800, 0.6, 'sine', [800, 900, 800, 900, 1000, 1200]); }
  uiMove() { this.tone(440, 0.05, 'square'); }
  pause() { this.tone(300, 0.12, 'square', [300, 200]); }
  alarm() { this.tone(880, 0.45, 'square', [880, 620, 880, 620], 'alarm'); }
  beep() { this.tone(660, 0.09, 'square', [660, 880], 'beep'); }
  scream() { this.tone(700, 0.5, 'sawtooth', [700, 900, 1100, 800, 400], 'scream'); }
  laugh() { this.tone(180, 0.6, 'square', [180, 120, 180, 120, 180, 110], 'laugh'); }
  bomb() { this.tone(70, 0.55, 'sawtooth', [70, 50, 120, 40, 25], 'bomb'); }
  throwBomb() { this.tone(420, 0.12, 'triangle', [420, 300], 'throw'); }
  gateBoom() { this.tone(55, 0.8, 'sawtooth', [55, 90, 45, 30, 20], 'gate'); }
  lifeUp() { this.tone(600, 0.45, 'sine', [600, 800, 1000, 1300], 'lifeup'); }
}

export const audio = new GameAudio();
