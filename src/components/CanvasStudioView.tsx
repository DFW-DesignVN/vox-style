import React from 'react';
import {
  Layers,
  Sparkles,
  RefreshCw,
  Scissors,
  Upload,
  Plus,
  ArrowRight,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { CanvasPlayer } from './CanvasPlayer.tsx';
import { StoryboardView } from './StoryboardView.tsx';
import { Project, Shot } from '../types.ts';

interface CanvasStudioViewProps {
  project: Project;
  activeShotIndex: number;
  setActiveShotIndex: (idx: number) => void;
  onUpdateShot: (index: number, updated: Partial<Shot>) => void;
  onRegenerateShotLayout: (index: number) => void;
  onRegenerateShotMotion: (index: number) => void;
  onGenerateShotAsset?: (shotIndex: number, assetId: string) => void;
  onUploadShotAsset?: (shotIndex: number, assetId: string, file: File) => void;
  generatingAssetKey?: string | null;
  onOpenInspector: () => void;
}

export const CanvasStudioView: React.FC<CanvasStudioViewProps> = ({
  project,
  activeShotIndex,
  setActiveShotIndex,
  onUpdateShot,
  onRegenerateShotLayout,
  onRegenerateShotMotion,
  onGenerateShotAsset,
  onUploadShotAsset,
  generatingAssetKey,
  onOpenInspector,
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Top Main Focus: Large Video Canvas Stage */}
      <div className="w-full flex flex-col gap-3">
        <CanvasPlayer
          project={project}
          activeShotIndex={activeShotIndex}
          setActiveShotIndex={setActiveShotIndex}
        />
      </div>

      {/* Storyboard & Asset Engine Strip */}
      <div className="w-full flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <h3 className="font-editorial text-base font-bold text-zinc-100 uppercase tracking-tight">
              Storyboard Sequences ({project.shots.length} Shots • {project.duration}s)
            </h3>
          </div>

          <button
            onClick={onOpenInspector}
            className="flex items-center gap-1 text-xs font-mono text-amber-400 hover:text-amber-300 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 transition"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Open Asset Inspector</span>
          </button>
        </div>

        {/* Storyboard Card Grid */}
        <StoryboardView
          project={project}
          activeShotIndex={activeShotIndex}
          setActiveShotIndex={setActiveShotIndex}
          onUpdateShot={onUpdateShot}
          onRegenerateShotLayout={onRegenerateShotLayout}
          onRegenerateShotMotion={onRegenerateShotMotion}
          onGenerateShotAsset={onGenerateShotAsset}
          onUploadShotAsset={onUploadShotAsset}
          generatingAssetKey={generatingAssetKey}
        />
      </div>
    </div>
  );
};
