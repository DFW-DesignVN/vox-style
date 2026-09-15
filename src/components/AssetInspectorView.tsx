import React, { useState } from 'react';
import {
  Sliders,
  Sparkles,
  RefreshCw,
  Upload,
  Layers,
  Scissors,
  Eye,
  CheckCircle2,
  AlertCircle,
  Copy,
  ChevronRight,
  Move,
} from 'lucide-react';
import { Project, Shot, VisualAsset } from '../types.ts';
import { VOX_LAYOUTS, VOX_MOTIONS } from '../presets/index.ts';

interface AssetInspectorViewProps {
  project: Project;
  activeShotIndex: number;
  setActiveShotIndex: (idx: number) => void;
  onUpdateShot: (index: number, updated: Partial<Shot>) => void;
  onGenerateShotAsset?: (shotIndex: number, assetId: string) => void;
  onUploadShotAsset?: (shotIndex: number, assetId: string, file: File) => void;
  generatingAssetKey?: string | null;
}

export const AssetInspectorView: React.FC<AssetInspectorViewProps> = ({
  project,
  activeShotIndex,
  setActiveShotIndex,
  onUpdateShot,
  onGenerateShotAsset,
  onUploadShotAsset,
  generatingAssetKey,
}) => {
  const activeShot = project.shots[activeShotIndex] || project.shots[0];
  const heroAsset = activeShot?.assets.find((a) => a.role === 'hero') || activeShot?.assets[0];

  const [promptText, setPromptText] = useState<string>(heroAsset?.assetPrompt || '');
  const [negativePrompt, setNegativePrompt] = useState<string>(
    'cartoon, 3d render, modern elements, glossy, oversaturated, watermark, bad anatomy'
  );

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleUpdateHeroPrompt = () => {
    if (!heroAsset) return;
    const newAssets = activeShot.assets.map((a) =>
      a.id === heroAsset.id ? { ...a, assetPrompt: promptText } : a
    );
    onUpdateShot(activeShotIndex, { assets: newAssets });
  };

  const handleMotionChange = (newMotion: any) => {
    if (!heroAsset) return;
    const newAssets = activeShot.assets.map((a) =>
      a.id === heroAsset.id ? { ...a, motion: newMotion } : a
    );
    onUpdateShot(activeShotIndex, { assets: newAssets });
  };

  const handleLayoutChange = (newLayout: any) => {
    onUpdateShot(activeShotIndex, { layout: newLayout });
  };

  const handleBackgroundChange = (bgType: any) => {
    onUpdateShot(activeShotIndex, {
      background: { ...activeShot.background, type: bgType },
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 max-w-5xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-editorial font-bold text-zinc-100 uppercase tracking-tight">
              Prompt Studio & Asset Inspector
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1 font-sans-body">
            Configure visual collage elements, AI generation prompts, scissor-cut borders, and stop-motion physics.
          </p>
        </div>

        {/* Shot Switcher Tabs */}
        <div className="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
          {project.shots.map((s, idx) => (
            <button
              key={s.shot_id}
              onClick={() => {
                setActiveShotIndex(idx);
                const hero = s.assets.find((a) => a.role === 'hero');
                setPromptText(hero?.assetPrompt || '');
              }}
              className={`px-3 py-1 rounded text-xs font-mono transition ${
                activeShotIndex === idx
                  ? 'bg-amber-400 text-zinc-950 font-bold shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Shot 0{idx + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Prompt Studio & Asset Details */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Master & Shot Prompt Studio */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Visual Prompt Studio (Shot 0{activeShotIndex + 1})</span>
              </span>
              <span className="text-[11px] font-mono text-zinc-500">
                1920x1080 Archival Cutout
              </span>
            </div>

            {/* Prompt Textarea */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-zinc-400 font-semibold">
                Visual Concept Prompt:
              </label>
              <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                onBlur={handleUpdateHeroPrompt}
                rows={3}
                placeholder="Describe historical archival photograph or document..."
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-zinc-200 font-mono text-xs focus:outline-none focus:border-amber-400 leading-relaxed"
              />
            </div>

            {/* Negative Prompt */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-zinc-500 font-semibold">
                Negative Prompt:
              </label>
              <input
                type="text"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-400 font-mono text-xs focus:outline-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800/80">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleUpdateHeroPrompt();
                    if (heroAsset && onGenerateShotAsset) {
                      onGenerateShotAsset(activeShotIndex, heroAsset.id);
                    }
                  }}
                  disabled={generatingAssetKey === `${activeShotIndex}_${heroAsset?.id}`}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg font-mono text-xs font-bold transition active:scale-95 disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {generatingAssetKey === `${activeShotIndex}_${heroAsset?.id}`
                      ? 'Generating Archival Photo...'
                      : 'Generate with AI'}
                  </span>
                </button>

                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && heroAsset && onUploadShotAsset) {
                      onUploadShotAsset(activeShotIndex, heroAsset.id, file);
                    }
                  }}
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-mono text-xs transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Local File</span>
                </button>
              </div>

              {heroAsset?.status === 'ready' && (
                <span className="flex items-center gap-1 text-xs font-mono text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Ready on Canvas</span>
                </span>
              )}
            </div>
          </div>

          {/* Cutout & Motion Controls */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5 text-amber-400" />
              <span>Physical Collage & Stop-Motion Parameters</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Motion Dropdown */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono text-zinc-400">Motion Animation:</label>
                <select
                  value={heroAsset?.motion || 'paper_drop'}
                  onChange={(e) => handleMotionChange(e.target.value)}
                  className="bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-amber-400"
                >
                  {VOX_MOTIONS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Layout Preset Dropdown */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono text-zinc-400">Layout Preset:</label>
                <select
                  value={activeShot?.layout || 'hero_archive'}
                  onChange={(e) => handleLayoutChange(e.target.value)}
                  className="bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-amber-400"
                >
                  {VOX_LAYOUTS.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Background Texture Type */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono text-zinc-400">Aged Paper Background:</label>
                <select
                  value={activeShot?.background.type || 'newsprint'}
                  onChange={(e) => handleBackgroundChange(e.target.value)}
                  className="bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-amber-400"
                >
                  <option value="newsprint">Vintage Newsprint with Columns</option>
                  <option value="archival">Archival Document Cream</option>
                  <option value="map">Vintage Cartographic Map</option>
                  <option value="corkboard">Investigation Corkboard</option>
                  <option value="cream_aged">Clean Aged Parchment</option>
                </select>
              </div>

              {/* Scissor cut border toggle */}
              <div className="flex flex-col gap-1.5 justify-center">
                <label className="text-xs font-mono text-zinc-400">Physical Border:</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="checkbox"
                    id="paperCutoutCheck"
                    checked={heroAsset?.paperCutout !== false}
                    onChange={(e) => {
                      if (!heroAsset) return;
                      const newAssets = activeShot.assets.map((a) =>
                        a.id === heroAsset.id ? { ...a, paperCutout: e.target.checked } : a
                      );
                      onUpdateShot(activeShotIndex, { assets: newAssets });
                    }}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                  <label htmlFor="paperCutoutCheck" className="text-xs font-mono text-zinc-300 cursor-pointer">
                    Irregular Scissor-Cut Edge
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Asset Preview Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
            Active Asset Cutout
          </span>

          <div className="w-full aspect-4/3 bg-zinc-950 rounded-lg border border-zinc-800 flex items-center justify-center overflow-hidden relative p-4">
            {heroAsset?.source ? (
              <img
                src={heroAsset.source}
                alt="Cutout Asset"
                className="max-w-full max-h-full object-contain filter drop-shadow-lg"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-zinc-500 font-mono text-xs">
                <Layers className="w-8 h-8 text-zinc-600" />
                <span>No Asset Loaded</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 text-xs font-mono text-zinc-400 bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/80">
            <div className="flex justify-between">
              <span className="text-zinc-500">Asset Role:</span>
              <span className="text-zinc-200 uppercase">{heroAsset?.role || 'hero'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Scale / Rotation:</span>
              <span className="text-zinc-200">
                {heroAsset?.scale || 1.0}x / {heroAsset?.rotation || 0}°
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Stop-Motion:</span>
              <span className="text-amber-400">{heroAsset?.motion || 'paper_drop'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
