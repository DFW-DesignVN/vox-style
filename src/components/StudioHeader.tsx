import React from 'react';
import {
  Film,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  Download,
  BookOpen,
} from 'lucide-react';
import { StudioTab } from './StudioSidebar.tsx';

interface StudioHeaderProps {
  projectTitle: string;
  duration: number;
  ffmpegAvailable: boolean | null;
  onLoadBenchmark: () => void;
  isLoading: boolean;
  activeTab: StudioTab;
  setActiveTab: (tab: StudioTab) => void;
  onOpenRenderModal: () => void;
  onOpenPresetDrawer: () => void;
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({
  projectTitle,
  duration,
  ffmpegAvailable,
  onLoadBenchmark,
  isLoading,
  activeTab,
  setActiveTab,
  onOpenRenderModal,
  onOpenPresetDrawer,
}) => {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950 px-5 py-3 flex items-center justify-between gap-4 z-40 shrink-0">
      {/* Brand & Project Identity */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-red-600 text-zinc-950 flex items-center justify-center font-editorial font-bold text-xl tracking-tighter shadow-sm">
          VOX
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-editorial text-base font-bold text-zinc-100 uppercase tracking-tight">
              Studio Engine
            </span>
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-zinc-900 text-amber-400 border border-amber-500/30">
              PRO V0.2
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 font-mono truncate max-w-sm">
            {projectTitle} ({duration}s)
          </p>
        </div>
      </div>

      {/* Center Tabs for Rapid Navigation */}
      <div className="hidden md:flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
        <button
          onClick={() => setActiveTab('canvas')}
          className={`px-3 py-1 text-xs font-mono rounded transition ${
            activeTab === 'canvas'
              ? 'bg-zinc-800 text-amber-300 font-bold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Canvas
        </button>
        <button
          onClick={() => setActiveTab('script')}
          className={`px-3 py-1 text-xs font-mono rounded transition ${
            activeTab === 'script'
              ? 'bg-zinc-800 text-amber-300 font-bold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Script & Beats
        </button>
        <button
          onClick={() => setActiveTab('inspector')}
          className={`px-3 py-1 text-xs font-mono rounded transition ${
            activeTab === 'inspector'
              ? 'bg-zinc-800 text-amber-300 font-bold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Prompt Studio
        </button>
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-1 text-xs font-mono rounded transition ${
            activeTab === 'overview'
              ? 'bg-zinc-800 text-amber-300 font-bold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Brief
        </button>
      </div>

      {/* Right Utility Buttons */}
      <div className="flex items-center gap-2.5">
        {/* FFmpeg Status Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs font-mono">
          {ffmpegAvailable === true ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300 text-[11px]">FFmpeg Ready</span>
            </>
          ) : ffmpegAvailable === false ? (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-rose-300 text-[11px]">No FFmpeg</span>
            </>
          ) : (
            <span className="text-zinc-400 text-[11px]">Checking...</span>
          )}
        </div>

        {/* Preset Library Drawer Button */}
        <button
          onClick={onOpenPresetDrawer}
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-xs font-mono text-zinc-300 transition"
          title="Open Layout and Motion Presets Drawer"
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
          <span>Presets</span>
        </button>

        {/* Load Benchmark */}
        <button
          onClick={onLoadBenchmark}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-amber-300 text-xs font-mono transition border border-amber-500/20 active:scale-95 disabled:opacity-50"
          title="Reload 1929 Wall Street benchmark"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">1929 Demo</span>
        </button>

        {/* Export Render Button */}
        <button
          onClick={onOpenRenderModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-mono font-bold transition shadow-md shadow-red-950/40 active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export 1080p</span>
        </button>
      </div>
    </header>
  );
};
