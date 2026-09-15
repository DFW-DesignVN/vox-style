import React, { useState } from 'react';
import {
  FileText,
  Clock,
  Sparkles,
  Volume2,
  RefreshCw,
  Edit2,
  Check,
  Play,
  ArrowRight,
} from 'lucide-react';
import { Project, Shot, Beat } from '../types.ts';

interface ScriptEditorViewProps {
  project: Project;
  onUpdateProjectScript: (script: string) => void;
  activeShotIndex: number;
  setActiveShotIndex: (idx: number) => void;
  onJumpToShot: (shotIdx: number) => void;
  onGenerateVoiceAndTimeline?: () => void;
  isGeneratingVoice?: boolean;
}

export const ScriptEditorView: React.FC<ScriptEditorViewProps> = ({
  project,
  onUpdateProjectScript,
  activeShotIndex,
  setActiveShotIndex,
  onJumpToShot,
  onGenerateVoiceAndTimeline,
  isGeneratingVoice = false,
}) => {
  const [isEditingFullScript, setIsEditingFullScript] = useState<boolean>(false);
  const [scriptDraft, setScriptDraft] = useState<string>(project.script || '');

  const wordCount = (project.script || '').trim().split(/\s+/).filter(Boolean).length;
  const estimatedSeconds = Math.round((wordCount / 150) * 60); // 150 WPM documentary standard
  const allBeats: Beat[] = project.audioTimeline?.beats || [];

  const handleSaveScript = () => {
    onUpdateProjectScript(scriptDraft);
    setIsEditingFullScript(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 max-w-5xl mx-auto w-full">
      {/* Script Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-editorial font-bold text-zinc-100 uppercase tracking-tight">
              Documentary Script & Beat Sync
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1 font-sans-body">
            Each sentence corresponds to a visual documentary shot. Click any sentence to sync the video canvas directly.
          </p>
        </div>

        {/* Script Metrics Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800 text-xs font-mono">
            <div>
              <span className="text-zinc-500">Words:</span>{' '}
              <span className="text-zinc-200 font-bold">{wordCount}</span>
            </div>
            <div>
              <span className="text-zinc-500">Duration:</span>{' '}
              <span className="text-amber-400 font-bold">{project.duration}s</span>
            </div>
            <div>
              <span className="text-zinc-500">Pace:</span>{' '}
              <span className="text-zinc-300">~150 WPM</span>
            </div>
          </div>

          {onGenerateVoiceAndTimeline && (
            <button
              onClick={onGenerateVoiceAndTimeline}
              disabled={isGeneratingVoice}
              className="flex items-center gap-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg text-xs font-mono font-bold transition active:scale-95 disabled:opacity-50"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isGeneratingVoice ? 'Synthesizing...' : 'Generate Voice & Beats'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Full Script Quick Editor */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
            Full Master Narration
          </span>
          {!isEditingFullScript ? (
            <button
              onClick={() => {
                setScriptDraft(project.script);
                setIsEditingFullScript(true);
              }}
              className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-mono"
            >
              <Edit2 className="w-3 h-3" />
              <span>Edit Master Script</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditingFullScript(false)}
                className="text-xs text-zinc-400 hover:text-zinc-200 font-mono px-2 py-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveScript}
                className="flex items-center gap-1 text-xs bg-amber-500 text-zinc-950 font-bold px-2.5 py-1 rounded font-mono"
              >
                <Check className="w-3 h-3" />
                <span>Save</span>
              </button>
            </div>
          )}
        </div>

        {isEditingFullScript ? (
          <textarea
            value={scriptDraft}
            onChange={(e) => setScriptDraft(e.target.value)}
            rows={4}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-zinc-200 font-typewriter text-sm focus:outline-none focus:border-amber-400 leading-relaxed"
          />
        ) : (
          <p className="text-sm font-typewriter text-zinc-300 leading-relaxed bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/60">
            "{project.script}"
          </p>
        )}
      </div>

      {/* Shot-by-Shot Synchronized Script Sentences */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider font-bold text-zinc-400">
            Shot Sentences & Beat Breakdown ({project.shots.length} Sequences)
          </span>
          <span className="text-[11px] font-mono text-zinc-500">
            Click shot row to jump preview directly
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          {project.shots.map((shot, idx) => {
            const isSelected = activeShotIndex === idx;
            const shotBeats = allBeats.filter((b) => b.shotId === shot.shot_id);

            return (
              <div
                key={shot.shot_id}
                onClick={() => onJumpToShot(idx)}
                className={`p-4 rounded-xl border transition cursor-pointer flex flex-col gap-2.5 ${
                  isSelected
                    ? 'bg-zinc-900 border-amber-500/80 shadow-md shadow-amber-950/20 ring-1 ring-amber-500/50'
                    : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-amber-300 border border-zinc-700">
                      SHOT 0{shot.order}
                    </span>
                    <span className="text-xs font-mono text-zinc-400 uppercase">
                      {shot.layout} Layout
                    </span>
                    <span className="text-xs font-mono text-zinc-500">
                      {shot.duration}s ({shot.start}s - {shot.end}s)
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onJumpToShot(idx);
                    }}
                    className="flex items-center gap-1 text-[11px] font-mono text-amber-400 hover:text-amber-300 px-2 py-1 rounded bg-amber-400/10"
                  >
                    <span>Jump to Canvas</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Narration sentence */}
                <div className="font-typewriter text-zinc-200 text-sm leading-relaxed pl-2 border-l-2 border-amber-500/40">
                  "{shot.narration}"
                </div>

                {/* Beat pills if audio timeline generated */}
                {shotBeats.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-mono text-zinc-500 mr-1">Beats:</span>
                    {shotBeats.map((b, bIdx) => (
                      <span
                        key={b.id}
                        title={`Beat ${bIdx + 1}: ${b.visualCue}`}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700"
                      >
                        "{b.text}" ({b.duration}s)
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
