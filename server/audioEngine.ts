import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

const OUTPUTS_DIR = path.join(process.cwd(), 'outputs', 'audio');
fs.mkdirSync(OUTPUTS_DIR, { recursive: true });

function cleanText(text: string) { return String(text || '').replace(/\s+/g, ' ').trim(); }

async function probeDuration(filePath: string) {
  const { stdout } = await execAsync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`);
  const duration = Number.parseFloat(stdout.trim());
  if (!Number.isFinite(duration) || duration <= 0) throw new Error('Unable to determine audio duration');
  return duration;
}

export type TTSProviderName = 'auto' | 'vieneu' | 'capcut' | 'elevenlabs';
export type TTSOptions = { provider?: TTSProviderName; voiceId?: string; modelId?: string; stability?: number; similarityBoost?: number; rate?: number };
export type TTSResult = { success: true; url: string; filePath: string; duration: number; provider: string; voiceId?: string; modelId?: string };

async function saveRemoteAudio(url: string, provider: string, ext = 'mp3') {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${provider} audio download failed (${response.status})`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const id = `voice_${provider}_${Date.now()}`;
  const filePath = path.join(OUTPUTS_DIR, `${id}.${ext}`);
  fs.writeFileSync(filePath, bytes);
  const duration = await probeDuration(filePath);
  return { success: true as const, url: `/outputs/audio/${id}.${ext}`, filePath, duration };
}

async function isVieNeuAvailable() {
  const base = (process.env.VIENU_TTS_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
  try { const r = await fetch(`${base}/v1/models`, { signal: AbortSignal.timeout(1200) }); return r.ok; } catch { return false; }
}

async function generateVieNeu(text: string, opts: TTSOptions): Promise<TTSResult> {
  const base = (process.env.VIENU_TTS_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
  const voice = opts.voiceId || process.env.VIENU_TTS_VOICE || 'Mai Anh';
  const modelId = opts.modelId || process.env.VIENU_TTS_MODEL || 'vieneu-v3-turbo';
  const apiKey = process.env.VIENU_TTS_API_KEY;
  const headers: Record<string,string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  const response = await fetch(`${base}/v1/audio/speech`, { method:'POST', headers, body: JSON.stringify({ model:modelId, input:cleanText(text), voice, response_format:'wav', sample_rate:48000 }) });
  if (!response.ok) throw new Error(`VieNeu TTS failed (${response.status}): ${await response.text()}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const id = `voice_vieneu_${Date.now()}`;
  const filePath = path.join(OUTPUTS_DIR, `${id}.wav`);
  fs.writeFileSync(filePath, bytes);
  const duration = await probeDuration(filePath);
  return { success:true, url:`/outputs/audio/${id}.wav`, filePath, duration, provider:'vieneu', voiceId:voice, modelId };
}

async function generateCapCut(text: string, opts: TTSOptions): Promise<TTSResult> {
  const python = process.env.CAPCUT_PYTHON || 'python';
  const script = path.join(process.cwd(), 'server', 'tts', 'capcut_bridge.py');
  const voice = opts.voiceId || process.env.CAPCUT_TTS_VOICE || 'BV074_streaming';
  const rate = String(opts.rate ?? Number(process.env.CAPCUT_TTS_RATE || '1.0'));
  const args = [python, script, '--text', JSON.stringify(cleanText(text)), '--voice', JSON.stringify(voice), '--rate', rate];
  const command = args.map(a => `"${a.replace(/"/g, '\\"')}"`).join(' ');
  const { stdout, stderr } = await execAsync(command, { timeout: Number(process.env.CAPCUT_TTS_TIMEOUT_MS || 120000), maxBuffer: 1024 * 1024 });
  if (stderr.trim()) console.warn('[CapCut TTS]', stderr.trim());
  const line = stdout.trim().split(/\r?\n/).filter(Boolean).pop();
  if (!line) throw new Error('CapCut bridge returned no result');
  const result = JSON.parse(line);
  if (!result.speech_url) throw new Error(result.error || 'CapCut response did not contain speech_url');
  const saved = await saveRemoteAudio(result.speech_url, 'capcut', 'mp3');
  return { ...saved, provider:'capcut', voiceId:result.voice || voice };
}

async function generateElevenLabs(text: string, opts: TTSOptions): Promise<TTSResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY is not configured');
  const voiceId = opts.voiceId || process.env.ELEVENLABS_VOICE_ID;
  if (!voiceId) throw new Error('ELEVENLABS_VOICE_ID is not configured');
  const modelId = opts.modelId || process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`, { method:'POST', headers:{'xi-api-key':apiKey,'Content-Type':'application/json',Accept:'audio/mpeg'}, body:JSON.stringify({ text:cleanText(text), model_id:modelId, voice_settings:{ stability:opts.stability ?? 0.55, similarity_boost:opts.similarityBoost ?? 0.80, style:0.05, use_speaker_boost:true } }) });
  if (!response.ok) throw new Error(`ElevenLabs TTS failed (${response.status}): ${await response.text()}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const id = `voice_elevenlabs_${Date.now()}`;
  const filePath = path.join(OUTPUTS_DIR, `${id}.mp3`);
  fs.writeFileSync(filePath, bytes);
  const duration = await probeDuration(filePath);
  return { success:true, url:`/outputs/audio/${id}.mp3`, filePath, duration, provider:'elevenlabs', voiceId, modelId };
}

export async function getTTSProviders() {
  const vieneu = await isVieNeuAvailable();
  return { vieneu, capcut: Boolean(process.env.CAPCUT_PYTHON || process.env.CAPCUT_TTS_ENABLED === '1'), elevenlabs: Boolean(process.env.ELEVENLABS_API_KEY) };
}

export async function generateVoice(text: string, opts: TTSOptions = {}) {
  const clean = cleanText(text);
  if (!clean) throw new Error('Voice text is empty');
  const requested = opts.provider || (process.env.TTS_PROVIDER as TTSProviderName) || 'auto';
  if (requested === 'vieneu') return generateVieNeu(clean, opts);
  if (requested === 'capcut') return generateCapCut(clean, opts);
  if (requested === 'elevenlabs') return generateElevenLabs(clean, opts);
  const failures: string[] = [];
  if (await isVieNeuAvailable()) { try { return await generateVieNeu(clean, opts); } catch (e:any) { failures.push(`vieneu: ${e.message}`); } }
  if (process.env.CAPCUT_PYTHON || process.env.CAPCUT_TTS_ENABLED === '1') { try { return await generateCapCut(clean, opts); } catch (e:any) { failures.push(`capcut: ${e.message}`); } }
  if (process.env.ELEVENLABS_API_KEY) { try { return await generateElevenLabs(clean, opts); } catch (e:any) { failures.push(`elevenlabs: ${e.message}`); } }
  throw new Error(`No TTS provider succeeded. ${failures.join(' | ')}`);
}

export function buildBeatTimeline(shots: any[], totalDuration: number, minWords = 5, maxWords = 8) {
  const safeShots = Array.isArray(shots) ? shots : [];
  const allWords = safeShots.flatMap((shot: any) => cleanText(shot.narration).split(/\s+/).filter(Boolean));
  if (!allWords.length) return [];
  const beats: any[] = []; let globalWord = 0; let cursor = 0; const secondsPerWord = totalDuration / allWords.length;
  for (const shot of safeShots) {
    const words = cleanText(shot.narration).split(/\s+/).filter(Boolean); if (!words.length) continue;
    const shotStart = Number(shot.start) || cursor; const shotEnd = Number(shot.end) || shotStart + words.length * secondsPerWord;
    const target = Math.max(1, Math.round(words.length / 6)); const groupSize = Math.max(minWords, Math.min(maxWords, Math.ceil(words.length / target)));
    for (let i=0;i<words.length;i+=groupSize) { const group=words.slice(i,Math.min(i+groupSize,words.length)); const start=shotStart+(shotEnd-shotStart)*(i/words.length); const end=shotStart+(shotEnd-shotStart)*((i+group.length)/words.length); beats.push({id:`beat_${String(beats.length+1).padStart(3,'0')}`,shotId:shot.shot_id,start:Number(start.toFixed(3)),end:Number(end.toFixed(3)),duration:Number((end-start).toFixed(3)),text:group.join(' '),words:group,wordStart:globalWord+i,wordEnd:globalWord+i+group.length,visualCue:shot.visual_idea||shot.narration}); }
    globalWord += words.length; cursor = shotEnd;
  }
  return beats;
}

export async function normalizeProjectToVoiceTimeline(project: any, voiceDuration: number) {
  const shots = JSON.parse(JSON.stringify(project.shots || [])); const wordsPerShot=shots.map((s:any)=>cleanText(s.narration).split(/\s+/).filter(Boolean).length); const totalWords=wordsPerShot.reduce((a:number,b:number)=>a+b,0)||1; let cursor=0;
  for(let i=0;i<shots.length;i++){const duration=voiceDuration*(wordsPerShot[i]/totalWords); shots[i].start=Number(cursor.toFixed(3)); shots[i].duration=Number(duration.toFixed(3)); shots[i].end=Number((cursor+duration).toFixed(3)); cursor+=duration;}
  if(shots.length) shots[shots.length-1].end=Number(voiceDuration.toFixed(3));
  return {shots,beats:buildBeatTimeline(shots,voiceDuration)};
}
