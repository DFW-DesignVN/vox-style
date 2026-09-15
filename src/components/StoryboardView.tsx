import React, { useState, useRef } from 'react';
import {
  Layers,
  RefreshCw,
  Edit3,
  Scissors,
  Upload,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Project, Shot, VisualAsset } from '../types.ts';
import { VOX_LAYOUTS } from '../presets/index.ts';

interface StoryboardViewProps {
  project: Project;
  activeShotIndex: number;
  setActiveShotIndex: (idx: number) => void;
  onUpdateShot: (index: number, updated: Partial<Shot>) => void;
  onRegenerateShotLayout: (index: number) => void;
  onRegenerateShotMotion: (index: number) => void;
  onGenerateShotAsset?: (shotIndex: number, assetId: string) => void;
  onUploadShotAsset?: (shotIndex: number, assetId: string, file: File) => void;
  generatingAssetKey?: string | null;
}

export const StoryboardView: React.FC<StoryboardViewProps> = ({
  project,
  activeShotIndex,
  setActiveShotIndex,
  onUpdateShot,
  onRegenerateShotLayout,
  onRegenerateShotMotion,
  onGenerateShotAsset,
  onUploadShotAsset,
  generatingAssetKey,
}) => {
  const [editingShotIndex, setEditingShotIndex] = useState<number | null>(null);
  const [editHeadline, setEditHeadline] = useState<string>('');
  const [editDate, setEditDate] = useState<string>('');
  const [editPrompt, setEditPrompt] = useState<string>('');
  const [isEditingPrompt, setIsEditingPrompt] = useState<boolean>(false);

  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const startEdit = (idx: number, shot: Shot) => {
    setEditingShotIndex(idx);
    const hl =
      shot.text.find((t) => t.role === 'headline' || t.role === 'big_number')
        ?.content || '';
    const dt =
      shot.text.find((t) => t.role === 'date' || t.role === 'label')?.content ||
      '';
    const heroAsset = shot.assets.find((a) => a.role === 'hero');
    setEditHeadline(hl);
    setEditDate(dt);
    setEditPrompt(heroAsset?.assetPrompt || '');
    setIsEditingPrompt(false);
  };

  const saveEdit = (idx: number) => {
    const shot = project.shots[idx];
    const newText = shot.text.map((t) => {
      if (t.role === 'headline' || t.role === 'big_number') {
        return { ...t, content: editHeadline };
      }
      if (t.role === 'date' || t.role === 'label') {
        return { ...t, content: editDate };
      }
      return t;
    });

    const newAssets = shot.assets.map((a) => {
      if (a.role === 'hero' && editPrompt) {
        return { ...a, assetPrompt: editPrompt };
      }
      return a;
    });

    onUpdateShot(idx, { text: newText, assets: newAssets });
    setEditingShotIndex(null);
  };

  const handleFileChange = (
    shotIndex: number,
    assetId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file && onUploadShotAsset) {
      onUploadShotAsset(shotIndex, assetId, file);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <h2 className="font-editorial text-lg font-bold text-zinc-100 uppercase tracking-tight">
            Storyboard & Asset Engine ({project.shots.length} Shots • {project.duration}s)
          </h2>
        </div>
        <span className="text-xs font-mono text-zinc-400">
          AI Prompts • Cutouts • Layers • Motion
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {project.shots.map((shot, idx) => {
          const isActive = activeShotIndex === idx;
          const isEditing = editingShotIndex === idx;
          const heroAsset = shot.assets.find((a) => a.role === 'hero') || shot.assets[0];
          const isAssetGenerating =
            generatingAssetKey === `${idx}_${heroAsset?.id}` ||
            heroAsset?.status === 'generating';
          const isAssetReady = heroAsset?.status === 'ready' && !!heroAsset.source;

          return (
            <div
              key={shot.shot_id}
              onClick={() => setActiveShotIndex(idx)}
              className={`border rounded-xl p-4 flex flex-col justify-between transition cursor-pointer relative overflow-hidden ${
                isActive
                  ? 'bg-zinc-950 border-amber-500/80 shadow-md shadow-amber-950/20'
                  : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {/* Hidden file input for custom archival image upload */}
              <input
                type="file"
                accept="image/*"
                ref={(el) => (fileInputRefs.current[`${idx}_${heroAsset?.id}`] = el)}
                className="hidden"
                onChange={(e) => heroAsset && handleFileChange(idx, heroAsset.id, e)}
              />

              {/* Top Meta Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-zinc-800 text-amber-300 font-mono text-xs flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-mono font-bold text-zinc-200">
                      {shot.shot_id.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300">
                      {shot.duration}s
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-red-950/70 border border-red-800/80 text-red-300 uppercase">
                      {shot.layout}
                    </span>
                  </div>
                </div>

                {/* Narration Script Quote */}
                <div className="bg-zinc-900/90 rounded p-2.5 mb-3 border border-zinc-800/60">
                  <p className="text-xs font-sans-body text-zinc-300 italic line-clamp-2">
                    "{shot.narration}"
                  </p>
                </div>

                {/* Asset Engine Card: Cutout Thumbnail, Status & Prompt */}
                <div className="bg-zinc-900/90 rounded-lg p-3 border border-zinc-800 mb-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                      <Scissors className="w-3 h-3" />
                      Visual Asset Cutout
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        isAssetGenerating
                          ? 'bg-blue-950 text-blue-300 border border-blue-800 animate-pulse'
                          : isAssetReady
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {isAssetGenerating ? 'Cutting...' : isAssetReady ? 'Ready' : 'Pending'}
                    </span>
                  </div>

                  {/* Visual Asset Thumbnail Preview */}
                  <div className="relative h-28 w-full bg-zinc-950 rounded border border-zinc-800/80 overflow-hidden flex items-center justify-center">
                    {heroAsset?.source ? (
                      <div className="relative w-full h-full p-2 flex items-center justify-center">
                        {/* Cutout Paper Backing */}
                        <div className="relative max-h-full max-w-full bg-[#F4EEDA] p-1 shadow-md shadow-black/60 rotate-[-1deg] border border-[#D5C6A5]">
                          <img
                            src={heroAsset.source}
                            alt="Cutout Asset"
                            className="max-h-20 object-contain grayscale contrast-125"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-2 text-center text-zinc-500 font-mono text-[11px] gap-1">
                        <Scissors className="w-5 h-5 text-amber-500/60" />
                        <span className="text-amber-300/80">Pending Asset Cutout</span>
                        <span className="text-[9px] text-zinc-600">Prompt planned by Director</span>
                      </div>
                    )}
                  </div>

                  {/* AI Asset Prompt Text */}
                  <div className="bg-zinc-950/80 p-2 rounded border border-zinc-800/60 text-[11px] font-mono">
                    <span className="text-zinc-500 block text-[9px] uppercase">Asset Prompt:</span>
                    <p className="text-zinc-300 line-clamp-2 italic">
                      "{heroAsset?.assetPrompt || 'Archival photograph suitable for paper collage'}"
                    </p>
                  </div>

                  {/* Asset Generation Action Buttons */}
                  <div
                    className="flex items-center gap-1.5 pt-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {onGenerateShotAsset && heroAsset && (
                      <button
                        onClick={() => onGenerateShotAsset(idx, heroAsset.id)}
                        disabled={isAssetGenerating}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-amber-600 hover:bg-amber-500 active:scale-95 text-zinc-950 text-[11px] font-mono font-bold transition disabled:opacity-50"
                        title="Generate AI archival image for this shot"
                      >
                        {isAssetGenerating ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        <span>{isAssetReady ? 'Regenerate' : 'Generate'}</span>
                      </button>
                    )}

                    <button
                      onClick={() =>
                        heroAsset && fileInputRefs.current[`${idx}_${heroAsset.id}`]?.click()
                      }
                      className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-mono transition"
                      title="Upload custom archival photo for cutout"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Upload</span>
                    </button>
                  </div>
                </div>

                {/* Inline Edit Form for Text & Headlines */}
                {isEditing ? (
                  <div
                    className="bg-zinc-900 p-2.5 rounded-lg border border-zinc-700 mb-3 space-y-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div>
                      <label className="text-[10px] font-mono text-zinc-400 block mb-0.5">
                        Date / Label
                      </label>
                      <input
                        type="text"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="w-full text-xs font-typewriter bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-zinc-200"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-zinc-400 block mb-0.5">
                        Headline
                      </label>
                      <input
                        type="text"
                        value={editHeadline}
                        onChange={(e) => setEditHeadline(e.target.value)}
                        className="w-full text-xs font-editorial bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-zinc-200 uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-zinc-400 block mb-0.5">
                        Asset Prompt
                      </label>
                      <textarea
                        rows={2}
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        className="w-full text-xs font-mono bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-zinc-200"
                      />
                    </div>
                    <div className="flex justify-end gap-1.5 pt-1">
                      <button
                        onClick={() => setEditingShotIndex(null)}
                        className="px-2 py-1 text-[11px] font-mono text-zinc-400 hover:text-zinc-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => saveEdit(idx)}
                        className="px-2.5 py-1 text-[11px] font-mono bg-amber-500 text-zinc-950 font-bold rounded"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-zinc-900/50 p-2 rounded border border-zinc-800 text-xs mb-3 font-mono">
                    <span className="text-zinc-500 block text-[10px]">Headlines:</span>
                    <p className="text-zinc-200 font-bold truncate">
                      {shot.text.find((t) => t.role === 'headline' || t.role === 'big_number')
                        ?.content || 'None'}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons: Section 31 (Regenerate Layout, Regenerate Motion, Edit) */}
              <div
                className="flex items-center gap-1.5 pt-2 border-t border-zinc-800/80"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => onRegenerateShotLayout(idx)}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-mono transition"
                  title="Regenerate shot layout structure"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Layout</span>
                </button>
                <button
                  onClick={() => onRegenerateShotMotion(idx)}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-mono transition"
                  title="Regenerate physical motion preset"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Motion</span>
                </button>
                <button
                  onClick={() => startEdit(idx, shot)}
                  className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-mono transition"
                  title="Edit shot text, headlines & prompt"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
