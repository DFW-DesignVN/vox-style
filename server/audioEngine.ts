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

export type TTSProviderName = 'auto' | 'google' | 'vieneu' | 'capcut' | 'elevenlabs';
export type TTSOptions = {
  provider?: TTSProviderName;
  voiceId?: string;
  modelId?: string;
  lang?: string;
  stability?: number;
  similarityBoost?: number;
  rate?: number;
};
export type TTSResult = { success: true; url: string; filePath: string; duration: number; provider: string; voiceId?: string; modelId?: string };

async function downloadGoogleTTSChunk(chunkText: string, lang: string, tempOutPath: string): Promise<void> {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunkText)}&tl=${lang}&client=tw-ob`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'audio/mpeg, audio/*; q=0.9, */*; q=0.5',
    },
  });
  if (!response.ok) throw new Error(`Google TTS request failed (${response.status})`);
  const buf = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(tempOutPath, buf);
}

export async function generateGoogleTTS(text: string, opts: TTSOptions): Promise<TTSResult> {
  const clean = cleanText(text);
  if (!clean) throw new Error('TTS input text cannot be empty');

  // Detect language: check if text has Vietnamese characters or opts specify 'vi'
  const isVietnamese =
    opts.lang === 'vi' ||
    (opts.voiceId && opts.voiceId.startsWith('vi')) ||
    /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(clean);
  const lang = isVietnamese ? 'vi' : 'en';

  // Chunk text into phrases / clauses under 140 chars
  const rawSentences = clean.split(/(?<=[.!?,\n;:])\s+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const s of rawSentences) {
    if ((currentChunk + ' ' + s).trim().length > 130 && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = s;
    } else {
      currentChunk = currentChunk ? `${currentChunk} ${s}` : s;
    }
  }
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  const id = `voice_google_${Date.now()}`;
  const tempDir = path.join(process.cwd(), 'temp_renders', id);
  fs.mkdirSync(tempDir, { recursive: true });

  const chunkFiles: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunkFile = path.join(tempDir, `chunk_${String(i).padStart(3, '0')}.mp3`);
    await downloadGoogleTTSChunk(chunks[i], lang, chunkFile);
    chunkFiles.push(chunkFile);
  }

  const listFilePath = path.join(tempDir, 'chunks.txt');
  fs.writeFileSync(listFilePath, chunkFiles.map((f) => `file '${f}'`).join('\n'));

  const rawConcatPath = path.join(tempDir, 'raw_concat.mp3');
  await execAsync(`ffmpeg -y -f concat -safe 0 -i "${listFilePath}" -c copy "${rawConcatPath}"`);

  const finalMp3Path = path.join(OUTPUTS_DIR, `${id}.mp3`);

  // Sound enhancement filter:
  // For male/documentary voice: subtle pitch shift + warm documentary lower-mid warmth
  // For standard female voice: broadcast clarity EQ
  const isMale = opts.voiceId === 'vi_male' || opts.voiceId === 'en_male';
  const filterArg = isMale
    ? `-af "asetrate=44100*0.93,atempo=1/0.93,equalizer=f=140:width_type=o:width=1.2:g=3.5,equalizer=f=2800:width_type=o:width=1.0:g=-1.0"`
    : `-af "equalizer=f=180:width_type=o:width=1.0:g=2.0,equalizer=f=3200:width_type=o:width=1.0:g=1.0"`;

  await execAsync(`ffmpeg -y -i "${rawConcatPath}" ${filterArg} -b:a 192k "${finalMp3Path}"`);

  // Clean up temp dir
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch {}

  const duration = await probeDuration(finalMp3Path);
  return {
    success: true,
    url: `/outputs/audio/${id}.mp3`,
    filePath: finalMp3Path,
    duration,
    provider: 'google',
    voiceId: opts.voiceId || (isVietnamese ? 'vi_female' : 'en_male'),
    modelId: lang,
  };
}

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

async function isCapCutAvailable(): Promise<boolean> {
  const python = process.env.CAPCUT_PYTHON || 'python3';
  const script = path.join(process.cwd(), 'server', 'tts', 'capcut_bridge.py');
  if (!fs.existsSync(script)) return false;
  try {
    const { stdout } = await execAsync(`"${python}" -c "import capcut_tts_api"`, { timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

export async function getTTSProviders() {
  const vieneu = await isVieNeuAvailable();
  const capcut = await isCapCutAvailable();
  return {
    google: true,
    vieneu,
    capcut,
    elevenlabs: Boolean(process.env.ELEVENLABS_API_KEY),
  };
}

export async function generateVoice(text: string, opts: TTSOptions = {}) {
  const clean = cleanText(text);
  if (!clean) throw new Error('Voice text is empty');
  const requested = opts.provider || (process.env.TTS_PROVIDER as TTSProviderName) || 'google';

  if (requested === 'google') return generateGoogleTTS(clean, opts);

  if (requested === 'vieneu') {
    if (await isVieNeuAvailable()) return generateVieNeu(clean, opts);
    console.warn('[TTS] VieNeu not available, falling back to Google Speech');
    return generateGoogleTTS(clean, opts);
  }

  if (requested === 'capcut') {
    if (await isCapCutAvailable()) {
      try {
        return await generateCapCut(clean, opts);
      } catch (err: any) {
        console.warn('[TTS] CapCut failed, falling back to Google Speech:', err.message);
      }
    }
    return generateGoogleTTS(clean, opts);
  }

  if (requested === 'elevenlabs') {
    if (process.env.ELEVENLABS_API_KEY) {
      try {
        return await generateElevenLabs(clean, opts);
      } catch (err: any) {
        console.warn('[TTS] ElevenLabs failed, falling back to Google Speech:', err.message);
      }
    }
    return generateGoogleTTS(clean, opts);
  }

  // Auto mode: try configured providers, and always guarantee success with Google TTS
  if (await isVieNeuAvailable()) {
    try {
      return await generateVieNeu(clean, opts);
    } catch {}
  }
  if (await isCapCutAvailable()) {
    try {
      return await generateCapCut(clean, opts);
    } catch {}
  }
  if (process.env.ELEVENLABS_API_KEY) {
    try {
      return await generateElevenLabs(clean, opts);
    } catch {}
  }

  // Guaranteed fallback: high-fidelity Google speech engine
  return generateGoogleTTS(clean, opts);
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
