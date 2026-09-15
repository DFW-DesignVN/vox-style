import React, { useState, useEffect } from 'react';
import { StudioHeader } from './components/StudioHeader.tsx';
import { StudioSidebar, StudioTab } from './components/StudioSidebar.tsx';
import { CanvasStudioView } from './components/CanvasStudioView.tsx';
import { ProjectOverviewView } from './components/ProjectOverviewView.tsx';
import { ScriptEditorView } from './components/ScriptEditorView.tsx';
import { VoiceStudioView } from './components/VoiceStudioView.tsx';
import { AssetInspectorView } from './components/AssetInspectorView.tsx';
import { RenderModal } from './components/RenderModal.tsx';
import { PresetDrawer } from './components/PresetDrawer.tsx';
import { QuickGuideModal } from './components/QuickGuideModal.tsx';
import { WALL_STREET_DEMO_PROJECT } from './data/wallStreetDemo.ts';
import { Project, Shot, MotionID } from './types.ts';
import { VOX_LAYOUTS, VOX_MOTIONS } from './presets/index.ts';
import { Language } from './locales/translations.ts';
import { TTSProviderChoice } from './components/TopicDirector.tsx';
import { directProjectVisuals, VisualDirectionMode, VisualStyleId, VISUAL_STYLES } from './visualDirector/StyleDirector.ts';
import { ensureCompositionAssets, inferBackground, inferMotion } from './visualDirector/PhysicalCollage.ts';

export default function App() {
  const [project, setProject] = useState<Project>(WALL_STREET_DEMO_PROJECT);
  const [topic, setTopic] = useState<string>('The Day Wall Street Crashed');
  const [duration, setDuration] = useState<number>(25);
  const [activeShotIndex, setActiveShotIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<StudioTab>('canvas');
  const [lang, setLang] = useState<Language>('vi');
  const [isQuickGuideOpen, setIsQuickGuideOpen] = useState<boolean>(false);
  const [selectedVoice, setSelectedVoice] = useState<string>('vi_female');
  const [selectedTTSLanguage, setSelectedTTSLanguage] = useState<string>('vi-VN');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatingAssetKey, setGeneratingAssetKey] = useState<string | null>(null);
  const [ffmpegAvailable, setFfmpegAvailable] = useState<boolean | null>(null);
  const [isRenderModalOpen, setIsRenderModalOpen] = useState<boolean>(false);
  const [isPresetDrawerOpen, setIsPresetDrawerOpen] = useState<boolean>(false);
  const [ttsProvider, setTtsProvider] = useState<TTSProviderChoice>('google');
  const [isGeneratingVoice, setIsGeneratingVoice] = useState<boolean>(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const [visualDirectionMode, setVisualDirectionMode] = useState<VisualDirectionMode>('auto');
  const [manualVisualStyle, setManualVisualStyle] = useState<VisualStyleId>('classic_vox');

  useEffect(() => {
    fetch('/api/health').then((res) => res.json()).then((data) => setFfmpegAvailable(data.ffmpeg === true)).catch(() => setFfmpegAvailable(false));
  }, []);

  const handleLoadBenchmark = () => {
    setProject(WALL_STREET_DEMO_PROJECT);
    setTopic(WALL_STREET_DEMO_PROJECT.title);
    setDuration(WALL_STREET_DEMO_PROJECT.duration);
    setActiveShotIndex(0);
    setActiveTab('canvas');
  };

  const applyVisualDirection = (candidate: Project) => {
    const directed = directProjectVisuals(candidate, visualDirectionMode, manualVisualStyle) as Project;
    setProject({ ...directed, visualDirectionMode, manualVisualStyle });
    return directed;
  };

  const handleGenerateStoryboard = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    try {
      const response = await fetch('/api/director/storyboard', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ topic, duration, niche:'documentary' }) });
      if (!response.ok) throw new Error('Failed to direct storyboard');
      const newProject: Project = await response.json();
      const normalized: Project = { ...newProject, fps:30, resolution:'1920x1080', style:'vox_paper_collage', voiceover:true, subtitles:true, sfx:true, createdAt:new Date().toISOString() };
      applyVisualDirection(normalized);
      setActiveShotIndex(0);
      setActiveTab('canvas');
    } catch (err) {
      console.error('Storyboard error:', err);
      const fallback = directProjectVisuals(WALL_STREET_DEMO_PROJECT, visualDirectionMode, manualVisualStyle) as Project;
      setProject(fallback);
      setActiveTab('canvas');
    } finally { setIsGenerating(false); }
  };

  const handleVisualModeChange = (mode:VisualDirectionMode) => {
    setVisualDirectionMode(mode);
    setProject((prev) => directProjectVisuals(prev, mode, manualVisualStyle) as Project);
  };
  const handleManualStyleChange = (style:VisualStyleId) => {
    setManualVisualStyle(style);
    setProject((prev) => directProjectVisuals(prev, visualDirectionMode, style) as Project);
  };

  const handleRegenerateShotLayout = (shotIndex:number) => {
    setProject((prev) => {
      const target = prev.shots[shotIndex];
      if (!target) return prev;
      const ids = VOX_LAYOUTS.map((l) => l.id);
      const currentIndex = Math.max(0, ids.indexOf(target.layout));
      const nextLayout = ids[(currentIndex + 1) % ids.length];
      const seeded = ensureCompositionAssets({ ...target, layout: nextLayout });
      const background = inferBackground(nextLayout);
      const primaryMotion = seeded.assets[0]?.motion || inferMotion(nextLayout);
      const nextShot: Shot = {
        ...target,
        layout: nextLayout,
        assets: seeded.assets,
        background: { ...target.background, type: background },
        composition: {
          layout: nextLayout,
          background,
          border: target.composition?.border || 'scissor_cut',
          primaryMotion,
          autoGenerated: true,
          assetCount: seeded.assets.length,
        },
      };
      const shots = [...prev.shots];
      shots[shotIndex] = nextShot;
      return { ...prev, shots };
    });
  };

  const handleRegenerateShotMotion = (shotIndex:number) => {
    setProject((prev) => {
      const target = prev.shots[shotIndex];
      if (!target) return prev;
      const motions = VOX_MOTIONS.map((m) => m.id as MotionID);
      const hero = target.assets.find((a) => a.role === 'hero') || target.assets[0];
      const current = hero?.motion || target.composition?.primaryMotion || 'paper_drop';
      const currentIndex = Math.max(0, motions.indexOf(current as MotionID));
      const nextMotion = motions[(currentIndex + 1) % motions.length];
      const assets = target.assets.map((asset, index) => {
        if (index === 0 || asset.role === 'hero') {
          return { ...asset, motion: nextMotion };
        }
        return asset;
      });
      const shots = [...prev.shots];
      shots[shotIndex] = {
        ...target,
        assets,
        composition: {
          ...(target.composition || {
            layout: target.layout,
            background: target.background.type,
            border: 'scissor_cut',
            primaryMotion: nextMotion,
          }),
          primaryMotion: nextMotion,
          assetCount: assets.length,
        },
      };
      return { ...prev, shots };
    });
  };

  const handleUpdateShot = (index:number, updated:Partial<Shot>) => setProject((prev)=>{const shots=[...prev.shots];shots[index]={...shots[index],...updated};return{...prev,shots};});
  const handleUpdateProjectScript = (newScript:string) => setProject((prev)=>({...prev,script:newScript}));

  const handleGenerateShotAsset = async (shotIndex:number, assetId:string) => {
    const key=`${shotIndex}_${assetId}`; setGeneratingAssetKey(key); const shot=project.shots[shotIndex]; const asset=shot.assets.find((a)=>a.id===assetId)||shot.assets[0];
    const style=VISUAL_STYLES.find((s)=>s.id===shot.visualStyle) || VISUAL_STYLES[0];
    const prompt=`${asset?.assetPrompt || `Documentary image regarding ${project.title}, beat ${shot.order}`}. STYLE SYSTEM: ${style.name}. Compose for ${shot.layout} layout. Variant: ${shot.styleVariant||'clean'}.`;
    setProject((prev)=>({...prev,shots:prev.shots.map((s,i)=>i===shotIndex?{...s,assets:s.assets.map((a)=>a.id===assetId?{...a,status:'generating'}:a)}:s)}));
    try {
      const response=await fetch('/api/assets/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt,topic:project.title,shotId:shot.shot_id,assetId,role:asset?.role||'hero',layout:shot.layout,style:shot.visualStyle})});
      const result=await response.json();
      if(result.success&&result.url)setProject((prev)=>({...prev,shots:prev.shots.map((s,i)=>i===shotIndex?{...s,assets:s.assets.map((a)=>a.id===assetId?{...a,source:result.url,provider:result.provider,status:'ready',paperCutout:true}:a)}:s)}));
      else throw new Error(result.error||'Image generation failed');
    } catch(err) {
      console.error('Shot asset generation error:',err);
      setProject((prev)=>({...prev,shots:prev.shots.map((s,i)=>i===shotIndex?{...s,assets:s.assets.map((a)=>a.id===assetId?{...a,status:'pending'}:a)}:s)}));
    } finally { setGeneratingAssetKey(null); }
  };

  const handleUploadShotAsset = async (shotIndex:number, assetId:string, file:File) => {
    const key=`${shotIndex}_${assetId}`; setGeneratingAssetKey(key); const reader=new FileReader();
    reader.onload=async()=>{try{if(!file.type.startsWith('image/'))throw new Error('Only image files are supported');if(file.size>25*1024*1024)throw new Error('Image is larger than 25MB');const response=await fetch('/api/assets/upload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({imageBase64:reader.result as string,shotId:project.shots[shotIndex].shot_id,assetId})});const result=await response.json();if(!response.ok||!result.success)throw new Error(result.error||'Upload failed');setProject((prev)=>({...prev,shots:prev.shots.map((s,i)=>i===shotIndex?{...s,assets:s.assets.map(a=>a.id===assetId?{...a,source:result.url,provider:'upload',status:'ready',paperCutout:true}:a)}:s)}));}catch(err){console.error('Upload asset error:',err);}finally{setGeneratingAssetKey(null);}}; reader.readAsDataURL(file);
  };

  const handleGenerateVoiceAndTimeline = async (voiceId?:string, provider?:TTSProviderChoice, language?:string) => {
    if(!project||project.shots.length===0)return; setIsGeneratingVoice(true); setVoiceNotice(null);
    const chosenProvider=provider||ttsProvider; const chosenVoice=voiceId||selectedVoice; const chosenLanguage=language||selectedTTSLanguage;
    try{const response=await fetch('/api/voice-and-timeline',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({project,provider:chosenProvider,voiceId:chosenVoice,lang:chosenLanguage})});if(!response.ok){const e=await response.json().catch(()=>({}));throw new Error(e.error||'Failed to synthesize voice and beat timeline');}const data=await response.json();if(data.success&&data.project){setProject(data.project);setDuration(data.project.duration);setVoiceNotice(lang==='vi'?`Đã tạo giọng đọc và đồng bộ ${data.project.audioTimeline?.beats?.length||0} nhịp thành công!`:`Audio-first timeline synced (${data.project.audioTimeline?.beats?.length||0} beats).`);}}catch(err:any){setVoiceNotice(lang==='vi'?`Thông báo: ${err.message}`:`TTS notice: ${err.message}`);}finally{setIsGeneratingVoice(false);}
  };

  return <div className="h-screen w-screen overflow-hidden bg-[#121214] text-[#E4E4E7] font-sans-body flex flex-col selection:bg-red-900 selection:text-white">
    <StudioHeader projectTitle={project.title} duration={project.duration} ffmpegAvailable={ffmpegAvailable} onLoadBenchmark={handleLoadBenchmark} isLoading={isGenerating} activeTab={activeTab} setActiveTab={setActiveTab} onOpenRenderModal={()=>setIsRenderModalOpen(true)} onOpenPresetDrawer={()=>setIsPresetDrawerOpen(true)} onOpenQuickGuide={()=>setIsQuickGuideOpen(true)} lang={lang} setLang={setLang}/>
    <div className="flex-1 flex overflow-hidden">
      <StudioSidebar activeTab={activeTab} setActiveTab={setActiveTab} project={project} onOpenRenderModal={()=>setIsRenderModalOpen(true)} lang={lang}/>
      <div className="flex-1 flex flex-col overflow-hidden bg-[#18181B]/50">
        {activeTab==='canvas'&&<CanvasStudioView project={project} activeShotIndex={activeShotIndex} setActiveShotIndex={setActiveShotIndex} onUpdateShot={handleUpdateShot} onRegenerateShotLayout={handleRegenerateShotLayout} onRegenerateShotMotion={handleRegenerateShotMotion} onGenerateShotAsset={handleGenerateShotAsset} onUploadShotAsset={handleUploadShotAsset} generatingAssetKey={generatingAssetKey} onOpenInspector={()=>setActiveTab('inspector')} lang={lang}/>} 
        {activeTab==='overview'&&<ProjectOverviewView project={project} topic={topic} setTopic={setTopic} duration={duration} setDuration={setDuration} onGenerateStoryboard={handleGenerateStoryboard} isGenerating={isGenerating} onJumpToCanvas={()=>setActiveTab('canvas')} lang={lang} visualDirectionMode={visualDirectionMode} manualVisualStyle={manualVisualStyle} onVisualModeChange={handleVisualModeChange} onManualStyleChange={handleManualStyleChange}/>} 
        {activeTab==='script'&&<ScriptEditorView project={project} onUpdateProjectScript={handleUpdateProjectScript} activeShotIndex={activeShotIndex} setActiveShotIndex={setActiveShotIndex} onJumpToShot={(shotIdx)=>{setActiveShotIndex(shotIdx);setActiveTab('canvas')}} onGenerateVoiceAndTimeline={handleGenerateVoiceAndTimeline} isGeneratingVoice={isGeneratingVoice} lang={lang}/>} 
        {activeTab==='voice'&&<VoiceStudioView project={project} ttsProvider={ttsProvider} setTtsProvider={setTtsProvider} selectedVoice={selectedVoice} setSelectedVoice={setSelectedVoice} selectedLanguage={selectedTTSLanguage} setSelectedLanguage={setSelectedTTSLanguage} onGenerateVoiceAndTimeline={handleGenerateVoiceAndTimeline} isGeneratingVoice={isGeneratingVoice} voiceNotice={voiceNotice} setVoiceNotice={setVoiceNotice} onJumpToCanvas={()=>setActiveTab('canvas')} lang={lang}/>} 
        {activeTab==='inspector'&&<AssetInspectorView project={project} activeShotIndex={activeShotIndex} setActiveShotIndex={setActiveShotIndex} onUpdateShot={handleUpdateShot} onGenerateShotAsset={handleGenerateShotAsset} onUploadShotAsset={handleUploadShotAsset} generatingAssetKey={generatingAssetKey} lang={lang}/>} 
      </div>
    </div>
    {isPresetDrawerOpen&&<PresetDrawer onClose={()=>setIsPresetDrawerOpen(false)} onApply={(preset)=>setProject((prev)=>({...prev,...preset}))} lang={lang}/>} 
    {isQuickGuideOpen&&<QuickGuideModal onClose={()=>setIsQuickGuideOpen(false)} lang={lang}/>} 
    {isRenderModalOpen&&<RenderModal project={project} ffmpegAvailable={ffmpegAvailable===true} onClose={()=>setIsRenderModalOpen(false)} lang={lang}/>} 
  </div>;
}
