import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { TopicDirector } from './components/TopicDirector.tsx';
import { CanvasPlayer } from './components/CanvasPlayer.tsx';
import { StoryboardView } from './components/StoryboardView.tsx';
import { RenderModal } from './components/RenderModal.tsx';
import { PresetDrawer } from './components/PresetDrawer.tsx';
import { WALL_STREET_DEMO_PROJECT } from './data/wallStreetDemo.ts';
import { Project, Shot, LayoutID, MotionID } from './types.ts';
import { VOX_LAYOUTS, VOX_MOTIONS } from './presets/index.ts';
import { Video, BookOpen, Layers, CheckCircle2, Film } from 'lucide-react';

export default function App() {
  const [project, setProject] = useState<Project>(WALL_STREET_DEMO_PROJECT);
  const [topic, setTopic] = useState<string>('The Day Wall Street Crashed');
  const [duration, setDuration] = useState<number>(25);
  const [activeShotIndex, setActiveShotIndex] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [ffmpegAvailable, setFfmpegAvailable] = useState<boolean | null>(null);
  const [isRenderModalOpen, setIsRenderModalOpen] = useState<boolean>(false);
  const [isPresetDrawerOpen, setIsPresetDrawerOpen] = useState<boolean>(false);

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
    } catch (err) {
      console.error('Storyboard error:', err);
      // If error occurs, fallback cleanly
      handleLoadBenchmark();
    } finally {
      setIsGenerating(false);
    }
  };

  // Handler: Per-Shot Layout Regeneration (Section 31)
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

  // Handler: Per-Shot Motion Regeneration (Section 31)
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

  return (
    <div className="min-h-screen bg-[#121214] text-[#E4E4E7] font-sans-body flex flex-col selection:bg-red-900 selection:text-white">
      {/* Top Navigation */}
      <Header
        ffmpegAvailable={ffmpegAvailable}
        onLoadBenchmark={handleLoadBenchmark}
        isLoading={isGenerating}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Top Section: AI Director Inputs & Video Canvas Player */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Topic Director & Fast Configuration (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <TopicDirector
              topic={topic}
              setTopic={setTopic}
              duration={duration}
              setDuration={setDuration}
              onGenerate={handleGenerateStoryboard}
              isGenerating={isGenerating}
              totalShots={project.shots.length}
            />

            {/* Pipeline Status Card */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-zinc-300 uppercase">
                  Active Project Spec
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-amber-300">
                  {project.shots.length} Beats ({project.duration}s)
                </span>
              </div>

              <p className="text-xs font-typewriter text-zinc-400 bg-zinc-950 p-2.5 rounded border border-zinc-800/80 leading-relaxed">
                "{project.script.slice(0, 190)}..."
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                <div className="bg-zinc-950 p-2 rounded border border-zinc-800/60">
                  <span className="text-zinc-500 block text-[10px]">Composition:</span>
                  <span className="text-zinc-300 font-semibold">Physical Collage</span>
                </div>
                <div className="bg-zinc-950 p-2 rounded border border-zinc-800/60">
                  <span className="text-zinc-500 block text-[10px]">Camera Mode:</span>
                  <span className="text-zinc-300 font-semibold">Locked Desk Top-Down</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
                <button
                  onClick={() => setIsPresetDrawerOpen(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono transition"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>Preset Library (8 Layouts / 12 Motions)</span>
                </button>
              </div>
            </div>

            {/* Final Render CTA */}
            <div className="p-4 bg-gradient-to-r from-red-950/50 to-zinc-900 border border-red-900/40 rounded-xl flex items-center justify-between gap-4">
              <div>
                <h4 className="font-editorial text-sm font-bold uppercase tracking-tight text-white">
                  Section 27: FFmpeg Render
                </h4>
                <p className="text-xs text-zinc-400 font-sans-body">
                  Produce final 1080p documentary MP4
                </p>
              </div>
              <button
                onClick={() => setIsRenderModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-mono font-bold text-xs rounded-lg transition shadow-lg shadow-red-950/60"
              >
                <Video className="w-4 h-4" />
                <span>RENDER MP4</span>
              </button>
            </div>
          </div>

          {/* Right Column: Interactive 1920x1080 Canvas Player (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            <CanvasPlayer
              project={project}
              activeShotIndex={activeShotIndex}
              setActiveShotIndex={setActiveShotIndex}
            />
          </div>
        </div>

        {/* Bottom Section: Full Storyboard & Beat Inspector */}
        <StoryboardView
          project={project}
          activeShotIndex={activeShotIndex}
          setActiveShotIndex={setActiveShotIndex}
          onUpdateShot={handleUpdateShot}
          onRegenerateShotLayout={handleRegenerateShotLayout}
          onRegenerateShotMotion={handleRegenerateShotMotion}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-4 px-6 text-center text-xs font-mono text-zinc-600 bg-zinc-950">
        VOX AUTO VIDEO ENGINE V0.1 • AI Director + Paper Collage Compositor + Stepped Motion Engine + FFmpeg
      </footer>

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
