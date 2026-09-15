import React, { useState } from 'react';
import { Layers, RefreshCw, Eye, Edit3, Type, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import { Project, Shot, LayoutID, MotionID } from '../types.ts';
import { VOX_LAYOUTS, VOX_MOTIONS } from '../presets/index.ts';

interface StoryboardViewProps {
  project: Project;
  activeShotIndex: number;
  setActiveShotIndex: (idx: number) => void;
  onUpdateShot: (index: number, updated: Partial<Shot>) => void;
  onRegenerateShotLayout: (index: number) => void;
  onRegenerateShotMotion: (index: number) => void;
}

export const StoryboardView: React.FC<StoryboardViewProps> = ({
  project,
  activeShotIndex,
  setActiveShotIndex,
  onUpdateShot,
  onRegenerateShotLayout,
  onRegenerateShotMotion,
}) => {
  const [editingShotIndex, setEditingShotIndex] = useState<number | null>(null);
  const [editHeadline, setEditHeadline] = useState<string>('');
  const [editDate, setEditDate] = useState<string>('');

  const startEdit = (idx: number, shot: Shot) => {
    setEditingShotIndex(idx);
    const hl = shot.text.find((t) => t.role === 'headline' || t.role === 'big_number')?.content || '';
    const dt = shot.text.find((t) => t.role === 'date' || t.role === 'label')?.content || '';
    setEditHeadline(hl);
    setEditDate(dt);
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
    onUpdateShot(idx, { text: newText });
    setEditingShotIndex(null);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <h2 className="font-editorial text-lg font-bold text-zinc-100 uppercase tracking-tight">
            Storyboard & Shot Director ({project.shots.length} Shots • {project.duration}s)
          </h2>
        </div>
        <span className="text-xs font-mono text-zinc-400">
          Section 8: Beat Breakdown & Visual Grammar
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {project.shots.map((shot, idx) => {
          const isActive = activeShotIndex === idx;
          const isEditing = editingShotIndex === idx;
          const layoutMeta = VOX_LAYOUTS.find((l) => l.id === shot.layout);
          const heroAsset = shot.assets.find((a) => a.role === 'hero');

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
                  <p className="text-xs font-sans-body text-zinc-300 italic line-clamp-3">
                    "{shot.narration}"
                  </p>
                </div>

                {/* Visual Layers Summary */}
                <div className="space-y-1.5 text-xs font-mono text-zinc-400 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Hero Motion:</span>
                    <span className="text-zinc-300 font-semibold">{heroAsset?.motion || 'paper_drop'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Background:</span>
                    <span className="text-zinc-300">{shot.background.type}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Graphics:</span>
                    <span className="text-zinc-300">
                      {shot.graphics.map((g) => g.type).join(', ') || 'none'}
                    </span>
                  </div>
                </div>

                {/* Inline Edit Form for Text */}
                {isEditing ? (
                  <div
                    className="bg-zinc-900 p-2.5 rounded-lg border border-zinc-700 mb-3 space-y-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div>
                      <label className="text-[10px] font-mono text-zinc-400 block mb-0.5">Date / Label</label>
                      <input
                        type="text"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="w-full text-xs font-typewriter bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-zinc-200"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-zinc-400 block mb-0.5">Headline</label>
                      <input
                        type="text"
                        value={editHeadline}
                        onChange={(e) => setEditHeadline(e.target.value)}
                        className="w-full text-xs font-editorial bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-zinc-200 uppercase"
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
                      {shot.text.find((t) => t.role === 'headline' || t.role === 'big_number')?.content || 'None'}
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
                  title="Edit shot text & headlines"
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
