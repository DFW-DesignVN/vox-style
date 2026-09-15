import { Project, QualityGateResult } from '../types.ts';

const SAFE_MIN = 6;
const SAFE_MAX = 94;

export function runQualityGate(project: Project, ffmpegAvailable: boolean): QualityGateResult {
  const messages: string[] = [];
  const scriptValid = typeof project.script === 'string' && project.script.trim().length >= 15;
  if (!scriptValid) messages.push('Kịch bản quá ngắn (cần tối thiểu 15 ký tự).');

  const shots = [...project.shots].sort((a, b) => a.start - b.start);
  const allShotsHaveAssets = shots.length > 0 && shots.every((s) => Array.isArray(s.assets) && s.assets.length > 0);
  if (!allShotsHaveAssets) messages.push('Mỗi phân cảnh cần có ít nhất một hình ảnh tư liệu.');

  const unresolvedAssets = shots.flatMap((s) =>
    (s.assets || [])
      .filter((a) => a.type === 'image' && (a.status === 'failed' || (!a.source && a.status !== 'ready')))
      .map((a) => `${s.shot_id}/${a.id}`)
  );
  const assetsResolved = unresolvedAssets.length === 0 && allShotsHaveAssets;
  if (unresolvedAssets.length) {
    messages.push(
      `Một số hình ảnh tư liệu chưa sẵn sàng: ${unresolvedAssets.slice(0, 4).join(', ')}${unresolvedAssets.length > 4 ? '…' : ''}`
    );
  }

  const textWithinSafeArea = shots.every((s) =>
    (s.text || []).every(
      (t) =>
        t.position.x >= SAFE_MIN &&
        t.position.x <= SAFE_MAX &&
        t.position.y >= SAFE_MIN &&
        t.position.y <= SAFE_MAX
    )
  );
  if (!textWithinSafeArea) messages.push('Một số tiêu đề đang nằm sát mép màn hình ngoài vùng an toàn (safe area).');

  let timelineContinuous = shots.length > 0;
  let cursor = 0;
  for (const shot of shots) {
    const start = Number(shot.start.toFixed(3));
    const end = Number(shot.end.toFixed(3));
    const duration = Number(shot.duration.toFixed(3));
    if (start < 0 || end <= start || Math.abs(end - start - duration) > 0.3) timelineContinuous = false;
    if (Math.abs(start - cursor) > 0.3) timelineContinuous = false;
    cursor = end;
  }
  if (Math.abs(cursor - project.duration) > 0.4) timelineContinuous = false;
  if (!timelineContinuous) messages.push('Timeline phân cảnh không liên tục hoặc không khớp tổng thời lượng.');

  const voiceValid = Boolean(project.voiceUrl && project.voiceDuration && project.voiceDuration > 0);
  if (project.voiceover && !voiceValid) messages.push('Chưa có giọng đọc thuyết minh cho video Final.');
  if (!ffmpegAvailable) messages.push('Máy chủ chưa cài đặt FFmpeg.');

  // The application has two intentional modes:
  // - draft/silent render may be used only when voiceover is disabled.
  // - final render requires a complete visual + audio timeline.
  const readyToRender = scriptValid && assetsResolved && textWithinSafeArea && timelineContinuous && ffmpegAvailable && (!project.voiceover || voiceValid);

  return {
    scriptValid,
    voiceValid,
    allShotsHaveAssets: assetsResolved,
    textWithinSafeArea,
    timelineContinuous,
    ffmpegAvailable,
    readyToRender,
    messages,
  };
}
