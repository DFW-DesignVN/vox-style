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
  Gauge,
} from 'lucide-react';
import { Project, Shot, Beat } from '../types.ts';
import { renderShotFrame, preloadShotImages } from '../utils/compositor.ts';
import { getAssetCacheStats } from '../utils/assetCache.ts';

export type PreviewQualityMode = 'performance' | 'balanced' | 'full';

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

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [showSafeArea, setShowSafeArea] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'shot' | 'timeline' | 'contact_sheet'>('shot');
  const [previewQuality, setPreviewQuality] = useState<PreviewQualityMode>('balanced');
  const [showPerfMonitor, setShowPerfMonitor] = useState<boolean>(false);

  // High-frequency playback timing in REFS (bypasses React 60fps re-render overhead)
  const currentTimeRef = useRef<number>(0);
  const [displayTime, setDisplayTime] = useState<number>(0); // Throttled for UI slider/counter (12Hz)

  // Real Performance Monitor Metrics
  const [perfStats, setPerfStats] = useState({
    fps: 30,
    frameTimeMs: 16.6,
    renderTimeMs: 4.2,
    droppedFrames: 0,
    assetsTracked: 0,
    assetsReady: 0,
  });

  const perfDataRef = useRef({
    lastFrameTime: performance.now(),
    frameCount: 0,
    fpsCalcTime: performance.now(),
    fps: 30,
    frameTimeMs: 16.6,
    renderTimeMs: 4.2,
    droppedFrames: 0,
    targetFrameInterval: 1000 / 24, // Balanced: 24fps
  });

  const animationFrameRef = useRef<number | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  const playbackSpeedRef = useRef<number>(1.0);
  const viewModeRef = useRef<'shot' | 'timeline' | 'contact_sheet'>('shot');
  const previewQualityRef = useRef<PreviewQualityMode>('balanced');
  const projectRef = useRef<Project>(project);
  const activeShotIndexRef = useRef<number>(activeShotIndex);

  // Keep refs in sync with props/state
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { playbackSpeedRef.current = playbackSpeed; }, [playbackSpeed]);
  useEffect(() => { viewModeRef.current = viewMode; }, [viewMode]);
  useEffect(() => { previewQualityRef.current = previewQuality; }, [previewQuality]);
  useEffect(() => { projectRef.current = project; }, [project]);
  useEffect(() => { activeShotIndexRef.current = activeShotIndex; }, [activeShotIndex]);

  // Target FPS and resolution per mode
  useEffect(() => {
    if (previewQuality === 'performance') {
      perfDataRef.current.targetFrameInterval = 1000 / 15;
    } else if (previewQuality === 'balanced') {
      perfDataRef.current.targetFrameInterval = 1000 / 24;
    } else {
      perfDataRef.current.targetFrameInterval = 1000 / 30;
    }
  }, [previewQuality]);

  const activeShot: Shot = project.shots[activeShotIndex] || project.shots[0];

  // Preload image assets on shot change
  useEffect(() => {
    if (activeShot) {
      preloadShotImages(activeShot);
    }
  }, [activeShot]);

  // Global time calculation for beat detection
  const globalTime =
    viewMode === 'shot'
      ? (activeShot?.start || 0) + displayTime
      : displayTime;

  const allBeats: Beat[] = project.audioTimeline?.beats || [];
  const activeBeat = allBeats.find(
    (b) => globalTime >= b.start && globalTime < b.end
  ) || null;

  // Single Frame Draw Procedure
  const drawFrame = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const quality = previewQualityRef.current;
    let renderW = 960;
    let renderH = 540;
    if (quality === 'performance') {
      renderW = 640;
      renderH = 360;
    } else if (quality === 'full') {
      renderW = 1920;
      renderH = 1080;
    }

    if (canvas.width !== renderW || canvas.height !== renderH) {
      canvas.width = renderW;
      canvas.height = renderH;
    }

    const mode = viewModeRef.current;
    const proj = projectRef.current;
    const currentShot = proj.shots[activeShotIndexRef.current] || proj.shots[0];

    if (mode === 'contact_sheet') {
      renderContactSheet(ctx, proj);
      return;
    }

    if (mode === 'shot') {
      renderShotFrame(ctx, currentShot, time, renderW, renderH);
    } else {
      let accumulated = 0;
      let targetShot = proj.shots[0];
      let shotTime = 0;

      for (const s of proj.shots) {
        if (time >= accumulated && time < accumulated + s.duration) {
          targetShot = s;
          shotTime = time - accumulated;
          break;
        }
        accumulated += s.duration;
      }
      if (time >= accumulated && proj.shots.length > 0) {
        targetShot = proj.shots[proj.shots.length - 1];
        shotTime = targetShot.duration;
      }

      renderShotFrame(ctx, targetShot, shotTime, renderW, renderH);
    }

    if (showSafeArea) {
      ctx.save();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.strokeRect(renderW * 0.05, renderH * 0.05, renderW * 0.9, renderH * 0.9);
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.4)';
      ctx.strokeRect(renderW * 0.1, renderH * 0.1, renderW * 0.8, renderH * 0.8);
      ctx.restore();
    }
  }, [showSafeArea]);

  // Imperative Single Playback Loop (Master Animation Loop)
  useEffect(() => {
    if (!isPlaying) {
      drawFrame(currentTimeRef.current);
      return;
    }

    const audio = audioRef.current;
    const hasAudio = !!(project.voiceUrl && audio);
    let lastUiUpdateTime = performance.now();
    let lastRenderTimestamp = performance.now();

    const maxDuration =
      viewModeRef.current === 'shot'
        ? (project.shots[activeShotIndexRef.current]?.duration || 4.5)
        : project.shots.reduce((acc, s) => acc + s.duration, 0);

    // If audio is available, sync and play
    if (hasAudio) {
      const gTime =
        viewModeRef.current === 'shot'
          ? (project.shots[activeShotIndexRef.current]?.start || 0) + currentTimeRef.current
          : currentTimeRef.current;
      if (Math.abs(audio.currentTime - gTime) > 0.2) {
        audio.currentTime = Math.min(gTime, audio.duration || gTime);
      }
      audio.playbackRate = playbackSpeedRef.current;
      audio.muted = isMuted;
      audio.play().catch(() => {});
    }

    const tick = (timestamp: number) => {
      if (!isPlayingRef.current) return;

      const pData = perfDataRef.current;
      const elapsedSinceLastRender = timestamp - lastRenderTimestamp;

      // Throttle render if in Performance (15fps) or Balanced (24fps) mode
      if (elapsedSinceLastRender >= pData.targetFrameInterval - 1.5) {
        lastRenderTimestamp = timestamp;

        // Calculate current time: use audio clock if audio is active, else delta time
        let nextTime = currentTimeRef.current;
        if (hasAudio && !audio.paused && audio.duration > 0) {
          const audioCurrent = audio.currentTime;
          if (viewModeRef.current === 'shot') {
            const shotStart = project.shots[activeShotIndexRef.current]?.start || 0;
            nextTime = Math.max(0, audioCurrent - shotStart);
          } else {
            nextTime = audioCurrent;
          }
        } else {
          const delta = elapsedSinceLastRender / 1000;
          nextTime += delta * playbackSpeedRef.current;
        }

        currentTimeRef.current = nextTime;

        // Stop condition
        if (nextTime >= maxDuration) {
          setIsPlaying(false);
          currentTimeRef.current = maxDuration;
          setDisplayTime(maxDuration);
          drawFrame(maxDuration);
          if (hasAudio) audio.pause();
          return;
        }

        // Draw canvas frame
        const renderStart = performance.now();
        drawFrame(nextTime);
        const renderDuration = performance.now() - renderStart;

        // Performance metrics
        pData.frameCount++;
        pData.frameTimeMs = timestamp - pData.lastFrameTime;
        pData.renderTimeMs = renderDuration;
        if (pData.frameTimeMs > pData.targetFrameInterval * 1.5) {
          pData.droppedFrames++;
        }
        pData.lastFrameTime = timestamp;

        // Calculate FPS every 500ms
        if (timestamp - pData.fpsCalcTime >= 500) {
          pData.fps = Math.round((pData.frameCount * 1000) / (timestamp - pData.fpsCalcTime));
          pData.frameCount = 0;
          pData.fpsCalcTime = timestamp;

          const stats = getAssetCacheStats();
          setPerfStats({
            fps: pData.fps,
            frameTimeMs: Number(pData.frameTimeMs.toFixed(1)),
            renderTimeMs: Number(pData.renderTimeMs.toFixed(1)),
            droppedFrames: pData.droppedFrames,
            assetsTracked: stats.totalTracked,
            assetsReady: stats.readyCount,
          });
        }

        // Update UI React state at low frequency (12Hz ~ 80ms)
        if (timestamp - lastUiUpdateTime >= 80) {
          lastUiUpdateTime = timestamp;
          setDisplayTime(Number(nextTime.toFixed(2)));
        }
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (hasAudio) audio.pause();
    };
  }, [isPlaying, isMuted, drawFrame, project.voiceUrl, project.shots]);

  // Re-render when dependencies change
  useEffect(() => {
    drawFrame(currentTimeRef.current);
  }, [drawFrame, previewQuality, activeShotIndex]);

  const maxDuration =
    viewMode === 'shot'
      ? activeShot?.duration || 4.5
      : project.shots.reduce((acc, s) => acc + s.duration, 0);

  const handleSeek = (newTime: number) => {
    currentTimeRef.current = newTime;
    setDisplayTime(newTime);
    if (audioRef.current && project.voiceUrl) {
      const gTime = viewMode === 'shot' ? (activeShot?.start || 0) + newTime : newTime;
      audioRef.current.currentTime = gTime;
    }
    drawFrame(newTime);
  };

  const handleReset = () => {
    setIsPlaying(false);
    currentTimeRef.current = 0;
    setDisplayTime(0);
    if (audioRef.current && project.voiceUrl) {
      const gTime = viewMode === 'shot' ? (activeShot?.start || 0) : 0;
      audioRef.current.currentTime = gTime;
      audioRef.current.pause();
    }
    drawFrame(0);
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

  function renderContactSheet(ctx: CanvasRenderingContext2D, proj: Project) {
    ctx.clearRect(0, 0, 1920, 1080);
    ctx.fillStyle = '#121214';
    ctx.fillRect(0, 0, 1920, 1080);

    ctx.fillStyle = '#E4E4E7';
    ctx.font = 'bold 36px "Oswald", sans-serif';
    ctx.fillText(`CONTACT SHEET: ${proj.title.toUpperCase()} (VISUAL CONSISTENCY GATE)`, 60, 60);

    const shots = proj.shots;
    const cols = 3;
    const cellW = 540;
    const cellH = 304;
    const startX = 60;
    const startY = 100;
    const gapX = 40;
    const gapY = 40;

    shots.slice(0, 6).forEach((s, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = startX + col * (cellW + gapX);
      const y = startY + row * (cellH + gapY);

      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = '#18181B';
      ctx.fillRect(0, 0, cellW, cellH);

      const off = document.createElement('canvas');
      off.width = 1920;
      off.height = 1080;
      const offCtx = off.getContext('2d');
      if (offCtx) {
        renderShotFrame(offCtx, s, s.duration * 0.4, 1920, 1080);
        ctx.drawImage(off, 0, 0, cellW, cellH);
      }

      ctx.strokeStyle = '#3F3F46';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(0, 0, cellW, cellH);

      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(0, cellH - 32, cellW, 32);
      ctx.fillStyle = '#F4EEDA';
      ctx.font = '13px "Courier Prime", monospace';
      ctx.fillText(`SHOT 0${s.order} • ${s.layout.toUpperCase()} • ${s.duration}s`, 12, cellH - 11);

      ctx.restore();
    });
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl flex flex-col">
      {/* Hidden Audio Element for Master Sync */}
      {project.voiceUrl && (
        <audio
          ref={audioRef}
          src={project.voiceUrl}
          preload="auto"
          onEnded={() => {
            if (isPlaying) setIsPlaying(false);
          }}
        />
      )}

      {/* Player Header Bar with 3-tier Quality Mode & Perf Monitor */}
      <div className="bg-zinc-950 px-4 py-2.5 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-zinc-200 uppercase tracking-wider">
            {viewMode === 'shot'
              ? `Shot 0${activeShot?.order || 1}: ${activeShot?.layout || 'Archive'}`
              : viewMode === 'timeline'
              ? `Full Sequence (${project.shots.length} Shots • ${project.duration}s)`
              : 'Contact Sheet Inspection'}
          </span>
          <span className="text-zinc-500">|</span>
          <span className="text-zinc-400">
            {displayTime.toFixed(2)}s / {maxDuration.toFixed(2)}s
          </span>
        </div>

        {/* View mode toggle, Quality selector, Debug Monitor */}
        <div className="flex items-center gap-2">
          {/* View Mode Buttons */}
          <div className="flex items-center bg-zinc-900 p-0.5 rounded border border-zinc-800">
            <button
              onClick={() => {
                setViewMode('shot');
                currentTimeRef.current = 0;
                setDisplayTime(0);
              }}
              className={`px-2 py-0.5 rounded text-[11px] transition ${
                viewMode === 'shot'
                  ? 'bg-zinc-800 text-amber-300 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Shot
            </button>
            <button
              onClick={() => {
                setViewMode('timeline');
                currentTimeRef.current = 0;
                setDisplayTime(0);
              }}
              className={`px-2 py-0.5 rounded text-[11px] transition ${
                viewMode === 'timeline'
                  ? 'bg-zinc-800 text-amber-300 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Sequence
            </button>
            <button
              onClick={() => setViewMode('contact_sheet')}
              className={`px-2 py-0.5 rounded text-[11px] transition ${
                viewMode === 'contact_sheet'
                  ? 'bg-zinc-800 text-amber-300 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Sheet
            </button>
          </div>

          {/* 3-Tier Preview Quality Selector */}
          <div className="flex items-center bg-zinc-900 p-0.5 rounded border border-zinc-800">
            <button
              onClick={() => setPreviewQuality('performance')}
              className={`px-2 py-0.5 rounded text-[10px] transition ${
                previewQuality === 'performance'
                  ? 'bg-emerald-500 text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Performance Mode: 640x360 @ 15fps (Zero CPU overhead)"
            >
              Performance
            </button>
            <button
              onClick={() => setPreviewQuality('balanced')}
              className={`px-2 py-0.5 rounded text-[10px] transition ${
                previewQuality === 'balanced'
                  ? 'bg-amber-400 text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Balanced Mode: 960x540 @ 24fps (Smooth preview)"
            >
              Balanced
            </button>
            <button
              onClick={() => setPreviewQuality('full')}
              className={`px-2 py-0.5 rounded text-[10px] transition ${
                previewQuality === 'full'
                  ? 'bg-red-500 text-white font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Full Master: 1920x1080 @ 30fps (Crisp inspection)"
            >
              Full
            </button>
          </div>

          {/* Perf Monitor Toggle */}
          <button
            onClick={() => setShowPerfMonitor((prev) => !prev)}
            className={`flex items-center gap-1 px-2 py-1 rounded border transition ${
              showPerfMonitor
                ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Toggle Live Frame Performance Monitor"
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>Perf</span>
          </button>

          {/* Audio Mute Toggle */}
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

          <button
            onClick={() => setShowSafeArea((prev) => !prev)}
            className={`flex items-center gap-1 px-2 py-1 rounded border transition ${
              showSafeArea
                ? 'bg-red-950/60 border-red-500 text-red-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Toggle TV Safe Title Action Box"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Safe</span>
          </button>

          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
            className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-1 text-zinc-300 focus:outline-none text-[11px]"
          >
            <option value={1.0}>1.0x</option>
            <option value={0.5}>0.5x Slow</option>
            <option value={0.25}>0.25x Step</option>
          </select>
        </div>
      </div>

      {/* 16:9 Canvas Viewport */}
      <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          width={960}
          height={540}
          className="w-full h-full object-contain cursor-pointer"
          onClick={() => setIsPlaying((prev) => !prev)}
        />

        {/* Live Frame Performance HUD (Dev-only monitor) */}
        {showPerfMonitor && (
          <div className="absolute top-3 left-3 bg-zinc-950/85 backdrop-blur border border-zinc-700/80 rounded p-2.5 text-[11px] font-mono text-zinc-300 shadow-xl pointer-events-none flex flex-col gap-1 z-30">
            <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-1">
              <span className="font-bold text-amber-400 uppercase">CANVAS PERFORMANCE</span>
              <span className="text-zinc-500">{previewQuality.toUpperCase()}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 pt-0.5">
              <span className="text-zinc-500">FPS:</span>
              <span className={`font-bold ${perfStats.fps >= 24 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {perfStats.fps} fps
              </span>

              <span className="text-zinc-500">Frame Time:</span>
              <span className="text-zinc-200">{perfStats.frameTimeMs} ms</span>

              <span className="text-zinc-500">Render Time:</span>
              <span className="text-zinc-200">{perfStats.renderTimeMs} ms</span>

              <span className="text-zinc-500">Dropped:</span>
              <span className={perfStats.droppedFrames > 5 ? 'text-red-400' : 'text-zinc-300'}>
                {perfStats.droppedFrames}
              </span>

              <span className="text-zinc-500">Assets Ready:</span>
              <span className="text-emerald-400">
                {perfStats.assetsReady} / {perfStats.assetsTracked}
              </span>
            </div>
          </div>
        )}

        {/* Dynamic Vox-Style Subtitle Overlay with Active Beat Word Highlighting */}
        {viewMode !== 'contact_sheet' && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 max-w-2xl w-[90%] text-center pointer-events-none px-4 py-2 bg-black/75 backdrop-blur-sm rounded-lg border border-white/10 shadow-lg">
            <p className="font-typewriter text-xs sm:text-sm text-zinc-200 leading-relaxed">
              {activeShot?.narration}
            </p>
            {activeBeat && (
              <div className="mt-1 flex items-center justify-center gap-1.5 text-[11px] font-mono text-amber-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                <span className="font-bold uppercase tracking-wider">BEAT: "{activeBeat.text}"</span>
                {activeBeat.visualCue && (
                  <span className="text-zinc-400">({activeBeat.visualCue})</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scrubbing & Transport Controls */}
      <div className="p-4 bg-zinc-950 flex flex-col gap-3">
        {/* Timeline Progress Slider */}
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={maxDuration}
            step={0.05}
            value={displayTime}
            onChange={(e) => handleSeek(parseFloat(e.target.value))}
            className="flex-1 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>

        {/* Transport Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying((prev) => !prev)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold rounded-lg transition font-mono text-xs shadow-md shadow-amber-950/30"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
            </button>

            <button
              onClick={handleReset}
              className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg transition border border-zinc-800"
              title="Reset to frame 0"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Shot Selector Tabs in Shot View Mode */}
          {viewMode === 'shot' && (
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-md">
              {project.shots.map((s, idx) => (
                <button
                  key={s.shot_id}
                  onClick={() => {
                    setActiveShotIndex(idx);
                    currentTimeRef.current = 0;
                    setDisplayTime(0);
                    drawFrame(0);
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition ${
                    activeShotIndex === idx
                      ? 'bg-zinc-800 text-amber-300 border border-amber-500/50 font-bold'
                      : 'bg-zinc-950 text-zinc-500 hover:text-zinc-300 border border-zinc-800/80'
                  }`}
                >
                  0{s.order}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
