import React from 'react';
import { FolderKanban, Sparkles, FileText, Layers, ArrowRight, Wand2 } from 'lucide-react';
import { Project } from '../types.ts';
import { Language, translations } from '../locales/translations.ts';
import { VISUAL_STYLES, VisualDirectionMode, VisualStyleId } from '../visualDirector/StyleDirector.ts';

interface ProjectOverviewViewProps {
  project: Project; topic:string; setTopic:(val:string)=>void; duration:number; setDuration:(val:number)=>void;
  onGenerateStoryboard:()=>void; isGenerating:boolean; onJumpToCanvas:()=>void; lang?:Language;
  visualDirectionMode:VisualDirectionMode; manualVisualStyle:VisualStyleId;
  onVisualModeChange:(mode:VisualDirectionMode)=>void; onManualStyleChange:(style:VisualStyleId)=>void;
}

const TOPIC_SUGGESTIONS_VI=['Ngày Thị Trường Phố Wall Sụp Đổ (1929)','Apollo 11: Báo động máy tính 1202','Bức Tường Berlin Sụp Đổ (1989)','Dự Án Manhattan: Thử Nghiệm Trinity (1945)','Thảm Kịch Tàu Titanic (1912)'];
const TOPIC_SUGGESTIONS_EN=['The Day Wall Street Crashed (1929)','Apollo 11: The 1202 Computer Alarm','The Fall of the Berlin Wall (1989)','The Manhattan Project Trinity Test (1945)','The Sinking of the Titanic (1912)'];

export const ProjectOverviewView:React.FC<ProjectOverviewViewProps>=({project,topic,setTopic,duration,setDuration,onGenerateStoryboard,isGenerating,onJumpToCanvas,lang='vi',visualDirectionMode,manualVisualStyle,onVisualModeChange,onManualStyleChange})=>{
 const t=translations[lang]; const suggestions=lang==='vi'?TOPIC_SUGGESTIONS_VI:TOPIC_SUGGESTIONS_EN;
 const selected=VISUAL_STYLES.find(s=>s.id===manualVisualStyle)||VISUAL_STYLES[0];
 return <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 max-w-6xl mx-auto w-full">
  <div className="flex items-center justify-between pb-4 border-b border-zinc-800"><div><div className="flex items-center gap-2"><FolderKanban className="w-5 h-5 text-amber-400"/><h2 className="text-xl font-editorial font-bold text-zinc-100 uppercase tracking-tight">AI Director & Visual Style Studio</h2></div><p className="text-xs text-zinc-400 mt-1">AI phân tích nội dung từng cảnh, chọn style + bố cục + biến thể và tránh lặp hình ảnh.</p></div><button onClick={onJumpToCanvas} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-xs font-mono font-semibold transition">{lang==='vi'?'Mở Canvas':'Open Canvas'}<ArrowRight className="w-3.5 h-3.5"/></button></div>
  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-5">
   <div className="flex items-center justify-between"><span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2"><Sparkles className="w-4 h-4"/>AI Visual Director</span><span className="text-xs font-mono text-zinc-500">{project.shots.length} shots • {VISUAL_STYLES.length} styles</span></div>
   <div className="flex flex-col gap-1.5"><label className="text-xs font-mono text-zinc-300 font-semibold uppercase">{lang==='vi'?'Chủ đề phim tài liệu':'Documentary Topic'}</label><input type="text" value={topic} onChange={e=>setTopic(e.target.value)} placeholder="e.g. The Day Wall Street Crashed" className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 transition"/></div>
   <div className="flex flex-wrap items-center gap-2"><span className="text-[11px] font-mono text-zinc-500">{lang==='vi'?'Chủ đề nhanh:':'Fast presets:'}</span>{suggestions.map(p=><button key={p} onClick={()=>setTopic(p)} className="text-xs px-2.5 py-1 rounded bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800">{p}</button>)}</div>
   <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 border-t border-zinc-800 pt-4">
    <div><label className="text-xs font-mono text-zinc-400 font-semibold">{lang==='vi'?'Chế độ đạo diễn':'Director Mode'}</label><div className="grid grid-cols-3 gap-1 mt-1 bg-zinc-950 p-1 rounded border border-zinc-800">{(['auto','hybrid','manual'] as VisualDirectionMode[]).map(mode=><button key={mode} onClick={()=>onVisualModeChange(mode)} className={`py-2 rounded text-[10px] font-mono uppercase ${visualDirectionMode===mode?'bg-amber-400 text-zinc-950 font-bold':'text-zinc-400 hover:text-white'}`}>{mode==='auto'?'AI Auto':mode==='hybrid'?'Hybrid':'Manual'}</button>)}</div></div>
    <div><label className="text-xs font-mono text-zinc-400 font-semibold">{lang==='vi'?'Style khóa (Manual/Hybrid)':'Locked Style'}</label><select value={manualVisualStyle} onChange={e=>onManualStyleChange(e.target.value as VisualStyleId)} className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-zinc-200">{VISUAL_STYLES.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
    <div className="bg-zinc-950 border border-zinc-800 rounded p-3"><div className="flex items-center gap-2 text-xs font-mono text-amber-400"><Wand2 className="w-3.5 h-3.5"/>{selected.name}</div><div className="text-[11px] text-zinc-500 mt-1">{selected.bestFor.slice(0,3).join(' • ')}</div></div>
   </div>
   <div className="flex flex-wrap gap-2">{VISUAL_STYLES.map(s=><span key={s.id} className={`text-[10px] px-2 py-1 rounded border ${project.shots.some(x=>x.visualStyle===s.id)?'border-amber-500/60 text-amber-300 bg-amber-500/5':'border-zinc-800 text-zinc-500'}`}>{s.name}</span>)}</div>
   <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-zinc-800 pt-4">{[20,25,30,60].map(sec=><button key={sec} onClick={()=>setDuration(sec)} className={`py-2 rounded border text-xs font-mono ${duration===sec?'bg-amber-400 text-zinc-950 border-amber-400':'bg-zinc-950 text-zinc-400 border-zinc-800'}`}>{sec}s</button>)}</div>
   <div className="pt-3 border-t border-zinc-800 flex justify-end"><button onClick={onGenerateStoryboard} disabled={isGenerating||!topic.trim()} className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs rounded-lg disabled:opacity-50"><Sparkles className={`w-4 h-4 ${isGenerating?'animate-spin':''}`}/>{isGenerating?'DIRECTING...':'GENERATE STORYBOARD + VISUAL DIRECTION'}</button></div>
  </div>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
   <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"><div className="flex items-center justify-between mb-3"><span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-amber-400"/>Visual Sequence</span><span className="text-xs font-mono text-amber-400">{project.shots.length} Shots</span></div><div className="flex flex-col gap-1.5">{project.shots.map(s=><div key={s.shot_id} className="flex items-center justify-between text-xs font-mono bg-zinc-950/60 p-2 rounded border border-zinc-800/80 text-zinc-300"><span>Shot {String(s.order).padStart(2,'0')} • {s.visualStyle||'classic_vox'} • {s.layout}</span><span className="text-zinc-500">{s.duration}s</span></div>)}</div></div>
   <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3"><div className="flex items-center justify-between"><span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-amber-400"/>Voiceover Narration</span><span className="text-xs font-mono text-emerald-400">{project.voiceUrl?'Audio Synced':'Ready for TTS'}</span></div><p className="text-xs font-mono text-zinc-300 leading-relaxed bg-zinc-950/60 p-3 rounded border border-zinc-800/80 flex-1">"{project.script}"</p></div>
  </div>
 </div>;
};
