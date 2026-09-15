import React from 'react';
import { Video, Film, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface HeaderProps {
  ffmpegAvailable: boolean | null;
  onLoadBenchmark: () => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  ffmpegAvailable,
  onLoadBenchmark,
  isLoading,
}) => {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-40 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Logo & Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-600 text-zinc-950 flex items-center justify-center font-editorial font-bold text-2xl tracking-tighter shadow-md shadow-red-950/40">
            VOX
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-editorial text-xl font-bold tracking-tight text-zinc-100 uppercase">
                Auto Video Engine
              </h1>
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-zinc-800 text-amber-400 border border-amber-500/30">
                PROTOTYPE V0.1
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-sans-body">
              Documentary Paper Collage • Stop-Motion Motion Engine • FFmpeg 1080p
            </p>
          </div>
        </div>

        {/* Engine Specs & Badges */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300">
            <Film className="w-3.5 h-3.5 text-zinc-400" />
            <span>1920×1080 • 30 FPS</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-xs font-mono">
            {ffmpegAvailable === true ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">FFmpeg Ready</span>
              </>
            ) : ffmpegAvailable === false ? (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-rose-300">FFmpeg Not Found</span>
              </>
            ) : (
              <span className="text-zinc-400">Checking FFmpeg...</span>
            )}
          </div>

          {/* Benchmark Load Button */}
          <button
            onClick={onLoadBenchmark}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-xs font-mono font-medium transition border border-amber-400/20 active:scale-95 disabled:opacity-50"
            title="Load Section 38 benchmark test case (1929 Wall Street Crash)"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Load 1929 Benchmark</span>
          </button>
        </div>
      </div>
    </header>
  );
};
