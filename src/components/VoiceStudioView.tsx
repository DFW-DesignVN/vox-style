import React from 'react';
import {
  Mic,
  Activity,
  Cpu,
  Server,
  Cloud,
  Loader2,
  Volume2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { Project, Beat } from '../types.ts';
import { TTSProviderChoice } from './TopicDirector.tsx';
import { Language, translations } from '../locales/translations.ts';

interface VoiceStudioViewProps {
  project: Project;
  ttsProvider: TTSProviderChoice;
  setTtsProvider: (provider: TTSProviderChoice) => void;
  selectedVoice: string;
  setSelectedVoice: (voice: string) => void;
  onGenerateVoiceAndTimeline: (voiceId?: string, provider?: TTSProviderChoice) => void;
  isGeneratingVoice: boolean;
  voiceNotice: string | null;
  setVoiceNotice: (val: string | null) => void;
  onJumpToCanvas: () => void;
  lang?: Language;
}

export const VoiceStudioView: React.FC<VoiceStudioViewProps> = ({
  project,
  ttsProvider,
  setTtsProvider,
  selectedVoice,
  setSelectedVoice,
  onGenerateVoiceAndTimeline,
  isGeneratingVoice,
  voiceNotice,
  setVoiceNotice,
  onJumpToCanvas,
  lang = 'vi',
}) => {
  const t = translations[lang];
  const allBeats: Beat[] = project.audioTimeline?.beats || [];

  const voiceOptions = [
    {
      id: 'vi_female',
      name: lang === 'vi' ? 'Tiếng Việt - Nữ Truyền Cảm' : 'Vietnamese - Natural Female',
      tag: lang === 'vi' ? 'Chuẩn rõ âm, trong trẻo, không rè' : 'Crystal clear broadcast',
    },
    {
      id: 'vi_male',
      name: lang === 'vi' ? 'Tiếng Việt - Nam Trầm Ấm' : 'Vietnamese - Warm Documentary Male',
      tag: lang === 'vi' ? 'Trầm ấm tài liệu VOX' : 'Deep documentary tone',
    },
    {
      id: 'en_male',
      name: lang === 'vi' ? 'English - Documentary Deep Male' : 'English - Documentary Deep Male',
      tag: lang === 'vi' ? 'Giọng tài liệu Mỹ chuẩn' : 'US Documentary standard',
    },
    {
      id: 'en_female',
      name: lang === 'vi' ? 'English - Broadcast Female' : 'English - Broadcast Female',
      tag: lang === 'vi' ? 'Bản tin báo chí' : 'Newsroom clarity',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-6 max-w-5xl mx-auto w-full">
      {/* Top Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-editorial font-bold text-zinc-100 uppercase tracking-tight">
              {t.voiceStudioTitle}
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1 font-sans-body">
            {t.voiceStudioDesc}
          </p>
        </div>

        {/* Action button */}
        <button
          onClick={() => onGenerateVoiceAndTimeline(selectedVoice, ttsProvider)}
          disabled={isGeneratingVoice}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono font-bold transition shadow-lg shadow-emerald-950/50 active:scale-95 disabled:opacity-50"
        >
          {isGeneratingVoice ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Activity className="w-4 h-4" />
          )}
          <span>
            {isGeneratingVoice
              ? t.generatingVoice
              : project.voiceUrl
              ? t.reSyncVoice
              : t.generateVoiceBtn}
          </span>
        </button>
      </div>

      {voiceNotice && (
        <div className="bg-zinc-950 border border-amber-900/60 text-amber-300 text-xs font-mono p-3 rounded-xl flex items-start justify-between gap-2 shadow-sm">
          <span>{voiceNotice}</span>
          <button
            onClick={() => setVoiceNotice(null)}
            className="text-zinc-500 hover:text-zinc-300 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Voice Selection Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">
              {t.voiceChoiceLabel}
            </span>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            {voiceOptions.find((v) => v.id === selectedVoice)?.name}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {voiceOptions.map((opt) => {
            const isSelected = selectedVoice === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setSelectedVoice(opt.id)}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition ${
                  isSelected
                    ? 'bg-zinc-950 border-amber-500 text-white shadow-md shadow-amber-950/20 ring-1 ring-amber-500/50'
                    : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-zinc-100">{opt.name}</span>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-amber-400" />}
                </div>
                <span className="text-[11px] text-zinc-400">{opt.tag}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TTS Provider Choice Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
            {t.ttsEngineTitle}
          </span>
          <span className="text-xs font-mono text-zinc-500">
            Current: {ttsProvider.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            {
              id: 'google' as TTSProviderChoice,
              label: 'Google Speech',
              sub: lang === 'vi' ? 'Không rè, chuẩn rõ âm, khuyên dùng' : 'Clear speech, zero static, recommended',
              icon: Sparkles,
            },
            {
              id: 'auto' as TTSProviderChoice,
              label: 'Automatic',
              sub: lang === 'vi' ? 'Tự động chọn VieNeu → CapCut → Google' : 'Auto select available engine',
              icon: Cpu,
            },
            {
              id: 'vieneu' as TTSProviderChoice,
              label: 'VieNeu (Local)',
              sub: lang === 'vi' ? 'Cần server Python cục bộ' : 'Local neural TTS server',
              icon: Server,
            },
            {
              id: 'capcut' as TTSProviderChoice,
              label: 'CapCut TTS',
              sub: lang === 'vi' ? 'Cần module capcut_tts_api' : 'Requires local Python bridge',
              icon: Server,
            },
            {
              id: 'elevenlabs' as TTSProviderChoice,
              label: 'ElevenLabs',
              sub: lang === 'vi' ? 'Cần ELEVENLABS_API_KEY' : 'Cloud realistic documentary',
              icon: Cloud,
            },
          ].map((item) => {
            const isSelected = ttsProvider === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => setTtsProvider(item.id)}
                className={`p-3.5 rounded-xl border text-left flex flex-col gap-2 transition ${
                  isSelected
                    ? 'bg-zinc-950 border-amber-500 text-white shadow-md shadow-amber-950/20 ring-1 ring-amber-500/50'
                    : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon
                    className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-zinc-500'}`}
                  />
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold font-mono">{item.label}</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">{item.sub}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Audio Player & Wave Track Status */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">
              {t.masterAudioPreview}
            </span>
          </div>
          {project.voiceUrl ? (
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{t.audioActive} ({project.voiceDuration?.toFixed(1) || project.duration}s)</span>
            </span>
          ) : (
            <span className="text-xs font-mono text-zinc-500">{t.noAudioTrack}</span>
          )}
        </div>

        {project.voiceUrl ? (
          <div className="flex flex-col gap-3">
            <audio controls src={project.voiceUrl} className="w-full h-10 accent-amber-500" />
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400 bg-zinc-950 p-2.5 rounded-lg border border-zinc-800/80">
              <span>Duration: {project.voiceDuration?.toFixed(2) || project.duration}s</span>
              <span>{allBeats.length} {t.beatsCount}</span>
              <button
                onClick={onJumpToCanvas}
                className="text-amber-400 hover:text-amber-300 font-bold underline"
              >
                {t.jumpToCanvas}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-zinc-950 rounded-lg border border-zinc-800/80 text-center text-xs font-mono text-zinc-500 flex flex-col items-center gap-2">
            <Mic className="w-6 h-6 text-zinc-600" />
            <span>{t.clickToSynthesize}</span>
          </div>
        )}
      </div>

      {/* Synchronized Rhythm Beat Grid */}
      {allBeats.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
              {t.derivedBeatsTitle} ({allBeats.length} {t.beatsCount})
            </span>
            <span className="text-xs font-mono text-zinc-500">
              {t.fpsStandard}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {allBeats.map((beat, idx) => (
              <div
                key={beat.id}
                className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 flex flex-col gap-1 text-xs font-mono"
              >
                <div className="flex items-center justify-between text-[11px] text-zinc-500">
                  <span className="font-bold text-amber-400">BEAT 0{idx + 1}</span>
                  <span>{beat.start.toFixed(1)}s - {beat.end.toFixed(1)}s ({beat.duration.toFixed(1)}s)</span>
                </div>
                <div className="text-zinc-200 font-typewriter text-xs mt-1">
                  "{beat.text}"
                </div>
                {beat.visualCue && (
                  <div className="text-[10px] text-zinc-400 mt-1 truncate bg-zinc-900 px-2 py-0.5 rounded">
                    Cue: {beat.visualCue}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
