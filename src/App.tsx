import { useEffect, useRef, type ReactNode } from 'react';
import { createGame } from './game/engine';

/* Logo pixel do Bobby em SVG */
function BobbyLogo() {
  return (
    <svg width="42" height="42" viewBox="0 0 12 12" shapeRendering="crispEdges" aria-hidden className="drop-shadow-[0_0_8px_rgba(0,204,102,0.7)]">
      <rect x="3" y="0" width="6" height="1" fill="#00cc66" />
      <rect x="1" y="1" width="10" height="9" fill="#00cc66" />
      <rect x="2" y="10" width="8" height="1" fill="#00cc66" />
      <rect x="2" y="3" width="3" height="3" fill="#fff" />
      <rect x="7" y="3" width="3" height="3" fill="#fff" />
      <rect x="3" y="4" width="1" height="1" fill="#003311" />
      <rect x="8" y="4" width="1" height="1" fill="#003311" />
      <rect x="3" y="7" width="6" height="2" fill="#0f0" />
      <rect x="4" y="8" width="4" height="1" fill="#004422" />
    </svg>
  );
}

function KeyCap({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <span
      className={`inline-flex h-7 items-center justify-center rounded border border-[#3a466e] border-b-[3px] border-b-[#232c4a] bg-[#1a2138] px-1.5 font-term text-[15px] leading-none text-[#ffd700] shadow-[0_2px_0_rgba(0,0,0,0.4)] ${
        wide ? 'min-w-16' : 'min-w-7'
      }`}
    >
      {children}
    </span>
  );
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !overlayRef.current) return;
    const game = createGame(canvasRef.current, overlayRef.current);
    return () => game.destroy();
  }, []);

  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden bg-[#0c101d] text-[#e8ecf4] selection:bg-[#ffd700]/30">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(900px 480px at 10% -12%, rgba(255,215,0,0.08), transparent 62%), radial-gradient(820px 540px at 96% 112%, rgba(0,255,136,0.07), transparent 62%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,215,0,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,215,0,0.045) 1px, transparent 1px)',
          backgroundSize: '42px 42px',
        }}
      />
      <div aria-hidden className="scanlines pointer-events-none fixed inset-0 z-40" />
      <div aria-hidden className="vignette pointer-events-none fixed inset-0 z-40" />

      <header className="relative z-10 flex items-center justify-between gap-3 border-b border-[#ffd700]/15 bg-[#0e1322]/80 px-4 py-2.5 backdrop-blur-sm">
        <div className="flex min-w-0 items-center gap-3">
          <BobbyLogo />
          <div className="min-w-0">
            <h1 className="title-glow truncate font-pixel text-[11px] text-[#ffd700] sm:text-[13px]">A FUGA DE BOBBY</h1>
            <p className="truncate font-term text-[15px] leading-tight text-[#8fa3c8]">
              O platformer do portfólio — orquestrado por Marcos Eduardo, executado pelo Bobby IA
            </p>
          </div>
        </div>
        <div className="hidden shrink-0 items-center gap-2 md:flex">
          <span className="rounded border border-[#2ecc71]/40 bg-[#2ecc71]/10 px-2 py-1 font-term text-[15px] uppercase tracking-wider text-[#2ecc71]">Música ×3</span>
          <span className="rounded border border-[#ffd700]/40 bg-[#ffd700]/10 px-2 py-1 font-term text-[15px] uppercase tracking-wider text-[#ffd700]">A Mina</span>
          <span className="rounded border border-[#e74c3c]/40 bg-[#e74c3c]/10 px-2 py-1 font-term text-[15px] uppercase tracking-wider text-[#e74c3c]">Boss fight</span>
        </div>
      </header>

      <main className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-2 py-3">
        <div className="w-full max-w-[860px]">
          <div className="relative overflow-hidden rounded-md border-[3px] border-[#ffd700] bg-black shadow-[0_0_45px_rgba(255,215,0,0.22)]">
            <canvas
              ref={canvasRef}
              width={800}
              height={450}
              className="game-canvas mx-auto block h-auto w-auto max-w-full"
              style={{ maxHeight: 'calc(100dvh - 200px)' }}
            />
          </div>

          <div className="mt-3 hidden flex-wrap items-center justify-center gap-x-4 gap-y-2 font-term text-[16px] text-[#8fa3c8] md:flex">
            <span className="flex items-center gap-1.5"><KeyCap>←</KeyCap><KeyCap>→</KeyCap> mover</span>
            <span className="flex items-center gap-1.5"><KeyCap>↑</KeyCap> pular</span>
            <span className="flex items-center gap-1.5"><KeyCap wide>ESPAÇO</KeyCap> atirar</span>
            <span className="flex items-center gap-1.5"><KeyCap>B</KeyCap> bomba</span>
            <span className="flex items-center gap-1.5"><KeyCap>↓</KeyCap> agachar</span>
          </div>
          <div className="mt-2 flex items-center justify-center gap-2 font-term text-[15px] text-[#00ff88] md:hidden">
            <span className="blink-soft">●</span>
            joystick virtual · botão de tiro · puxe pra baixo pra agachar
          </div>
        </div>
      </main>

      <footer className="relative z-[35] border-t border-[#ffd700]/10 bg-[#0e1322]/80 px-4 py-1.5 text-center backdrop-blur-sm sm:py-2">
        <p className="font-term text-[13px] tracking-wide text-[#5c6b8a] sm:text-[15px]">
          © 2026 Marcos Eduardo — desenvolvido com <span className="text-[#00cc66]">Bobby IA</span> · pise no nome{' '}
          <span className="text-[#ffd700]">MARCOS</span> e veja o sol nascer
        </p>
      </footer>

      <canvas ref={overlayRef} className="pointer-events-none fixed inset-0 z-30 h-full w-full" />
    </div>
  );
}
