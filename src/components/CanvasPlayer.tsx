import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  ShieldCheck,
  Grid,
  Volume2,
  VolumeX,
  Activity,
  Sparkles,
  Mic,
} from 'lucide-react';
import { Project, Shot, Beat } from '../types.ts';
import { renderShotFrame, preloadShotImages } from '../utils/compositor.ts';

interface CanvasPlayerProps {
  project: Project;
  activeShotIndex: number;
  setActiveShotIndex: (idx: number) => void;
  onFramesReadyForRender?: (frames: string[]) => void;
}

export const CanvasPlayer: React.FC<CanvasPlayerProps> = ({
  project,
  activeShotIndex,
  setActiveShotIndex,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [showSafeArea, setShowSafeArea] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'shot' | 'timeline' | 'contact_sheet'>('shot');
  const [previewQuality, setPreviewQuality] = useState<'draft' | 'full'>('draft');
  const [currentTime, setCurrentTime] = useState<number>(0); // Seconds within current shot or project
  const animationFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);

  const activeShot: Shot = project.shots[activeShotIndex] || project.shots[0];

  // Global time for beat matching
  const globalTime =
    viewMode === 'shot'
      ? (activeShot?.start || 0) + currentTime
      : currentTime;

  const allBeats: Beat[] = project.audioTimeline?.beats || [];
  const activeBeat = allBeats.find(
    (b) => globalTime >= b.start && globalTime < b.end
  ) || null;

  // Preload image assets on shot change
  useEffect(() => {
    if (activeShot) {
      preloadShotImages(activeShot);
    }
  }, [activeShot]);

  // Sync audio play/pause and rate
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !project.voiceUrl) return;

    if (isPlaying) {
      const targetTime = globalTime;
      if (Math.abs(audio.currentTime - targetTime) > 0.25) {
        audio.currentTime = Math.min(targetTime, audio.duration || targetTime);
      }
      audio.playbackRate = playbackSpeed;
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying, project.voiceUrl, globalTime, playbackSpeed]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.muted = isMuted;
    }
  }, [isMuted]);

  // Main rendering loop for active shot
  const renderCurrent = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activeShot) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderW = previewQuality === 'draft' ? 960 : 1920;
    const renderH = previewQuality === 'draft' ? 540 : 1080;

    if (canvas.width !== renderW || canvas.height !== renderH) {
      canvas.width = renderW;
      canvas.height = renderH;
    }

    if (viewMode === 'contact_sheet') {
      renderContactSheet(ctx, project);
      return;
    }

    if (viewMode === 'shot') {
      renderShotFrame(ctx, activeShot, currentTime, renderW, renderH);
    } else {
      // Timeline continuous mode
      let accumulated = 0;
      let targetShot = project.shots[0];
      let shotTime = 0;

      for (const s of project.shots) {
        if (currentTime >= accumulated && currentTime < accumulated + s.duration) {
          targetShot = s;
          shotTime = currentTime - accumulated;
          break;
        }
        accumulated += s.duration;
      }
      if (currentTime >= accumulated && project.shots.length > 0) {
        targetShot = project.shots[project.shots.length - 1];
        shotTime = targetShot.duration;
      }

      renderShotFrame(ctx, targetShot, shotTime, renderW, renderH);
    }

    // Draw Title Safe Area Guide (90% margins) if enabled
    if (showSafeArea) {
      ctx.save();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      // 90% safe action
      ctx.strokeRect(renderW * 0.05, renderH * 0.05, renderW * 0.9, renderH * 0.9);
      // 80% safe title
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.4)';
      ctx.strokeRect(renderW * 0.1, renderH * 0.1, renderW * 0.8, renderH * 0.8);
      ctx.restore();
    }
  }, [activeShot, currentTime, previewQuality, project, showSafeArea, viewMode]);

  // Frame tick
  useEffect(() => {
    if (!isPlaying) {
      renderCurrent();
      return;
    }

    const maxDuration =
      viewMode === 'shot'
        ? activeShot?.duration || 4.5
        : project.shots.reduce((acc, s) => acc + s.duration, 0);

    const tick = (timestamp: number) => {
      if (!lastTimestampRef.current) {
        lastTimestampRef.current = timestamp;
      }
      const delta = (timestamp - lastTimestampRef.current) / 1000;
      lastTimestampRef.current = timestamp;

      setCurrentTime((prev) => {
        const next = prev + delta * playbackSpeed;
        if (next >= maxDuration) {
          setIsPlaying(false);
          lastTimestampRef.current = null;
          if (audioRef.current) audioRef.current.pause();
          return maxDuration;
        }
        return next;
      });

      renderCurrent();
      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      lastTimestampRef.current = null;
    };
  }, [isPlaying, playbackSpeed, viewMode, activeShot, project, renderCurrent]);

  // Re-render when dependencies change
  useEffect(() => {
    renderCurrent();
  }, [renderCurrent]);

  const maxDuration =
    viewMode === 'shot'
      ? activeShot?.duration || 4.5
      : project.shots.reduce((acc, s) => acc + s.duration, 0);

  const handleSeek = (newTime: number) => {
    setCurrentTime(newTime);
    if (audioRef.current && project.voiceUrl) {
      const gTime = viewMode === 'shot' ? (activeShot?.start || 0) + newTime : newTime;
      audioRef.current.currentTime = gTime;
    }
    renderCurrent();
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current && project.voiceUrl) {
      const gTime = viewMode === 'shot' ? (activeShot?.start || 0) : 0;
      audioRef.current.currentTime = gTime;
      audioRef.current.pause();
    }
    renderCurrent();
  };

  const handleBeatJump = (beat: Beat) => {
    if (viewMode === 'timeline') {
      handleSeek(beat.start);
    } else {
      const shotIndex = project.shots.findIndex((s) => s.shot_id === beat.shotId);
      if (shotIndex !== -1) {
        setActiveShotIndex(shotIndex);
        const shot = project.shots[shotIndex];
        handleSeek(Math.max(0, beat.start - shot.start));
      }
    }
  };

  // Render Section 29 Contact Sheet
  function renderContactSheet(ctx: CanvasRenderingContext2D, proj: Project) {
    ctx.clearRect(0, 0, 1920, 1080);
    ctx.fillStyle = '#121214';
    ctx.fillRect(0, 0, 1920, 1080);

    ctx.fillStyle = '#E4E4E7';
    ctx.font = 'bold 36px "Oswald", sans-serif';
    ctx.fillText(`CONTACT SHEET: ${proj.title.toUpperCase()} (VISUAL CONSISTENCY GATE)`, 60, 60);

    const shots = proj.shots;
    const cols = 3;
    const rows = 2;
    const marginX = 60;
    const marginY = 90;
    const gapX = 30;
    const gapY = 30;

    const cellW = (1920 - marginX * 2 - gapX * (cols - 1)) / cols;
    const cellH = (1080 - marginY - 60 - gapY * (rows - 1)) / rows;

    shots.slice(0, 6).forEach((s, idx) => {
      const c = idx % cols;
      const r = Math.floor(idx / cols);
      const x = marginX + c * (cellW + gapX);
      const y = marginY + r * (cellH + gapY);

      const offCanvas = document.createElement('canvas');
      offCanvas.width = 1920;
      offCanvas.height = 1080;
      const offCtx = offCanvas.getContext('2d');
      if (offCtx) {
        renderShotFrame(offCtx, s, Math.min(s.duration, 2.5), 1920, 1080);
        ctx.drawImage(offCanvas, x, y, cellW, cellH);
      }

      ctx.strokeStyle = idx === activeShotIndex ? '#DC2626' : 'rgba(255,255,255,0.2)';
      ctx.lineWidth = idx === activeShotIndex ? 4 : 1.5;
      ctx.strokeRect(x, y, cellW, cellH);

      ctx.fillStyle = 'rgba(10,10,10,0.85)';
      ctx.fillRect(x + 10, y + 10, 190, 36);
      ctx.fillStyle = '#F4EEDA';
      ctx.font = 'bold 16px "Courier Prime", monospace';
      ctx.fillText(`SHOT 0${s.order} • ${s.layout}`, x + 18, y + 34);
    });
  }

  // Filter beats visible in current view
  const visibleBeats =
    viewMode === 'shot'
      ? allBeats.filter((b) => b.shotId === activeShot?.shot_id)
      : allBeats;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl flex flex-col">
      {/* Hidden native audio element for synchronization */}
      {project.voiceUrl && (
        <audio
          ref={audioRef}
          src={project.voiceUrl}
          preload="auto"
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* Top Bar with Mode Controls */}
      <div className="bg-zinc-950 px-4 py-2.5 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-zinc-200">
            {viewMode === 'shot'
              ? `PREVIEW: SHOT ${String(activeShotIndex + 1).padStart(2, '0')} (${activeShot?.layout.toUpperCase()})`
              : viewMode === 'timeline'
              ? `FULL CONTINUOUS TIMELINE (${project.duration}s)`
              : 'CONTACT SHEET (VISUAL CONSISTENCY CHECK)'}
          </span>
          {project.voiceUrl && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-800/80 text-[10px] text-amber-300">
              <Mic className="w-2.5 h-2.5" />
              <span>Voice Track</span>
            </span>
          )}
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
          <button
            onClick={() => setViewMode('shot')}
            className={`px-3 py-1 rounded transition ${
              viewMode === 'shot' ? 'bg-zinc-700 text-amber-300 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Single Shot
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1 rounded transition ${
              viewMode === 'timeline' ? 'bg-zinc-700 text-amber-300 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Timeline
          </button>
          <button
            onClick={() => setViewMode('contact_sheet')}
            className={`flex items-center gap-1 px-3 py-1 rounded transition ${
              viewMode === 'contact_sheet' ? 'bg-zinc-700 text-amber-300 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Grid className="w-3 h-3" />
            <span>Contact Sheet</span>
          </button>
        </div>

        {/* Audio Mute, Safe Area & Speed */}
        <div className="flex items-center gap-2">
          {project.voiceUrl && (
            <button
              onClick={() => setIsMuted((prev) => !prev)}
              className={`p-1.5 rounded border transition ${
                isMuted
                  ? 'bg-red-950/60 border-red-500 text-red-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
              }`}
              title={isMuted ? 'Unmute voice audio' : 'Mute voice audio'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Preview Resolution Quality Selector */}
          <div className="flex items-center gap-1 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
            <button
              onClick={() => setPreviewQuality('draft')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
                previewQuality === 'draft'
                  ? 'bg-amber-400 text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Draft Mode (960x540): Ultra smooth playback, 0% CPU lag"
            >
              Draft 540p
            </button>
            <button
              onClick={() => setPreviewQuality('full')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
                previewQuality === 'full'
                  ? 'bg-amber-400 text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Full Mode (1920x1080): Crisp master inspection"
            >
              Full 1080p
            </button>
          </div>

          <button
            onClick={() => setShowSafeArea((prev) => !prev)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded border transition ${
              showSafeArea
                ? 'bg-red-950/60 border-red-500 text-red-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Toggle TV Safe Title Action Box"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Safe Area</span>
          </button>

          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
            className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-zinc-300 focus:outline-none"
          >
            <option value={1.0}>1.0x Speed</option>
            <option value={0.5}>0.5x Slow (Inspect)</option>
            <option value={0.25}>0.25x Step</option>
          </select>
        </div>
      </div>

      {/* 16:9 Canvas Viewport */}
      <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          width={1920}
          height={1080}
          className="w-full h-full object-contain cursor-pointer"
          onClick={() => setIsPlaying((prev) => !prev)}
        />

        {/* Dynamic Vox-Style Subtitle Overlay with Active Beat Word Highlighting */}
        {activeShot?.narration && viewMode !== 'contact_sheet' && (
          <div className="absolute bottom-4 left-6 right-6 pointer-events-none flex flex-col items-center gap-1.5">
            {/* Visual Cue Pill */}
            {activeBeat?.visualCue && (
              <div className="bg-amber-950/90 border border-amber-600/80 px-2.5 py-0.5 rounded text-[10px] font-mono text-amber-200 shadow-md backdrop-blur-sm flex items-center gap-1.5 animate-fadeIn">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span className="font-bold">CUE:</span>
                <span>{activeBeat.visualCue}</span>
              </div>
            )}

            {/* Subtitle Banner */}
            <div className="bg-black/85 backdrop-blur-md border border-zinc-800 px-4 py-2 rounded-md max-w-3xl text-center shadow-2xl">
              <p className="text-zinc-200 font-typewriter text-xs sm:text-sm leading-relaxed">
                {activeBeat ? (
                  activeShot.narration.split(activeBeat.text).map((part, i, arr) => (
                    <React.Fragment key={i}>
                      {part}
                      {i < arr.length - 1 && (
                        <span className="bg-amber-400 text-zinc-950 font-bold px-1.5 py-0.5 rounded mx-1 shadow-sm selection:bg-amber-500">
                          {activeBeat.text}
                        </span>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <span>"{activeShot.narration}"</span>
                )}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Timeline Controls, Beat Track & Scrubber */}
      <div className="bg-zinc-950 px-4 py-3 border-t border-zinc-800 flex flex-col gap-2.5">
        {/* Scrubber Bar */}
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={maxDuration}
            step={0.05}
            value={currentTime}
            onChange={(e) => handleSeek(parseFloat(e.target.value))}
            className="flex-1 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-600"
          />
          <span className="text-xs font-mono text-zinc-400 w-24 text-right">
            {currentTime.toFixed(2)}s / {maxDuration.toFixed(2)}s
          </span>
        </div>

        {/* Beat Engine Track: 5-8 word rhythm blocks */}
        {visibleBeats.length > 0 && (
          <div className="flex flex-col gap-1 pt-1 border-t border-zinc-900">
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
              <span className="flex items-center gap-1 font-bold text-amber-400/90 uppercase">
                <Activity className="w-3 h-3" />
                <span>Beat Timeline ({visibleBeats.length} beats)</span>
              </span>
              <span>
                {activeBeat
                  ? `Active Beat: "${activeBeat.text.slice(0, 36)}..." (${activeBeat.start.toFixed(1)}s - ${activeBeat.end.toFixed(1)}s)`
                  : 'Click beat block to jump'}
              </span>
            </div>

            {/* Segmented Beat Block Bar */}
            <div className="flex items-center gap-1 w-full h-5 bg-zinc-900 p-0.5 rounded border border-zinc-800 overflow-hidden">
              {visibleBeats.map((beat, idx) => {
                const isActive = activeBeat?.id === beat.id;
                const viewDuration = maxDuration || 1;
                const relDuration = viewMode === 'shot' ? beat.duration : beat.duration;
                const flexBasis = `${Math.max(4, (relDuration / viewDuration) * 100)}%`;

                return (
                  <button
                    key={beat.id}
                    onClick={() => handleBeatJump(beat)}
                    title={`Beat ${idx + 1}: ${beat.text} (${beat.duration}s)\nCue: ${beat.visualCue}`}
                    style={{ flex: `${relDuration} 0 0%` }}
                    className={`h-full rounded-sm text-[9px] font-mono px-1 flex items-center justify-center truncate transition cursor-pointer ${
                      isActive
                        ? 'bg-amber-400 text-zinc-950 font-bold shadow-md ring-1 ring-amber-300'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span className="truncate">B{idx + 1}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Play / Reset / Navigation Buttons */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-mono font-semibold transition active:scale-95 shadow-md shadow-red-950/40"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>PAUSE</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>PLAY</span>
                </>
              )}
            </button>

            <button
              onClick={handleReset}
              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs transition active:scale-95"
              title="Reset Playhead"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Shot Selector Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
            {project.shots.map((s, idx) => (
              <button
                key={s.shot_id}
                onClick={() => {
                  setActiveShotIndex(idx);
                  setCurrentTime(0);
                  setIsPlaying(false);
                }}
                className={`px-2.5 py-1 text-xs font-mono rounded border transition ${
                  activeShotIndex === idx && viewMode === 'shot'
                    ? 'bg-amber-400/10 border-amber-500 text-amber-300 font-bold'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Shot {String(idx + 1).padStart(2, '0')}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
