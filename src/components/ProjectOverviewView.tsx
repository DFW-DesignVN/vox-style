import React from 'react';
import {
  FolderKanban,
  Sparkles,
  Clock,
  BookOpen,
  FileText,
  Sliders,
  Scissors,
  Loader2,
  CheckCircle2,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Project } from '../types.ts';

interface ProjectOverviewViewProps {
  project: Project;
  topic: string;
  setTopic: (val: string) => void;
  duration: number;
  setDuration: (val: number) => void;
  onGenerateStoryboard: () => void;
  isGenerating: boolean;
  onJumpToCanvas: () => void;
}

const TOPIC_SUGGESTIONS = [
  'The Day Wall Street Crashed (1929)',
  'Apollo 11: The 1202 Computer Alarm',
  'The Fall of the Berlin Wall (1989)',
  'The Manhattan Project Trinity Test (1945)',
  'The Sinking of the Titanic (1912)',
];

export const ProjectOverviewView: React.FC<ProjectOverviewViewProps> = ({
  project,
  topic,
  setTopic,
  duration,
  setDuration,
  onGenerateStoryboard,
  isGenerating,
  onJumpToCanvas,
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-editorial font-bold text-zinc-100 uppercase tracking-tight">
              Project Brief & AI Director Workspace
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1 font-sans-body">
            Define documentary scope, historical topic, narrative duration, and orchestrate automated pipeline generation.
          </p>
        </div>

        <button
          onClick={onJumpToCanvas}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-xs font-mono font-semibold transition"
        >
          <span>Open Canvas</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Project Brief Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>Documentary Parameters</span>
          </span>
          <span className="text-xs font-mono text-zinc-500">VOX Archival Collage Standard</span>
        </div>

        {/* Topic Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-mono text-zinc-300 font-semibold uppercase">
            Documentary Topic or Historical Beat:
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. The Day Wall Street Crashed"
            className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 font-sans-body transition"
          />
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono text-zinc-500">Fast Presets:</span>
          {TOPIC_SUGGESTIONS.map((preset) => (
            <button
              key={preset}
              onClick={() => setTopic(preset)}
              className="text-xs font-sans-body px-2.5 py-1 rounded bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition active:scale-95"
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Grid of specs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-zinc-800/80">
          {/* Target Duration */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-zinc-400 font-semibold">Target Duration:</label>
            <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
              {[20, 25, 30, 60].map((sec) => (
                <button
                  key={sec}
                  onClick={() => setDuration(sec)}
                  className={`flex-1 py-1 text-xs font-mono font-medium rounded transition ${
                    duration === sec
                      ? 'bg-amber-400 text-zinc-950 font-bold shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>

          {/* Visual Style */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-zinc-400 font-semibold">Visual Style:</label>
            <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800 text-xs font-mono text-zinc-300">
              Paper Collage • Scissor Cuts
            </div>
          </div>

          {/* Master Resolution */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-zinc-400 font-semibold">Output Spec:</label>
            <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800 text-xs font-mono text-zinc-300">
              1920×1080 • 30 FPS • H.264
            </div>
          </div>
        </div>

        {/* Generate Trigger */}
        <div className="pt-3 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onGenerateStoryboard}
            disabled={isGenerating || !topic.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-mono font-bold text-xs rounded-lg transition disabled:opacity-50 shadow-md shadow-red-950/50"
          >
            <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'DIRECTING STORYBOARD...' : 'GENERATE FULL PROJECT STORYBOARD'}</span>
          </button>
        </div>
      </div>

      {/* Active Project Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Storyboard Summary */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Sequence Structure</span>
            </span>
            <span className="text-xs font-mono text-amber-400">{project.shots.length} Shots</span>
          </div>

          <p className="text-xs text-zinc-400 font-sans-body">
            Active storyboard directed into {project.shots.length} distinct historical scenes with procedural aged background textures and custom cutout elements.
          </p>

          <div className="flex flex-col gap-1.5 pt-1">
            {project.shots.map((s, idx) => (
              <div
                key={s.shot_id}
                className="flex items-center justify-between text-xs font-mono bg-zinc-950/60 p-2 rounded border border-zinc-800/80 text-zinc-300"
              >
                <span>Shot 0{s.order} • {s.layout}</span>
                <span className="text-zinc-500">{s.duration}s</span>
              </div>
            ))}
          </div>
        </div>

        {/* Narration Preview */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Voiceover Narration</span>
            </span>
            <span className="text-xs font-mono text-emerald-400">
              {project.voiceUrl ? 'Audio Synced' : 'Ready for TTS'}
            </span>
          </div>

          <p className="text-xs font-typewriter text-zinc-300 leading-relaxed bg-zinc-950/60 p-3 rounded border border-zinc-800/80 flex-1">
            "{project.script}"
          </p>
        </div>
      </div>
    </div>
  );
};
