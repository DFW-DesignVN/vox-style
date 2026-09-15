import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

const OUTPUTS_DIR = path.join(process.cwd(), 'outputs', 'audio');
fs.mkdirSync(OUTPUTS_DIR, { recursive: true });

function cleanText(text: string) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

async function probeDuration(filePath: string) {
  const { stdout } = await execAsync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`);
  const duration = Number.parseFloat(stdout.trim());
  if (!Number.isFinite(duration) || duration <= 0) throw new Error('Unable to determine audio duration');
  return duration;
}

export async function generateVoice(text: string, opts: { voiceId?: string; modelId?: string; stability?: number; similarityBoost?: number } = {}) {
  const clean = cleanText(text);
  if (!clean) throw new Error('Voice text is empty');
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY is not configured');
  const voiceId = opts.voiceId || process.env.ELEVENLABS_VOICE_ID;
  if (!voiceId) throw new Error('ELEVENLABS_VOICE_ID is not configured');
  const modelId = opts.modelId || process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({
      text: clean,
      model_id: modelId,
      voice_settings: { stability: opts.stability ?? 0.55, similarity_boost: opts.similarityBoost ?? 0.80, style: 0.05, use_speaker_boost: true },
    }),
  });
  if (!response.ok) throw new Error(`ElevenLabs TTS failed (${response.status}): ${await response.text()}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const id = `voice_${Date.now()}`;
  const filePath = path.join(OUTPUTS_DIR, `${id}.mp3`);
  fs.writeFileSync(filePath, bytes);
  const duration = await probeDuration(filePath);
  return { success: true, url: `/outputs/audio/${id}.mp3`, filePath, duration, provider: 'elevenlabs', voiceId, modelId };
}

export function buildBeatTimeline(shots: any[], totalDuration: number, minWords = 5, maxWords = 8) {
  const safeShots = Array.isArray(shots) ? shots : [];
  const allWords = safeShots.flatMap((shot: any) => cleanText(shot.narration).split(/\s+/).filter(Boolean));
  if (!allWords.length) return [];
  const beats: any[] = [];
  let globalWord = 0;
  let cursor = 0;
  const secondsPerWord = totalDuration / allWords.length;
  for (const shot of safeShots) {
    const words = cleanText(shot.narration).split(/\s+/).filter(Boolean);
    if (!words.length) continue;
    const shotStart = Number(shot.start) || cursor;
    const shotEnd = Number(shot.end) || shotStart + words.length * secondsPerWord;
    const target = Math.max(1, Math.round(words.length / 6));
    const groupSize = Math.max(minWords, Math.min(maxWords, Math.ceil(words.length / target)));
    for (let i = 0; i < words.length; i += groupSize) {
      const group = words.slice(i, Math.min(i + groupSize, words.length));
      const localStart = i / words.length;
      const localEnd = (i + group.length) / words.length;
      const start = shotStart + (shotEnd - shotStart) * localStart;
      const end = shotStart + (shotEnd - shotStart) * localEnd;
      beats.push({ id: `beat_${String(beats.length + 1).padStart(3, '0')}`, shotId: shot.shot_id, start: Number(start.toFixed(3)), end: Number(end.toFixed(3)), duration: Number((end - start).toFixed(3)), text: group.join(' '), words: group, wordStart: globalWord + i, wordEnd: globalWord + i + group.length, visualCue: shot.visual_idea || shot.narration });
    }
    globalWord += words.length;
    cursor = shotEnd;
  }
  return beats;
}

export async function normalizeProjectToVoiceTimeline(project: any, voiceDuration: number) {
  const shots = JSON.parse(JSON.stringify(project.shots || []));
  const wordsPerShot = shots.map((s: any) => cleanText(s.narration).split(/\s+/).filter(Boolean).length);
  const totalWords = wordsPerShot.reduce((a: number, b: number) => a + b, 0) || 1;
  let cursor = 0;
  for (let i = 0; i < shots.length; i++) {
    const duration = voiceDuration * (wordsPerShot[i] / totalWords);
    shots[i].start = Number(cursor.toFixed(3));
    shots[i].duration = Number(duration.toFixed(3));
    shots[i].end = Number((cursor + duration).toFixed(3));
    cursor += duration;
  }
  if (shots.length) shots[shots.length - 1].end = Number(voiceDuration.toFixed(3));
  return { shots, beats: buildBeatTimeline(shots, voiceDuration) };
}
