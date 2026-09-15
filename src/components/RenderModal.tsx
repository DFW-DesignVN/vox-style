import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, Video, Download, X, Loader2 } from 'lucide-react';
import { Project } from '../types.ts';
import { renderShotFrame, preloadShotImages } from '../utils/compositor.ts';
import { runQualityGate } from '../utils/qualityGate.ts';

interface RenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  ffmpegAvailable: boolean | null;
}

export const RenderModal: React.FC<RenderModalProps> = ({ isOpen, onClose, project, ffmpegAvailable }) => {
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const qualityGate = runQualityGate(project, ffmpegAvailable === true);

  const handleStartRender = async () => {
    if (!qualityGate.readyToRender) {
      setError(qualityGate.messages.join(' '));
      return;
    }

    setIsRendering(true);
    setError(null);
    setProgress(0);
    setStatusMessage('Preloading assets for all shots...');

    try {
      for (const shot of project.shots) await preloadShotImages(shot);

      const offCanvas = document.createElement('canvas');
      offCanvas.width = 1920;
      offCanvas.height = 1080;
      const ctx = offCanvas.getContext('2d');
      if (!ctx) throw new Error('Could not initialize canvas context');

      const fps = 20;
      const frameList: string[] = [];
      const totalFrames = Math.max(1, Math.round(project.duration * fps));
      let completedFrames = 0;

      for (const shot of project.shots) {
        const totalFramesInShot = Math.max(1, Math.round(shot.duration * fps));
        for (let f = 0; f < totalFramesInShot; f++) {
          renderShotFrame(ctx, shot, f / fps, 1920, 1080);
          frameList.push(offCanvas.toDataURL('image/jpeg', 0.82));
          completedFrames++;
          setProgress(Math.min(65, Math.floor((completedFrames / totalFrames) * 65)));
          setStatusMessage(`Compositing shot ${shot.order}/${project.shots.length}...`);
        }
      }

      setProgress(68);
      setStatusMessage(`Sending ${frameList.length} frames to FFmpeg...`);

      const response = await fetch('/api/render-final-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.project_id, shotFrames: frameList, fps }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || `Server responded with status ${response.status}`);
      }

      const result = await response.json();
      setProgress(100);
      setStatusMessage('Rendering finished! 1080p MP4 ready.');
      setVideoUrl(result.videoUrl);
    } catch (err: any) {
      console.error('Render failed:', err);
      setError(err.message || 'Rendering failed');
    } finally {
      setIsRendering(false);
    }
  };

  const gateItems = [
    ['Script Valid', qualityGate.scriptValid],
    ['Continuous Beat Timeline', qualityGate.timelineContinuous],
    ['All Shots Have Assets', qualityGate.allShotsHaveAssets],
    ['Text Safe Area', qualityGate.textWithinSafeArea],
    ['Voice File', qualityGate.voiceValid],
    ['FFmpeg Engine', qualityGate.ffmpegAvailable],
  ] as const;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl max-w-2xl w-full p-6 shadow-2xl relative flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-red-500" />
            <h3 className="font-editorial text-lg font-bold uppercase tracking-tight text-zinc-100">Export 1080p Documentary MP4</h3>
          </div>
          <button onClick={onClose} disabled={isRendering} className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">Production Quality Gate</span>
            <span className={`text-[10px] font-mono px-2 py-1 rounded ${qualityGate.readyToRender ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'}`}>
              {qualityGate.readyToRender ? 'READY' : 'BLOCKED'}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            {gateItems.map(([label, ok]) => (
              <div key={label} className="flex items-center gap-2">
                {ok ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
                <span className={ok ? 'text-zinc-300' : 'text-rose-400'}>{label}</span>
              </div>
            ))}
          </div>
          {qualityGate.messages.length > 0 && (
            <div className="mt-2 text-[11px] font-mono text-rose-300 border-t border-zinc-800 pt-2 space-y-1">
              {qualityGate.messages.map((message) => <div key={message}>• {message}</div>)}
            </div>
          )}
        </div>

        {isRendering && (
          <div className="space-y-3 py-4">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-300">
              <div className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin text-red-500" /><span>{statusMessage}</span></div>
              <span className="font-bold">{progress}%</span>
            </div>
            <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-red-600 transition-all duration-300" style={{ width: `${progress}%` }} /></div>
          </div>
        )}

        {!isRendering && videoUrl && (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-950/40 border border-emerald-800 rounded-lg text-xs font-mono text-emerald-300 flex items-center justify-between">
              <span className="font-semibold">✓ 1080p Documentary MP4 Render Complete!</span>
              <a href={videoUrl} download={`${project.project_id}.mp4`} className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold transition">
                <Download className="w-3.5 h-3.5" /><span>Download MP4</span>
              </a>
            </div>
            <div className="aspect-video bg-black rounded-lg overflow-hidden border border-zinc-700"><video src={videoUrl} controls autoPlay className="w-full h-full object-contain" /></div>
          </div>
        )}

        {error && <div className="p-3 bg-rose-950/50 border border-rose-800 rounded-lg text-xs font-mono text-rose-300">Error: {error}</div>}

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800">
          <button onClick={onClose} disabled={isRendering} className="px-4 py-2 text-xs font-mono text-zinc-400 hover:text-zinc-200">Close</button>
          {!videoUrl && <button onClick={handleStartRender} disabled={isRendering || !qualityGate.readyToRender} className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-mono font-bold text-xs rounded-lg transition shadow-lg shadow-red-950/60 disabled:opacity-50">
            <Video className="w-4 h-4" /><span>START FFMPEG RENDER</span>
          </button>}
        </div>
      </div>
    </div>
  );
};
