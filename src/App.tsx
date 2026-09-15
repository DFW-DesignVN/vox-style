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
import { WALL_STREET_DEMO_PROJECT } from './data/wallStreetDemo.ts';
import { Project, Shot, LayoutID, MotionID } from './types.ts';
import { VOX_LAYOUTS } from './presets/index.ts';

export default function App() {
  const [project, setProject] = useState<Project>(WALL_STREET_DEMO_PROJECT);
  const [topic, setTopic] = useState<string>('The Day Wall Street Crashed');
  const [duration, setDuration] = useState<number>(25);
  const [activeShotIndex, setActiveShotIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<StudioTab>('canvas');

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isGeneratingAssets, setIsGeneratingAssets] = useState<boolean>(false);
  const [generatingAssetKey, setGeneratingAssetKey] = useState<string | null>(null);
  const [ffmpegAvailable, setFfmpegAvailable] = useState<boolean | null>(null);
  const [isRenderModalOpen, setIsRenderModalOpen] = useState<boolean>(false);
  const [isPresetDrawerOpen, setIsPresetDrawerOpen] = useState<boolean>(false);
  const [ttsProvider, setTtsProvider] = useState<'auto' | 'vieneu' | 'capcut' | 'elevenlabs'>('auto');
  const [isGeneratingVoice, setIsGeneratingVoice] = useState<boolean>(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  // Check FFmpeg status on startup
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setFfmpegAvailable(data.ffmpeg === true);
      })
      .catch(() => {
        setFfmpegAvailable(false);
      });
  }, []);

  // Handler: Load 1929 Wall Street Benchmark Project
  const handleLoadBenchmark = () => {
    setProject(WALL_STREET_DEMO_PROJECT);
    setTopic(WALL_STREET_DEMO_PROJECT.title);
    setDuration(WALL_STREET_DEMO_PROJECT.duration);
    setActiveShotIndex(0);
    setActiveTab('canvas');
  };

  // Handler: Generate Storyboard via AI Director
  const handleGenerateStoryboard = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    try {
      const response = await fetch('/api/director/storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          duration,
          niche: 'documentary',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to direct storyboard');
      }

      const newProject: Project = await response.json();
      setProject({
        ...newProject,
        fps: 30,
        resolution: '1920x1080',
        style: 'vox_paper_collage',
        voiceover: true,
        subtitles: true,
        sfx: true,
        createdAt: new Date().toISOString(),
      });
      setActiveShotIndex(0);
      setActiveTab('canvas');
    } catch (err) {
      console.error('Storyboard error:', err);
      handleLoadBenchmark();
    } finally {
      setIsGenerating(false);
    }
  };

  // Handler: Per-Shot Layout Regeneration
  const handleRegenerateShotLayout = (shotIndex: number) => {
    setProject((prev) => {
      const shots = [...prev.shots];
      const currentLayout = shots[shotIndex].layout;
      const layoutIds = VOX_LAYOUTS.map((l) => l.id);
      const currentIndex = layoutIds.indexOf(currentLayout);
      const nextLayout = layoutIds[(currentIndex + 1) % layoutIds.length];

      shots[shotIndex] = {
        ...shots[shotIndex],
        layout: nextLayout,
      };
      return { ...prev, shots };
    });
  };

  // Handler: Per-Shot Motion Regeneration
  const handleRegenerateShotMotion = (shotIndex: number) => {
    const paperMotions: MotionID[] = [
      'paper_drop',
      'paper_slide_left',
      'paper_slide_right',
      'paper_slide_up',
      'photo_stack',
      'paper_reveal',
    ];

    setProject((prev) => {
      const shots = [...prev.shots];
      const targetShot = shots[shotIndex];
      const hero = targetShot.assets.find((a) => a.role === 'hero');
      const currentMotion = hero?.motion || 'paper_drop';
      const nextMotion =
        paperMotions[(paperMotions.indexOf(currentMotion) + 1) % paperMotions.length];

      const newAssets = targetShot.assets.map((a) =>
        a.role === 'hero' ? { ...a, motion: nextMotion } : a
      );

      shots[shotIndex] = {
        ...targetShot,
        assets: newAssets,
      };
      return { ...prev, shots };
    });
  };

  // Handler: Update shot fields
  const handleUpdateShot = (index: number, updated: Partial<Shot>) => {
    setProject((prev) => {
      const shots = [...prev.shots];
      shots[index] = { ...shots[index], ...updated };
      return { ...prev, shots };
    });
  };

  // Handler: Update project master script
  const handleUpdateProjectScript = (newScript: string) => {
    setProject((prev) => ({
      ...prev,
      script: newScript,
    }));
  };

  // Handler: Generate Single Shot Asset
  const handleGenerateShotAsset = async (shotIndex: number, assetId: string) => {
    const key = `${shotIndex}_${assetId}`;
    setGeneratingAssetKey(key);

    const shot = project.shots[shotIndex];
    const asset = shot.assets.find((a) => a.id === assetId) || shot.assets[0];
    const prompt =
      asset?.assetPrompt ||
      `Archival vintage document or photograph regarding ${project.title}, beat ${shot.order}`;

    setProject((prev) => {
      const shots = [...prev.shots];
      shots[shotIndex] = {
        ...shots[shotIndex],
        assets: shots[shotIndex].assets.map((a) =>
          a.id === assetId ? { ...a, status: 'generating' } : a
        ),
      };
      return { ...prev, shots };
    });

    try {
      const response = await fetch('/api/assets/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          topic: project.title,
          shotId: shot.shot_id,
          assetId,
          role: asset?.role || 'hero',
          layout: shot.layout,
        }),
      });

      const result = await response.json();
      if (result.success && result.url) {
        setProject((prev) => {
          const shots = [...prev.shots];
          shots[shotIndex] = {
            ...shots[shotIndex],
            assets: shots[shotIndex].assets.map((a) =>
              a.id === assetId
                ? {
                    ...a,
                    source: result.url,
                    provider: result.provider,
                    status: 'ready',
                    paperCutout: true,
                  }
                : a
            ),
          };
          return { ...prev, shots };
        });
      }
    } catch (err) {
      console.error('Shot asset generation error:', err);
      setProject((prev) => {
        const shots = [...prev.shots];
        shots[shotIndex] = {
          ...shots[shotIndex],
          assets: shots[shotIndex].assets.map((a) =>
            a.id === assetId ? { ...a, status: 'pending' } : a
          ),
        };
        return { ...prev, shots };
      });
    } finally {
      setGeneratingAssetKey(null);
    }
  };

  // Handler: Upload Custom Archival Image & Cutout
  const handleUploadShotAsset = async (shotIndex: number, assetId: string, file: File) => {
    const key = `${shotIndex}_${assetId}`;
    setGeneratingAssetKey(key);

    const reader = new FileReader();
    reader.onload = async () => {
      const imageBase64 = reader.result as string;
      const shot = project.shots[shotIndex];

      try {
        const response = await fetch('/api/assets/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64,
            shotId: shot.shot_id,
            assetId,
          }),
        });

        const result = await response.json();
        if (result.success && result.url) {
          setProject((prev) => {
            const shots = [...prev.shots];
            shots[shotIndex] = {
              ...shots[shotIndex],
              assets: shots[shotIndex].assets.map((a) =>
                a.id === assetId
                  ? {
                      ...a,
                      source: result.url,
                      provider: 'upload',
                      status: 'ready',
                      paperCutout: true,
                    }
                  : a
              ),
            };
            return { ...prev, shots };
          });
        }
      } catch (err) {
        console.error('Upload asset error:', err);
      } finally {
        setGeneratingAssetKey(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handler: Generate Audio-First Voice & Beat Timeline
  const handleGenerateVoiceAndTimeline = async () => {
    if (!project || project.shots.length === 0) return;
    setIsGeneratingVoice(true);
    setVoiceNotice(null);
    try {
      const response = await fetch('/api/voice-and-timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project,
          provider: ttsProvider,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to synthesize voice and beat timeline');
      }

      const data = await response.json();
      if (data.success && data.project) {
        setProject(data.project);
        setDuration(data.project.duration);
        setVoiceNotice(`Audio-first timeline synced successfully (${data.project.audioTimeline?.beats?.length || 0} beats).`);
      }
    } catch (err: any) {
      console.warn('Audio-first voice generation notice:', err.message);
      setVoiceNotice(`TTS notice: ${err.message}. To run locally, ensure VieNeu or CapCut is running, or set ELEVENLABS_API_KEY.`);
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#121214] text-[#E4E4E7] font-sans-body flex flex-col selection:bg-red-900 selection:text-white">
      {/* Top Header */}
      <StudioHeader
        projectTitle={project.title}
        duration={project.duration}
        ffmpegAvailable={ffmpegAvailable}
        onLoadBenchmark={handleLoadBenchmark}
        isLoading={isGenerating}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenRenderModal={() => setIsRenderModalOpen(true)}
        onOpenPresetDrawer={() => setIsPresetDrawerOpen(true)}
      />

      {/* Main Studio Body: Sidebar + Active Workspace View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Professional Studio Sidebar */}
        <StudioSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          project={project}
          onOpenRenderModal={() => setIsRenderModalOpen(true)}
        />

        {/* Dynamic Studio Workspace Views */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#18181B]/50">
          {activeTab === 'canvas' && (
            <CanvasStudioView
              project={project}
              activeShotIndex={activeShotIndex}
              setActiveShotIndex={setActiveShotIndex}
              onUpdateShot={handleUpdateShot}
              onRegenerateShotLayout={handleRegenerateShotLayout}
              onRegenerateShotMotion={handleRegenerateShotMotion}
              onGenerateShotAsset={handleGenerateShotAsset}
              onUploadShotAsset={handleUploadShotAsset}
              generatingAssetKey={generatingAssetKey}
              onOpenInspector={() => setActiveTab('inspector')}
            />
          )}

          {activeTab === 'overview' && (
            <ProjectOverviewView
              project={project}
              topic={topic}
              setTopic={setTopic}
              duration={duration}
              setDuration={setDuration}
              onGenerateStoryboard={handleGenerateStoryboard}
              isGenerating={isGenerating}
              onJumpToCanvas={() => setActiveTab('canvas')}
            />
          )}

          {activeTab === 'script' && (
            <ScriptEditorView
              project={project}
              onUpdateProjectScript={handleUpdateProjectScript}
              activeShotIndex={activeShotIndex}
              setActiveShotIndex={setActiveShotIndex}
              onJumpToShot={(shotIdx) => {
                setActiveShotIndex(shotIdx);
                setActiveTab('canvas');
              }}
              onGenerateVoiceAndTimeline={handleGenerateVoiceAndTimeline}
              isGeneratingVoice={isGeneratingVoice}
            />
          )}

          {activeTab === 'voice' && (
            <VoiceStudioView
              project={project}
              ttsProvider={ttsProvider}
              setTtsProvider={setTtsProvider}
              onGenerateVoiceAndTimeline={handleGenerateVoiceAndTimeline}
              isGeneratingVoice={isGeneratingVoice}
              voiceNotice={voiceNotice}
              setVoiceNotice={setVoiceNotice}
              onJumpToCanvas={() => setActiveTab('canvas')}
            />
          )}

          {activeTab === 'inspector' && (
            <AssetInspectorView
              project={project}
              activeShotIndex={activeShotIndex}
              setActiveShotIndex={setActiveShotIndex}
              onUpdateShot={handleUpdateShot}
              onGenerateShotAsset={handleGenerateShotAsset}
              onUploadShotAsset={handleUploadShotAsset}
              generatingAssetKey={generatingAssetKey}
            />
          )}
        </div>
      </div>

      {/* Render Dialog Modal */}
      <RenderModal
        isOpen={isRenderModalOpen}
        onClose={() => setIsRenderModalOpen(false)}
        project={project}
        ffmpegAvailable={ffmpegAvailable}
      />

      {/* Architecture Presets Drawer */}
      <PresetDrawer
        isOpen={isPresetDrawerOpen}
        onClose={() => setIsPresetDrawerOpen(false)}
      />
    </div>
  );
}
