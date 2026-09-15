import React, { useEffect, useState } from 'react';
import { Sparkles, Clock, Scissors, Loader2, Mic, Activity, CheckCircle2, Cpu, Server, Cloud } from 'lucide-react';

export type TTSProviderChoice = 'google' | 'gemini' | 'auto' | 'vieneu' | 'capcut' | 'elevenlabs';

interface TopicDirectorProps {
  topic: string; setTopic: (val: string) => void; duration: number; setDuration: (val: number) => void; onGenerate: () => void; isGenerating: boolean; totalShots: number;
  onGenerateAllAssets?: () => void; isGeneratingAssets?: boolean; pendingAssetsCount?: number;
  ttsProvider: TTSProviderChoice; setTtsProvider: (provider: TTSProviderChoice) => void;
  onGenerateVoiceAndTimeline?: () => void; isGeneratingVoice?: boolean; voiceUrl?: string; voiceDuration?: number; totalBeats?: number;
}

const TOPIC_SUGGESTIONS = ['The Day Wall Street Crashed (1929)','Apollo 11: The 1202 Computer Alarm','The Fall of the Berlin Wall','The Manhattan Project Trinity Test'];
const PIPELINE_STEPS = ['Topic','Script','Storyboard','Cutout Assets','Voice TTS','Beat Engine','Motion','FFmpeg'];

export const TopicDirector: React.FC<TopicDirectorProps> = ({ topic,setTopic,duration,setDuration,onGenerate,isGenerating,totalShots,onGenerateAllAssets,isGeneratingAssets=false,pendingAssetsCount=0,ttsProvider,setTtsProvider,onGenerateVoiceAndTimeline,isGeneratingVoice=false,voiceUrl,voiceDuration,totalBeats=0 }) => {
  const [providerStatus, setProviderStatus] = useState<{gemini?:boolean;google?:boolean;vieneu?:boolean;capcut?:boolean;elevenlabs?:boolean}>({});
  useEffect(() => { fetch('/api/tts/providers').then(r=>r.json()).then(setProviderStatus).catch(()=>setProviderStatus({})); }, []);

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-wrap gap-2 text-[10px] font-mono text-zinc-500">
        {PIPELINE_STEPS.map((step)=><span key={step} className="px-2 py-1 rounded border border-zinc-800 bg-zinc-950">{step}</span>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="text-xs font-mono font-bold text-zinc-300 mb-2">DOCUMENTARY TOPIC</div>
          <input value={topic} onChange={e=>setTopic(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-100" placeholder="Enter documentary topic..." />
          <div className="flex flex-wrap gap-2 mt-3">{TOPIC_SUGGESTIONS.map(s=><button key={s} onClick={()=>setTopic(s)} className="text-[10px] text-zinc-400 hover:text-amber-300">{s}</button>)}</div>
          <div className="mt-4 flex items-center gap-3"><Clock className="w-4 h-4 text-amber-400"/><input type="number" min={10} max={900} value={duration} onChange={e=>setDuration(Number(e.target.value))} className="w-24 bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm text-zinc-100"/><span className="text-xs text-zinc-500">seconds</span></div>
          <button onClick={onGenerate} disabled={isGenerating} className="mt-4 w-full px-4 py-3 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded-lg disabled:opacity-50">{isGenerating?<Loader2 className="w-4 h-4 animate-spin mx-auto"/>:'GENERATE STORYBOARD'}</button>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="text-xs font-mono font-bold text-zinc-300 mb-3">TTS ENGINE</div>
          <div className="grid grid-cols-2 gap-2">
            {(['gemini','google','auto','vieneu','capcut','elevenlabs'] as TTSProviderChoice[]).map(p=>{
              const active=ttsProvider===p; const available=providerStatus[p];
              return <button key={p} onClick={()=>setTtsProvider(p)} className={`p-3 rounded-lg border text-left ${active?'border-amber-500 bg-zinc-950':'border-zinc-800 bg-zinc-950/60'}`}><div className="text-xs font-bold text-zinc-100 uppercase">{p}</div><div className="text-[10px] text-zinc-500 mt-1">{p==='gemini'?'Gemini Flash TTS':p==='google'?'Google Speech':p==='auto'?'Automatic fallback':'Local / configured'}</div><div className={`text-[9px] mt-1 ${available===false?'text-red-400':'text-emerald-400'}`}>{available===false?'Unavailable':'Available / configured'}</div></button>;
            })}
          </div>
          <div className="mt-4 text-[10px] text-zinc-500">{voiceUrl ? `Voice ready · ${voiceDuration?.toFixed(1) || '?'}s · ${totalBeats} beats` : 'Chưa có voice track'}</div>
          {onGenerateVoiceAndTimeline && <button onClick={onGenerateVoiceAndTimeline} disabled={isGeneratingVoice} className="mt-3 w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg disabled:opacity-50">{isGeneratingVoice?'GENERATING VOICE...':'GENERATE VOICE & BEATS'}</button>}
        </div>
      </div>
    </div>
  );
};
