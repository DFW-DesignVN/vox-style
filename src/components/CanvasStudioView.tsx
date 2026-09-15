import React from 'react';
import { Layers, Sliders } from 'lucide-react';
import { CanvasPlayer } from './CanvasPlayer.tsx';
import { StoryboardView } from './StoryboardView.tsx';
import { PhysicalCollageToolDock } from './PhysicalCollageToolDock.tsx';
import { Project, Shot } from '../types.ts';
import { Language, translations } from '../locales/translations.ts';

interface CanvasStudioViewProps { project:Project; activeShotIndex:number; setActiveShotIndex:(idx:number)=>void; onUpdateShot:(index:number,updated:Partial<Shot>)=>void; onRegenerateShotLayout:(index:number)=>void; onRegenerateShotMotion:(index:number)=>void; onGenerateShotAsset?:(shotIndex:number,assetId:string)=>void; onUploadShotAsset?:(shotIndex:number,assetId:string,file:File)=>void; generatingAssetKey?:string|null; onOpenInspector:()=>void; lang?:Language; }

export const CanvasStudioView:React.FC<CanvasStudioViewProps>=({project,activeShotIndex,setActiveShotIndex,onUpdateShot,onRegenerateShotLayout,onRegenerateShotMotion,onGenerateShotAsset,onUploadShotAsset,generatingAssetKey,onOpenInspector,lang='vi'})=>{
 const t=translations[lang]; const activeShot=project.shots[activeShotIndex]||project.shots[0];
 return <div className="flex-1 overflow-y-auto p-3 sm:p-4 flex flex-col gap-5 w-full max-w-[1500px] mx-auto">
  <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-4 items-start">
   <div className="min-w-0"><CanvasPlayer project={project} activeShotIndex={activeShotIndex} setActiveShotIndex={setActiveShotIndex} lang={lang}/></div>
   <div className="xl:sticky xl:top-3 flex flex-col gap-3"><PhysicalCollageToolDock shot={activeShot} onUpdate={(patch)=>onUpdateShot(activeShotIndex,patch)} lang={lang}/><button onClick={onOpenInspector} className="w-full flex items-center justify-center gap-2 text-xs font-mono text-amber-400 hover:text-amber-300 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800"><Sliders className="w-3.5 h-3.5"/>{t.openInspector}</button></div>
  </div>
  <div className="w-full flex flex-col gap-3"><div className="flex items-center justify-between px-1"><div className="flex items-center gap-2"><Layers className="w-4 h-4 text-amber-400"/><h3 className="font-editorial text-base font-bold text-zinc-100 uppercase tracking-tight">{t.storyboardTitle} ({project.shots.length} Shots • {project.duration}s)</h3></div></div><StoryboardView project={project} activeShotIndex={activeShotIndex} setActiveShotIndex={setActiveShotIndex} onUpdateShot={onUpdateShot} onRegenerateShotLayout={onRegenerateShotLayout} onRegenerateShotMotion={onRegenerateShotMotion} onGenerateShotAsset={onGenerateShotAsset} onUploadShotAsset={onUploadShotAsset} generatingAssetKey={generatingAssetKey}/></div>
 </div>;
};
