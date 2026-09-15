import React from 'react';
import { BookOpen, X, PlaySquare, Move, Layers, Palette } from 'lucide-react';
import { VOX_LAYOUTS, VOX_MOTIONS, VOX_STYLE_PRESET } from '../presets/index.ts';

interface PresetDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PresetDrawer: React.FC<PresetDrawerProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
      <div className="bg-zinc-900 border-l border-zinc-800 w-full max-w-md h-full p-6 overflow-y-auto shadow-2xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h3 className="font-editorial text-lg font-bold uppercase tracking-tight text-zinc-100">
              VOX Engine Architecture Presets
            </h3>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 10 & 36: Visual Grammar Palette */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400 uppercase">
            <Palette className="w-4 h-4" />
            <span>Section 10 & 36: Visual Grammar Palette</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded bg-[#E6DCB8] text-[#121212] font-bold border border-zinc-700">
              Newsprint
              <span className="block text-[10px] opacity-75 font-normal">#E6DCB8</span>
            </div>
            <div className="p-2.5 rounded bg-[#121212] text-[#F4EEDA] font-bold border border-zinc-700">
              Ink Black
              <span className="block text-[10px] opacity-75 font-normal">#121212</span>
            </div>
            <div className="p-2.5 rounded bg-[#DC2626] text-white font-bold">
              Archival Red
              <span className="block text-[10px] opacity-75 font-normal">#DC2626</span>
            </div>
            <div className="p-2.5 rounded bg-[#52525B] text-zinc-200 font-bold">
              Halftone Gray
              <span className="block text-[10px] opacity-75 font-normal">#52525B</span>
            </div>
            <div className="p-2.5 rounded bg-[#CA8A04] text-zinc-950 font-bold">
              Mustard Yellow
              <span className="block text-[10px] opacity-75 font-normal">#CA8A04</span>
            </div>
            <div className="p-2.5 rounded bg-[#F4EEDA] text-zinc-900 font-bold border border-zinc-700">
              Off-White
              <span className="block text-[10px] opacity-75 font-normal">#F4EEDA</span>
            </div>
          </div>
        </div>

        {/* Section 11: 8 Layout Presets */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400 uppercase">
            <Layers className="w-4 h-4" />
            <span>Section 11: 8 Canonical Layout Presets</span>
          </div>
          <div className="space-y-2">
            {VOX_LAYOUTS.map((layout, i) => (
              <div key={layout.id} className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 text-xs">
                <div className="flex items-center justify-between font-mono font-bold text-zinc-200 mb-1">
                  <span>
                    0{i + 1}. {layout.name}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 uppercase">
                    {layout.id}
                  </span>
                </div>
                <p className="text-zinc-400 font-sans-body text-[11px] mb-2">{layout.description}</p>
                <div className="flex flex-wrap gap-1">
                  {layout.defaultLayers.map((lyr) => (
                    <span
                      key={lyr}
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800"
                    >
                      {lyr}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 18: 12 Motion Primitives */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400 uppercase">
            <Move className="w-4 h-4" />
            <span>Section 18: 12 Physical Motion Primitives</span>
          </div>
          <div className="space-y-2">
            {VOX_MOTIONS.map((motion) => (
              <div key={motion.id} className="p-2.5 bg-zinc-950 rounded-lg border border-zinc-800 text-xs">
                <div className="flex items-center justify-between font-mono font-bold text-zinc-200 mb-0.5">
                  <span>{motion.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950 text-red-300 font-normal">
                    {motion.category}
                  </span>
                </div>
                <p className="text-zinc-400 font-sans-body text-[11px]">{motion.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
