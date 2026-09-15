import { Project, QualityGateResult } from '../types.ts';

const SAFE_MIN = 8;
const SAFE_MAX = 92;

export function runQualityGate(project: Project, ffmpegAvailable: boolean): QualityGateResult {
  const messages: string[] = [];
  const scriptValid = project.script.trim().length >= 30;

  if (!scriptValid) messages.push('Script is too short.');

  const shots = [...project.shots].sort((a, b) => a.start - b.start);
  const allShotsHaveAssets = shots.length > 0 && shots.every((shot) => shot.assets.length > 0);
  if (!allShotsHaveAssets) messages.push('Every shot must contain at least one visual asset.');

  const textWithinSafeArea = shots.every((shot) =>
    shot.text.every((text) => text.position.x >= SAFE_MIN && text.position.x <= SAFE_MAX && text.position.y >= SAFE_MIN && text.position.y <= SAFE_MAX)
  );
  if (!textWithinSafeArea) messages.push('One or more text elements are outside the 8–92% safe area.');

  let timelineContinuous = shots.length > 0;
  let cursor = 0;
  for (const shot of shots) {
    const start = Number(shot.start.toFixed(3));
    const end = Number(shot.end.toFixed(3));
    const duration = Number(shot.duration.toFixed(3));
    if (start < 0 || end <= start || Math.abs((end - start) - duration) > 0.12) timelineContinuous = false;
    if (Math.abs(start - cursor) > 0.12) timelineContinuous = false;
    cursor = end;
  }
  if (Math.abs(cursor - project.duration) > 0.2) timelineContinuous = false;
  if (!timelineContinuous) messages.push('Shot timeline has gaps, overlaps, or does not match project duration.');

  const voiceValid = !project.voiceover || Boolean(project.voiceUrl);
  if (!voiceValid) messages.push('Voiceover is enabled but no voice file is attached yet.');

  const readyToRender = scriptValid && allShotsHaveAssets && textWithinSafeArea && timelineContinuous && ffmpegAvailable;
  if (!ffmpegAvailable) messages.push('FFmpeg is not available.');

  return {
    scriptValid,
    voiceValid,
    allShotsHaveAssets,
    textWithinSafeArea,
    timelineContinuous,
    ffmpegAvailable,
    readyToRender,
    messages,
  };
}
