import React from 'react';
import {Layers,PanelRight} from 'lucide-react';
import {CanvasPlayer} from './CanvasPlayer.tsx';
import {StoryboardView} from './StoryboardView.tsx';
import {PhysicalCollageToolDock} from './PhysicalCollageToolDock.tsx';
import {Project,Shot} from '../types.ts';
import {Language,translations} from '../locales/translations.ts';

interface CanvasStudioViewProps{project:Project;activeShotIndex:number;setActiveShotIndex:(idx:number)=>void;onUpdateShot:(index:number,updated:Partial<Shot>)=>void;onRegenerateShotLayout:(index:number)=>void;onRegenerateShotMotion:(index:number)=>void;onGenerateShotAsset?:(shotIndex:number,assetId:string)=>void;onUploadShotAsset?:(shotIndex:number,assetId:string,file:File)=>void;generatingAssetKey?:string|null;onOpenInspector:()=>void;lang?:Language;}

export const CanvasStudioView:React.FC<CanvasStudioViewProps>=({project,activeShotIndex,setActiveShotIndex,onUpdateShot,onRegenerateShotLayout,onRegenerateShotMotion,onGenerateShotAsset,onUploadShotAsset,generatingAssetKey,onOpenInspector,lang='vi'})=>{
 const t=translations[lang];
 const activeShot=project.shots[activeShotIndex]||project.shots[0];
 return <div className="flex-1 overflow-y-auto bg-[#080809] px-2 py-3 sm:px-4 lg:px-5">
  <div className="mx-auto flex w-full max-w-[1720px] flex-col gap-4">
   <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2.5"><div className="flex min-w-0 items-center gap-3"><div className="rounded-lg bg-amber-500/10 p-2 text-amber-400"><Layers className="h-4 w-4"/></div><div className="min-w-0"><div className="truncate text-xs font-semibold tracking-wide text-zinc-100">{project.title||'Untitled Project'}</div><div className="mt-0.5 text-[9px] font-mono text-zinc-600">SHOT {String(activeShot?.order||activeShotIndex+1).padStart(2,'0')} / {project.shots.length} • {project.duration}s • {project.resolution}</div></div></div><button onClick={onOpenInspector} className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-[9px] font-semibold text-zinc-400 hover:border-zinc-700 hover:text-zinc-100"><PanelRight className="h-3.5 w-3.5"/>Inspector</button></div>
   <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
    <main className="min-w-0"><CanvasPlayer project={project} activeShotIndex={activeShotIndex} setActiveShotIndex={setActiveShotIndex} lang={lang}/></main>
    <aside className="min-w-0 xl:sticky xl:top-3"><PhysicalCollageToolDock shot={activeShot} onUpdate={patch=>onUpdateShot(activeShotIndex,patch)} lang={lang}/></aside>
   </div>
   <section className="min-w-0"><div className="mb-2 flex items-center justify-between px-1"><div className="flex items-center gap-2"><Layers className="h-4 w-4 text-amber-400"/><h3 className="text-sm font-bold uppercase tracking-tight text-zinc-200">{t.storyboardTitle}</h3></div><span className="text-[9px] font-mono text-zinc-600">{project.shots.length} SHOTS • TIMELINE</span></div><StoryboardView project={project} activeShotIndex={activeShotIndex} setActiveShotIndex={setActiveShotIndex} onUpdateShot={onUpdateShot} onRegenerateShotLayout={onRegenerateShotLayout} onRegenerateShotMotion={onRegenerateShotMotion} onGenerateShotAsset={onGenerateShotAsset} onUploadShotAsset={onUploadShotAsset} generatingAssetKey={generatingAssetKey}/></section>
  </div>
 </div>;
};
