import React from 'react';
import { Sparkles, Clock, Layers, Scissors, CheckCircle, Loader2 } from 'lucide-react';

interface TopicDirectorProps {
  topic: string;
  setTopic: (val: string) => void;
  duration: number;
  setDuration: (val: number) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  totalShots: number;
  onGenerateAllAssets?: () => void;
  isGeneratingAssets?: boolean;
  pendingAssetsCount?: number;
}

const TOPIC_SUGGESTIONS = [
  'The Day Wall Street Crashed (1929)',
  'Apollo 11: The 1202 Computer Alarm',
  'The Fall of the Berlin Wall',
  'The Manhattan Project Trinity Test',
];

const PIPELINE_STEPS = [
  'Topic',
  'Script',
  'Beat',
  'AI Asset Prompts',
  'Generate Assets',
  'Cutout',
  'Layer Composition',
  'Motion',
  'FFmpeg',
];

export const TopicDirector: React.FC<TopicDirectorProps> = ({
  topic,
  setTopic,
  duration,
  setDuration,
  onGenerate,
  isGenerating,
  totalShots,
  onGenerateAllAssets,
  isGeneratingAssets = false,
  pendingAssetsCount = 0,
}) => {
  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
      {/* Pipeline Navigation Flow Visual */}
      <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800/80 overflow-x-auto">
        <div className="flex items-center gap-1.5 text-[10px] font-mono whitespace-nowrap min-w-max">
          <span className="text-zinc-500 font-bold uppercase tracking-wider mr-1">Pipeline:</span>
          {PIPELINE_STEPS.map((step, idx) => {
            const isAssetStep = step === 'AI Asset Prompts' || step === 'Generate Assets' || step === 'Cutout';
            return (
              <React.Fragment key={step}>
                <span
                  className={`px-1.5 py-0.5 rounded font-semibold transition ${
                    isAssetStep
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-800/80'
                      : idx <= 2
                      ? 'bg-zinc-800 text-zinc-300'
                      : 'bg-zinc-900 text-zinc-500'
                  }`}
                >
                  {step}
                </span>
                {idx < PIPELINE_STEPS.length - 1 && (
                  <span className="text-zinc-600">→</span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Top bar: label & duration buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-mono font-bold tracking-wider text-zinc-300 uppercase">
              AI Director & Asset Engine
            </span>
          </div>

          {/* Duration Selector: 20s, 25s, 30s as specified in Section 7 */}
          <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
            <Clock className="w-3.5 h-3.5 text-zinc-500 ml-2" />
            <span className="text-xs font-mono text-zinc-400 mr-2">Duration:</span>
            {[20, 25, 30].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setDuration(sec)}
                className={`px-3 py-1 text-xs font-mono font-medium rounded transition ${
                  duration === sec
                    ? 'bg-red-700 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>
        </div>

        {/* Topic Input Box & Primary Action Buttons */}
        <div>
          <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase">
            Documentary Topic or Historical Beat
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. The Day Wall Street Crashed"
              className="flex-1 px-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500 font-sans-body transition"
            />
            <div className="flex gap-2">
              <button
                onClick={onGenerate}
                disabled={isGenerating || !topic.trim()}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-mono font-semibold text-xs rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-red-950/50"
              >
                <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>{isGenerating ? 'DIRECTING...' : '1. DIRECT STORYBOARD'}</span>
              </button>

              {onGenerateAllAssets && (
                <button
                  onClick={onGenerateAllAssets}
                  disabled={isGeneratingAssets || totalShots === 0}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 active:scale-95 text-zinc-950 font-mono font-bold text-xs rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-amber-950/40"
                  title="Generate AI archival assets and cutouts for all shots"
                >
                  {isGeneratingAssets ? (
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                  ) : (
                    <Scissors className="w-4 h-4" />
                  )}
                  <span>
                    {isGeneratingAssets
                      ? 'CUTTING ASSETS...'
                      : pendingAssetsCount > 0
                      ? `2. CUT ALL ASSETS (${pendingAssetsCount})`
                      : '2. REGENERATE ASSETS'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-800/80">
          <span className="text-[11px] font-mono text-zinc-500">Fast Presets:</span>
          {TOPIC_SUGGESTIONS.map((preset) => (
            <button
              key={preset}
              onClick={() => setTopic(preset)}
              className="text-xs font-sans-body px-2.5 py-1 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 transition active:scale-95"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
