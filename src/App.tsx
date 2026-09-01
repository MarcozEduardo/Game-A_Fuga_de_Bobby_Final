import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Volume2, VolumeX, Pause, Play, RotateCcw, Trophy, Skull,
  Gamepad2, Keyboard, Sparkles, Bug, Bomb, Monitor, Smartphone,
} from 'lucide-react';
import {
  startBobbyGame, saveScore, getBoard,
  type GameHandle, type GamePhase, type VirtualKey, type ScoreEntry,
} from './game/engine';

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

interface EndInfo {
  win: boolean; score: number; high: number;
  flawless?: boolean; canRegister?: boolean; board?: ScoreEntry[];
}

// ───────────────── 🏅 PLACAR ─────────────────
function ScoreBoard({
  end, board, onSave,
}: {
  end: EndInfo | null;
  board: ScoreEntry[];
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState('');
  const [done, setDone] = useState(false);
  const canRegister = !!end?.canRegister && !done;

  useEffect(() => { setDone(false); setName(''); }, [end?.score, end?.win]);

  return (
    <aside className="board">
      <div className="board-head">
        <Trophy className="h-3.5 w-3.5 text-amber-300" />
        <span>PLACAR</span>
      </div>

      {end?.flawless && (
        <div className="board-flawless">
          🏆 PARTIDA PERFEITA<span>sem levar dano · +1000</span>
        </div>
      )}

      {canRegister && (
        <form
          className="board-form"
          onSubmit={(e) => { e.preventDefault(); onSave(name); setDone(true); }}
        >
          <label>NOVO RECORDE! SEU NOME:</label>
          <div className="flex gap-1.5">
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 12))}
              placeholder="BOBBY"
              maxLength={12}
              autoFocus
            />
            <button type="submit">OK</button>
          </div>
        </form>
      )}
      {end?.win && !end.canRegister && !done && (
        <p className="board-hint">Faça mais de 1200 pontos para registrar seu nome!</p>
      )}
      {done && <p className="board-saved">✔ Registrado!</p>}

      <ol className="board-list">
        {board.length === 0 && <li className="board-empty">Ninguém venceu ainda…</li>}
        {board.map((e, i) => (
          <li key={`${e.name}-${e.score}-${i}`} className={i === 0 ? 'top' : ''}>
            <span className="pos">{i + 1}</span>
            <span className="nm">
              {e.name}
              {e.flawless && <b title="Sem levar dano"> 🏆</b>}
            </span>
            <span className="sc">{e.score}</span>
          </li>
        ))}
      </ol>
    </aside>
  );
}

// ───────────────── JOYSTICK ANALÓGICO (só mobile) ─────────────────
const RADIUS = 52;

function AnalogStick({
  side, label, hint, onAxis, onActive,
}: {
  side: 'left' | 'right';
  label: string;
  hint: string;
  onAxis: (x: number, y: number) => void;
  onActive?: (v: boolean) => void;
}) {
  const [st, setSt] = useState({ active: false, ox: 0, oy: 0, kx: 0, ky: 0 });
  const pid = useRef<number | null>(null);
  const origin = useRef({ x: 0, y: 0 });

  const down = (e: React.PointerEvent) => {
    if (pid.current !== null) return;
    pid.current = e.pointerId;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const r = e.currentTarget.getBoundingClientRect();
    const ox = e.clientX - r.left, oy = e.clientY - r.top;
    origin.current = { x: ox, y: oy };
    setSt({ active: true, ox, oy, kx: 0, ky: 0 });
    onActive?.(true);           // 🔫 encostou = já dispara
  };
  const move = (e: React.PointerEvent) => {
    if (pid.current !== e.pointerId) return;
    const r = e.currentTarget.getBoundingClientRect();
    let dx = e.clientX - r.left - origin.current.x;
    let dy = e.clientY - r.top - origin.current.y;
    const d = Math.hypot(dx, dy);
    if (d > RADIUS) { dx = (dx / d) * RADIUS; dy = (dy / d) * RADIUS; }
    onAxis(dx / RADIUS, dy / RADIUS);
    setSt((p) => (p.active ? { ...p, kx: dx, ky: dy } : p));
  };
  const up = (e: React.PointerEvent) => {
    if (pid.current !== e.pointerId) return;
    pid.current = null;
    onAxis(0, 0);
    onActive?.(false);
    setSt({ active: false, ox: 0, oy: 0, kx: 0, ky: 0 });
  };

  return (
    <div
      className="stick-zone"
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onContextMenu={(e) => e.preventDefault()}
    >
      {st.active ? (
        <>
          <div className="stick-base" style={{ left: st.ox - 62, top: st.oy - 62 }} />
          <div
            className={`stick-knob ${side === 'right' ? 'knob-fire' : ''}`}
            style={{ left: st.ox + st.kx - 30, top: st.oy + st.ky - 30 }}
          />
        </>
      ) : (
        <div className="stick-ghost">
          <div className="stick-ghost-ring" />
          <span className="stick-label">{label}</span>
          <span className="stick-hint">{hint}</span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<GameHandle | null>(null);
  const [phase, setPhase] = useState<GamePhase>('LOADING');
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [endInfo, setEndInfo] = useState<EndInfo | null>(null);
  const [board, setBoard] = useState<ScoreEntry[]>(() => getBoard());
  // ⏱️ o placar só aparece 8s depois do fim (tempo de ler a mensagem)
  const [showBoard, setShowBoard] = useState(false);

  // 📱 Mobile = touch real OU janela estreita. Desktop mantém tudo.
  const detect = () =>
    typeof window !== 'undefined' &&
    ((window.matchMedia('(pointer: coarse)').matches && navigator.maxTouchPoints > 0) ||
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      window.innerWidth < 720);
  const [forced, setForced] = useState<boolean | null>(null);
  const [auto, setAuto] = useState(detect);
  const isTouch = forced ?? auto;

  useEffect(() => {
    const onR = () => setAuto(detect());
    window.addEventListener('resize', onR);
    window.addEventListener('orientationchange', onR);
    return () => {
      window.removeEventListener('resize', onR);
      window.removeEventListener('orientationchange', onR);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handle = startBobbyGame(canvas, (type, payload) => {
      if (type === 'state') { setPhase(payload as GamePhase); setEndInfo(null); }
      else if (type === 'paused') setPaused(payload as boolean);
      else if (type === 'muted') setMuted(payload as boolean);
      else if (type === 'end') {
        const info = payload as EndInfo;
        setEndInfo(info);
        if (info.board) setBoard(info.board);
      }
      if (type === 'state') setShowBoard(false);
    });
    handleRef.current = handle;
    const apply = () => {
      const r = wrapRef.current?.getBoundingClientRect();
      handle.resize(r?.width ?? 800, r?.height ?? 450, isTouch);
    };
    apply();
    const ro = new ResizeObserver(apply);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => { ro.disconnect(); handle.destroy(); };
  }, [isTouch]);

  const btn = (key: VirtualKey) => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); e.stopPropagation(); handleRef.current?.input(key, true); },
    onPointerUp: (e: React.PointerEvent) => { e.preventDefault(); handleRef.current?.input(key, false); },
    onPointerLeave: () => handleRef.current?.input(key, false),
    onPointerCancel: () => handleRef.current?.input(key, false),
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });

  const onMoveAxis = useCallback((x: number, y: number) => handleRef.current?.setAxis('move', x, y), []);
  const onAimAxis = useCallback((x: number, y: number) => handleRef.current?.setAxis('aim', x, y), []);
  const onAimTouch = useCallback((v: boolean) => handleRef.current?.input('shoot', v), []);

  // conta 8s a partir do fim da partida
  useEffect(() => {
    if (!endInfo) { setShowBoard(false); return; }
    const t = setTimeout(() => setShowBoard(true), 8000);
    return () => clearTimeout(t);
  }, [endInfo]);

  const tapToConfirm = phase === 'INTRO' || phase === 'DEFEAT' || phase === 'VICTORY';
  const onSaveScore = useCallback((name: string) => {
    if (!endInfo) return;
    setBoard(saveScore(name, endInfo.score, !!endInfo.flawless));
  }, [endInfo]);

  const sysButtons = (
    <div className="sys-bar" onPointerDown={(e) => e.stopPropagation()}>
      {phase === 'GAME' && (
        <button onClick={() => handleRef.current?.togglePause()} className="sys-btn" title="Pausar (P)">
          {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </button>
      )}
      <button onClick={() => handleRef.current?.toggleMute()} className="sys-btn" title="Som (M)">
        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>
      <button onClick={() => handleRef.current?.restart(true)} className="sys-btn" title="Reiniciar">
        <RotateCcw className="h-4 w-4" />
      </button>
      <button onClick={() => setForced(!isTouch)} className="sys-btn" title={isTouch ? 'Modo desktop' : 'Modo mobile'}>
        {isTouch ? <Monitor className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
      </button>
    </div>
  );

  // 🔗 botão do LinkedIn — SEMPRE clicável, nunca é desligado
  const linkedinButton = (small = false) => (
    <a
      href="https://www.linkedin.com/in/sir-marcos-eduardo/"
      target="_blank" rel="noreferrer"
      className={`linkedin-btn pointer-events-auto ${small ? 'linkedin-sm' : ''}`}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <LinkedinIcon className={small ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      Conhecer o Marcos
    </a>
  );

  const linkedinOverlay = (win: boolean) => (
    <div className="pointer-events-none absolute inset-x-0 bottom-10 z-30 flex flex-col items-center gap-2 px-4">
      <p className="rounded bg-black/75 px-3 py-1 text-center font-mono text-[11px] text-slate-200">
        {win ? 'Curtiu a jornada? Vamos conversar!' : 'Não desista! Tente de novo… ou conheça quem me criou:'}
      </p>
      {linkedinButton()}
    </div>
  );

  // ══════════════ 📱 MOBILE — TELA 1:1 ══════════════
  if (isTouch) {
    const showPad = phase === 'GAME' && !paused;
    return (
      <div className="mobile-root">
        <div ref={wrapRef} className="mobile-screen">
          <canvas ref={canvasRef} width={450} height={450} className="absolute inset-0 h-full w-full [image-rendering:pixelated]" />
          <div className="pointer-events-none absolute inset-0 scanlines opacity-40" />
          <div className="pointer-events-none absolute inset-0 ring-2 ring-amber-300/40" />
          {tapToConfirm && !showBoard && (
            <button
              className="absolute inset-0 z-20 h-full w-full"
              aria-label="Continuar"
              onPointerDown={(e) => { e.preventDefault(); handleRef.current?.primary(); }}
            />
          )}
          {sysButtons}
          {phase === 'DEFEAT' && endInfo && linkedinOverlay(false)}
          {phase === 'VICTORY' && endInfo && linkedinOverlay(true)}
          {/* 🏅 placar sobreposto — só 8s após o fim */}
          {showBoard && endInfo && (
            <div className="board-mobile" onPointerDown={(e) => e.stopPropagation()}>
              <div className="flex w-full flex-col items-center gap-2">
                <ScoreBoard end={endInfo} board={board} onSave={onSaveScore} />
                <button
                  className="board-again"
                  onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); handleRef.current?.primary(); }}
                >
                  JOGAR DE NOVO
                </button>
                {linkedinButton(true)}
              </div>
            </div>
          )}
        </div>
        <div className="mobile-pads">
          <div className="pad-slot">
            {showPad && <AnalogStick side="left" label="MOVER" hint="↑ pular" onAxis={onMoveAxis} />}
          </div>
          <div className="pad-slot">
            {showPad && (
              <>
                <AnalogStick side="right" label="MIRAR" hint="encostou, atirou" onAxis={onAimAxis} onActive={onAimTouch} />
                <button {...btn('bomb')} className="bomb-btn" aria-label="Bomba">
                  <Bomb className="h-6 w-6" />
                  <span>BOMBA</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ══════════════ 🖥️ DESKTOP — acabamento completo ══════════════
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b0b1d] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,215,0,0.07),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(0,255,136,0.05),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 retro-grid opacity-30" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center px-4 py-6">
        <header className="mb-4 flex w-full flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-3">
            <Gamepad2 className="h-5 w-5 text-emerald-400" strokeWidth={2.5} />
            <h1 className="font-pixel text-glow-gold text-sm tracking-wider text-amber-300 sm:text-lg md:text-xl">
              A FUGA DE BOBBY
            </h1>
            <Gamepad2 className="h-5 w-5 -scale-x-100 text-emerald-400" strokeWidth={2.5} />
          </div>
          <p className="font-mono text-[11px] tracking-[0.25em] text-slate-400 uppercase">
            portfólio interativo · Marcos Eduardo ·{' '}
            <span className="text-emerald-400">v7.0 covil do socram</span>
          </p>
        </header>

        <div
          ref={wrapRef}
          className="group relative aspect-[16/9] w-full max-w-5xl select-none"
          onPointerDown={() => { if (tapToConfirm && !showBoard) handleRef.current?.primary(); }}
        >
          <div className="absolute -inset-[6px] rounded-xl bg-gradient-to-b from-amber-300/60 via-amber-500/20 to-amber-300/60 blur-[2px]" />
          <div className="relative h-full w-full overflow-hidden rounded-lg border-[3px] border-amber-300/90 bg-black shadow-[0_0_45px_rgba(255,215,0,0.25)]">
            <canvas ref={canvasRef} width={800} height={450} className="absolute inset-0 h-full w-full [image-rendering:pixelated]" />
            <div className="pointer-events-none absolute inset-0 scanlines opacity-60" />
            <div className="pointer-events-none absolute inset-0 crt-vignette" />
            {sysButtons}
            {!showBoard && phase === 'DEFEAT' && endInfo && linkedinOverlay(false)}
            {!showBoard && phase === 'VICTORY' && endInfo && linkedinOverlay(true)}

            {/* 🏅 PLACAR — entra 8s depois, no lado direito da tela do jogo */}
            {showBoard && endInfo && (
              <div className="board-slot" onPointerDown={(e) => e.stopPropagation()}>
                <ScoreBoard end={endInfo} board={board} onSave={onSaveScore} />
                <button className="board-again" onClick={() => handleRef.current?.primary()}>
                  JOGAR DE NOVO
                </button>
                {linkedinButton(true)}
              </div>
            )}
          </div>
        </div>

        <footer className="mt-4 flex w-full flex-col items-center gap-3">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-mono text-[10px] tracking-[0.18em] text-slate-400 sm:text-[11px]">
            <Keyboard className="h-4 w-4 text-slate-500" />
            <span>← → MOVER</span><span className="text-slate-600">|</span>
            <span>↑ PULAR</span><span className="text-slate-600">|</span>
            <span>ESPAÇO ATIRAR</span><span className="text-slate-600">|</span>
            <span>↓ AGACHAR</span><span className="text-slate-600">|</span>
            <span className="text-amber-300">B BOMBA</span><span className="text-slate-600">|</span>
            <span>P PAUSA</span><span className="text-slate-600">|</span>
            <span>M SOM</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 font-mono text-[10px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-emerald-400" />
              Marcos Eduardo + Bobby IA
            </span>
            <span className="flex items-center gap-1.5">
              <Bomb className="h-3 w-3 text-amber-400" />
              2 foguetes vermelhos = 1 bomba
            </span>
            <span className="flex items-center gap-1.5">
              <Bug className="h-3 w-3 text-rose-400" />
              visor e propulsores = pontos fracos do Socram
            </span>
          </div>

          {(phase === 'DEFEAT' || phase === 'VICTORY') && endInfo && (
            <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
              {endInfo.win ? <Trophy className="h-3.5 w-3.5 text-amber-300" /> : <Skull className="h-3.5 w-3.5 text-rose-400" />}
              <span>
                pontos: <b className="text-white">{endInfo.score}</b> · recorde:{' '}
                <b className="text-amber-300">{endInfo.high}</b>
              </span>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}
