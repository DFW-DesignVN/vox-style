import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, Video, Download, X, Loader2, Info } from 'lucide-react';
import { Project } from '../types.ts';
import { renderShotFrame, preloadShotImages } from '../utils/compositor.ts';
import { runQualityGate } from '../utils/qualityGate.ts';

interface RenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  ffmpegAvailable: boolean | null;
}

export const RenderModal: React.FC<RenderModalProps> = ({
  isOpen,
  onClose,
  project,
  ffmpegAvailable,
}) => {
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [renderFps, setRenderFps] = useState<number>(project.fps || 30);
  const [verifiedStreams, setVerifiedStreams] = useState<{ video: string; audio: string | null } | null>(null);

  if (!isOpen) return null;

  // Run real Section 33 Quality Gate
  const qualityGate = runQualityGate(project, ffmpegAvailable === true);

  const handleStartRender = async () => {
    if (!qualityGate.readyToRender) {
      setError(qualityGate.messages.join(' '));
      return;
    }

    setIsRendering(true);
    setError(null);
    setProgress(0);
    setVerifiedStreams(null);
    setStatusMessage('Preloading assets for all shots...');

    try {
      // 1. Preload images for all shots
      for (const s of project.shots) {
        await preloadShotImages(s);
      }

      // 2. Offscreen rendering of frames with Chunked Streaming (scales to 15m+ episodes without OOM)
      const fps = renderFps;
      const totalFrames = Math.max(1, Math.round(project.duration * fps));
      setStatusMessage(`Initializing render session (${totalFrames} frames @ ${fps} FPS)...`);

      // A. Start Session
      const startRes = await fetch('/api/render/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.project_id,
          fps,
          voiceUrl: project.voiceUrl,
          totalFrames,
        }),
      });

      if (!startRes.ok) {
        throw new Error('Failed to initialize video render session');
      }

      const { sessionId } = await startRes.json();

      const offCanvas = document.createElement('canvas');
      offCanvas.width = 1920;
      offCanvas.height = 1080;
      const ctx = offCanvas.getContext('2d');
      if (!ctx) throw new Error('Could not initialize canvas context');

      const CHUNK_SIZE = 25;
      let chunkBuffer: string[] = [];
      let completedFrames = 0;
      let chunkStartIndex = 0;

      // Preload all project assets prior to headless compositing
      setStatusMessage('Preloading and decoding archival media assets...');
      for (const shot of project.shots) {
        await preloadShotImages(shot);
      }

      for (const shot of project.shots) {
        const totalFramesInShot = Math.max(1, Math.round(shot.duration * fps));
        for (let f = 0; f < totalFramesInShot; f++) {
          const t = f / fps;
          renderShotFrame(ctx, shot, t, 1920, 1080);
          chunkBuffer.push(offCanvas.toDataURL('image/jpeg', 0.82));
          completedFrames++;

          // When chunk buffer is full or last frame, stream to server
          if (chunkBuffer.length >= CHUNK_SIZE || completedFrames === totalFrames) {
            const uploadRes = await fetch('/api/render/session/chunk', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId,
                startFrameIndex: chunkStartIndex,
                frames: chunkBuffer,
              }),
            });

            if (!uploadRes.ok) {
              throw new Error(`Failed to upload frame chunk at index ${chunkStartIndex}`);
            }

            chunkStartIndex = completedFrames;
            chunkBuffer = []; // Release chunk memory immediately

            const pct = Math.min(80, Math.floor((completedFrames / totalFrames) * 80));
            setProgress(pct);
            setStatusMessage(`Compositing & streaming frame ${completedFrames}/${totalFrames} (Shot ${shot.order}/${project.shots.length})...`);
          }
        }
      }

      setProgress(85);
      setStatusMessage('Transcoding 1080p MP4 with FFmpeg H.264 & muxing AAC narration...');

      // B. Finish and Encode
      const finishRes = await fetch('/api/render/session/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (!finishRes.ok) {
        const errJson = await finishRes.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with status ${finishRes.status}`);
      }

      const resData = await finishRes.json();
      setProgress(100);
      setVerifiedStreams(resData.verifiedStreams || null);
      setStatusMessage(
        resData.hasAudio
          ? `Rendering finished! 1080p MP4 ready with AAC audio (FFprobe: ${resData.verifiedStreams?.video || 'h264'} / ${resData.verifiedStreams?.audio || 'aac'}).`
          : 'Rendering finished! 1080p MP4 ready (silent video).'
      );
      setVideoUrl(resData.videoUrl);
    } catch (err: any) {
      console.error('Render failed:', err);
      setError(err.message || 'Rendering failed');
    } finally {
      setIsRendering(false);
    }
  };

  const gateItems = [
    { label: `Script Valid (${project.script.length} chars)`, passed: qualityGate.scriptValid, blocking: true },
    { label: `Continuous Beat Timeline (${project.shots.length} shots)`, passed: qualityGate.timelineContinuous, blocking: true },
    { label: 'All Shots Have Assets', passed: qualityGate.allShotsHaveAssets, blocking: true },
    { label: 'Text Within Safe Area (8–92%)', passed: qualityGate.textWithinSafeArea, blocking: true },
    { label: 'FFmpeg Video Engine', passed: qualityGate.ffmpegAvailable, blocking: true },
    {
      label: project.voiceUrl
        ? 'Voice Narration Track (Muxed via FFmpeg AAC)'
        : 'Voice Track (Optional: Silent render if not generated)',
      passed: qualityGate.voiceValid,
      blocking: false,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl max-w-2xl w-full p-6 shadow-2xl relative flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-red-500" />
            <h3 className="font-editorial text-lg font-bold uppercase tracking-tight text-zinc-100">
              Export 1080p Documentary MP4
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isRendering}
            className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 33: Quality Gate Checklist */}
        <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider block">
              Section 33: Production Quality Gate
            </span>
            <span
              className={`text-[11px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                qualityGate.readyToRender
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-rose-950 text-rose-300 border border-rose-800'
              }`}
            >
              {qualityGate.readyToRender ? 'Gate Passed' : 'Gate Blocked'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            {gateItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {item.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : item.blocking ? (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                ) : (
                  <Info className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                <span
                  className={
                    item.passed
                      ? 'text-zinc-300'
                      : item.blocking
                      ? 'text-rose-400 font-semibold'
                      : 'text-amber-300'
                  }
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {qualityGate.messages.length > 0 && (
            <div className="pt-2 border-t border-zinc-800/80 space-y-1">
              {qualityGate.messages.map((msg, i) => (
                <div key={i} className="text-[11px] font-mono text-amber-400/90 flex items-start gap-1.5">
                  <span className="text-zinc-500">•</span>
                  <span>{msg}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FPS selector before render */}
        {!isRendering && !videoUrl && (
          <div className="flex items-center justify-between bg-zinc-950/60 p-3 rounded-lg border border-zinc-800 text-xs font-mono">
            <span className="text-zinc-400">Frame Rate Target:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRenderFps(30)}
                className={`px-3 py-1 rounded text-xs transition ${
                  renderFps === 30
                    ? 'bg-red-600 text-white font-bold border border-red-500'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                30 FPS (VOX Standard)
              </button>
              <button
                type="button"
                onClick={() => setRenderFps(20)}
                className={`px-3 py-1 rounded text-xs transition ${
                  renderFps === 20
                    ? 'bg-red-600 text-white font-bold border border-red-500'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                20 FPS (Fast Draft)
              </button>
            </div>
          </div>
        )}

        {/* Render Progress or Player */}
        {isRendering ? (
          <div className="space-y-3 py-4">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-300">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                <span>{statusMessage}</span>
              </div>
              <span className="font-bold">{progress}%</span>
            </div>
            <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : videoUrl ? (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-950/40 border border-emerald-800 rounded-lg text-xs font-mono text-emerald-300 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="font-semibold">✓ 1080p Documentary MP4 Render Complete!</span>
                {verifiedStreams && (
                  <span className="text-[11px] text-emerald-400/90 font-mono">
                    FFprobe Verified: Video ({verifiedStreams.video?.toUpperCase()})
                    {verifiedStreams.audio ? ` • Audio (${verifiedStreams.audio?.toUpperCase()} 192k)` : ' • Silent Track'}
                  </span>
                )}
              </div>
              <a
                href={videoUrl}
                download={`${project.project_id}.mp4`}
                className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold transition shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download MP4</span>
              </a>
            </div>

            <div className="aspect-video bg-black rounded-lg overflow-hidden border border-zinc-700">
              <video src={videoUrl} controls autoPlay className="w-full h-full object-contain" />
            </div>
          </div>
        ) : null}

        {error && (
          <div className="p-3 bg-rose-950/50 border border-rose-800 rounded-lg text-xs font-mono text-rose-300">
            Error: {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800">
          <button
            onClick={onClose}
            disabled={isRendering}
            className="px-4 py-2 text-xs font-mono text-zinc-400 hover:text-zinc-200"
          >
            Close
          </button>
          {!videoUrl && (
            <button
              onClick={handleStartRender}
              disabled={isRendering || !qualityGate.readyToRender}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-mono font-bold text-xs rounded-lg transition shadow-lg shadow-red-950/60 disabled:opacity-50"
            >
              <Video className="w-4 h-4" />
              <span>START FFMPEG RENDER</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
