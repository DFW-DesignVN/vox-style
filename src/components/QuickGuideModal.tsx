import React from 'react';
import { X, BookOpen, CheckCircle, Monitor, Mic, Layout, Image, Download } from 'lucide-react';
import { Language, translations } from '../locales/translations.ts';

interface QuickGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const QuickGuideModal: React.FC<QuickGuideModalProps> = ({ isOpen, onClose, lang }) => {
  if (!isOpen) return null;
  const t = translations[lang];

  const steps = [
    {
      icon: Monitor,
      title: t.step1Title,
      desc: t.step1Desc,
      color: 'text-sky-400',
      bg: 'bg-sky-950/40 border-sky-800/60',
    },
    {
      icon: Mic,
      title: t.step2Title,
      desc: t.step2Desc,
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/40 border-emerald-800/60',
    },
    {
      icon: Layout,
      title: t.step3Title,
      desc: t.step3Desc,
      color: 'text-amber-400',
      bg: 'bg-amber-950/40 border-amber-800/60',
    },
    {
      icon: Image,
      title: t.step4Title,
      desc: t.step4Desc,
      color: 'text-purple-400',
      bg: 'bg-purple-950/40 border-purple-800/60',
    },
    {
      icon: Download,
      title: t.step5Title,
      desc: t.step5Desc,
      color: 'text-red-400',
      bg: 'bg-red-950/40 border-red-800/60',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-editorial text-lg font-bold text-zinc-100 uppercase tracking-tight">
                {t.quickGuideTitle}
              </h2>
              <p className="text-xs text-zinc-400 font-sans-body">
                {t.quickGuideSubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex flex-col gap-4">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border flex items-start gap-4 transition ${step.bg}`}
              >
                <div className={`p-2 rounded-lg bg-zinc-900/90 border border-zinc-800 shrink-0 ${step.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-bold text-zinc-100 font-mono">
                    {step.title}
                  </h3>
                  <p className="text-xs text-zinc-300 leading-relaxed font-sans-body">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-end bg-zinc-900/50">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs font-mono transition shadow-md shadow-amber-950/40 active:scale-95"
          >
            {t.gotItBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
