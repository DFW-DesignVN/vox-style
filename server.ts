import express from 'express';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { generateAsset, processUploadedImage } from './server/assetEngine.ts';
import { generateVoice, normalizeProjectToVoiceTimeline, getTTSProviders } from './server/audioEngine.ts';

dotenv.config();
const execAsync = promisify(exec);
const app = express();
const PORT = 3000;
const OUTPUTS_DIR = path.join(process.cwd(), 'outputs');
const PROJECTS_DIR = path.join(process.cwd(), 'projects');
const TEMP_DIR = path.join(process.cwd(), 'temp_renders');
for (const dir of [OUTPUTS_DIR, PROJECTS_DIR, TEMP_DIR]) fs.mkdirSync(dir, { recursive: true });
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use('/outputs', express.static(OUTPUTS_DIR));

// Image proxy to bypass CORS restrictions during Canvas compositing & video export
app.get('/api/proxy-image', async (req, res) => {
  try {
    const imageUrl = req.query.url as string;
    if (!imageUrl) return res.status(400).send('url parameter required');
    const upstream = await fetch(imageUrl);
    if (!upstream.ok) return res.status(upstream.status).send('Failed to fetch remote image');
    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    const buffer = Buffer.from(await upstream.arrayBuffer());
    res.send(buffer);
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

app.get('/api/health', async (_req, res) => {
  try { const { stdout } = await execAsync('ffmpeg -version'); const m = stdout.match(/ffmpeg version ([^\s]+)/); res.json({ status:'ok', ffmpeg:true, ffmpegVersion:m?.[1]||'detected', nodeEnv:process.env.NODE_ENV||'development', tts:!!process.env.ELEVENLABS_API_KEY }); }
  catch (err:any) { res.json({ status:'ok', ffmpeg:false, tts:!!process.env.ELEVENLABS_API_KEY, error:err.message }); }
});

app.get('/api/tts/providers', async (_req, res) => {
  try {
    const providers = await getTTSProviders();
    res.json(providers);
  } catch (err: any) {
    res.json({ vieneu: false, capcut: false, elevenlabs: false });
  }
});

app.get('/api/presets', (_req,res)=>res.json({ layouts:['hero_archive','newspaper','map','photo_stack','document','big_number','timeline','collage_board'], motions:['paper_drop','paper_slide_left','paper_slide_right','paper_slide_up','paper_slide_down','photo_stack','paper_reveal','typewriter','headline_pop','stamp_in','arrow_draw','string_draw'], style:{name:'vox_paper_collage',palette:{paper:'#E6DCB8',offWhite:'#F4EEDA',black:'#121212',gray:'#52525B',red:'#DC2626',yellow:'#CA8A04'}} }));

app.post('/api/director/storyboard', async (req,res)=>{
  try {
    const { topic, duration=25, niche='documentary' } = req.body;
    if (!topic) return res.status(400).json({error:'Topic is required'});
    const shotCount = duration<=20?4:duration<=25?5:6;
    if (process.env.GEMINI_API_KEY) try {
      const ai=new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY});
      const systemPrompt=`You are the AI Director for VOX AUTO VIDEO ENGINE V0.1. Produce strict JSON only. Topic is ${topic}; niche is ${niche}. Create exactly ${shotCount} shots totaling about ${duration}s. Use only layouts hero_archive,newspaper,map,photo_stack,document,big_number,timeline,collage_board. Use only motions paper_drop,paper_slide_left,paper_slide_right,paper_slide_up,paper_slide_down,photo_stack,paper_reveal,typewriter,headline_pop,stamp_in,arrow_draw,string_draw. Max 2 text elements per shot. IMPORTANT: never output external image URLs, Unsplash URLs, remote sources, or placeholder source URLs. Every image asset MUST have an assetPrompt specific to the topic and shot; set source to an empty string and status to pending. Return JSON matching {project_id,title,duration,script,shots:[{shot_id,order,start,end,duration,narration,visual_idea,layout,background,assets:[{id,type,role,source,position,scale,rotation,motion,start,filter,paperCutout,shadow,assetPrompt,provider,status}],text,graphics]}.`;
      const response=await ai.models.generateContent({model:'gemini-3.8-flash',contents:`Topic: ${topic}. Duration: ${duration}s.`,config:{systemInstruction:systemPrompt,responseMimeType:'application/json'}});
      const parsed=JSON.parse(response.text||'{}'); sanitizeStoryboardAssets(parsed); return res.json(parsed);
    } catch(e:any){ console.warn('Gemini director fallback:',e.message); }
    return res.json(generateStructuredFallback(topic,duration,shotCount));
  } catch(err:any){res.status(500).json({error:err.message});}
});

function sanitizeStoryboardAssets(project:any){for(const shot of project?.shots||[])for(const asset of shot.assets||[])if(asset.type==='image'){asset.source='';asset.status='pending';asset.provider=asset.provider||'gemini';asset.paperCutout=true;}}
function generateStructuredFallback(topic:string,totalDuration:number,count:number){const shotDuration=Number((totalDuration/count).toFixed(1));const layouts=['newspaper','hero_archive','big_number','document','collage_board'];const shots:any[]=[];let currentTime=0;for(let i=0;i<count;i++){const start=currentTime;const end=Number((currentTime+shotDuration).toFixed(1));currentTime=end;shots.push({shot_id:`shot_00${i+1}`,order:i+1,start,end,duration:shotDuration,narration:`Act ${i+1}: Key historical beat regarding ${topic}, unfolding the critical context and impact.`,visual_idea:`Visual documentation of ${topic} using archival paper cutout and editorial annotations.`,layout:layouts[i%layouts.length],background:{type:i%2===0?'newsprint':'archival'},assets:[{id:`hero_0${i+1}`,type:'image',role:'hero',source:'',position:{x:50,y:54},scale:.9,rotation:(i%2===0?-1:1)*2,motion:i===0?'paper_drop':i===1?'paper_slide_left':'photo_stack',start:.3,filter:'high_contrast',paperCutout:true,shadow:{enabled:true,offset:[12,16],blur:24,opacity:.45},assetPrompt:`Topic-specific archival documentary image depicting ${topic}, chapter ${i+1}. Hand-cut paper collage aesthetic, historically plausible, high contrast, no text.`,provider:'gemini',status:'pending'}],text:[{id:`txt_d_${i+1}`,content:`CHAPTER 0${i+1}`,role:'date',style:'typewriter',position:{x:18,y:20},motion:'typewriter',start:.5,fontSize:32,color:'#111111'},{id:`txt_h_${i+1}`,content:topic.toUpperCase().slice(0,24),role:'headline',style:'condensed_bold',position:{x:18,y:32},motion:'headline_pop',start:1.2,fontSize:64,color:'#F4EEDA'}],graphics:[{id:`tape_${i+1}`,type:'tape',color:'#E5D6A7',motion:'paper_drop',start:.4,position:{x:48,y:28},scale:1,rotation:-8},{id:`arrow_${i+1}`,type:'arrow',color:'#DC2626',motion:'arrow_draw',start:1.8,points:[[25,70],[46,52]]}]});}return{project_id:`vox_${Date.now()}`,title:topic,duration:totalDuration,script:shots.map(s=>s.narration).join(' '),shots};}

app.post('/api/assets/generate',async(req,res)=>{try{const{prompt,topic,shotId,assetId,role,layout,style}=req.body;if(!prompt)return res.status(400).json({error:'Asset prompt is required'});res.json(await generateAsset({prompt,topic,shotId,assetId,role,layout,style}));}catch(err:any){res.status(500).json({error:err.message});}});
app.post('/api/assets/generate-all',async(req,res)=>{try{const{project,concurrency=2}=req.body;if(!project?.shots||!Array.isArray(project.shots))return res.status(400).json({error:'Project with shots is required'});const updatedProject=JSON.parse(JSON.stringify(project));const jobs:any[]=[];for(const shot of updatedProject.shots)for(const asset of shot.assets||[])if(asset.type==='image')jobs.push({shot,asset});let generatedCount=0,cursor=0;async function worker(){while(true){const index=cursor++;if(index>=jobs.length)return;const{shot,asset}=jobs[index];asset.status='generating';try{const result=await generateAsset({prompt:asset.assetPrompt||`Archival documentary image depicting ${project.title}, shot ${shot.order}`,topic:project.title,shotId:shot.shot_id,assetId:asset.id,role:asset.role,layout:shot.layout});if(result.success&&result.url){asset.source=result.url;asset.provider=result.provider;asset.status='ready';asset.paperCutout=true;generatedCount++;}else asset.status='failed';}catch{asset.status='failed';}}}await Promise.all(Array.from({length:Math.min(Math.max(1,Number(concurrency)||2),3)},worker));res.json({success:true,project:updatedProject,generatedCount,totalAssets:jobs.length});}catch(err:any){res.status(500).json({error:err.message});}});
app.post('/api/assets/upload',async(req,res)=>{try{const{imageBase64,shotId,assetId}=req.body;if(!imageBase64)return res.status(400).json({error:'imageBase64 is required'});res.json(await processUploadedImage(imageBase64,shotId,assetId));}catch(err:any){res.status(500).json({error:err.message});}});

// Audio-first production: generate one authoritative voice track, then derive shot timing and 5-8 word visual beats from it.
app.post('/api/voice/generate',async(req,res)=>{try{const{text,projectId,voiceId,modelId,stability,similarityBoost}=req.body;if(!text)return res.status(400).json({error:'text is required'});const result=await generateVoice(text,{voiceId,modelId,stability,similarityBoost});res.json(result);}catch(err:any){res.status(500).json({error:err.message});}});
app.post('/api/timeline/audio-first',async(req,res)=>{try{const{project,voiceDuration}=req.body;if(!project?.shots?.length)return res.status(400).json({error:'project.shots is required'});let duration=Number(voiceDuration);if(!Number.isFinite(duration)||duration<=0)duration=Number(project.voiceDuration);if(!Number.isFinite(duration)||duration<=0)return res.status(400).json({error:'voiceDuration is required'});const normalized=await normalizeProjectToVoiceTimeline(project,duration);const timeline={duration:Number(duration.toFixed(3)),fps:project.fps||30,voiceUrl:project.voiceUrl,beats:normalized.beats,generatedAt:new Date().toISOString()};res.json({success:true,project:{...project,duration:Number(duration.toFixed(3)),shots:normalized.shots,voiceDuration:Number(duration.toFixed(3)),audioTimeline:timeline},timeline});}catch(err:any){res.status(500).json({error:err.message});}});
app.post('/api/voice-and-timeline',async(req,res)=>{try{const{project,text}=req.body;if(!project?.shots?.length)return res.status(400).json({error:'project.shots is required'});const voiceText=text||project.script||project.shots.map((s:any)=>s.narration).join(' ');const voice=await generateVoice(voiceText,req.body);const normalized=await normalizeProjectToVoiceTimeline(project,voice.duration);const timeline={duration:Number(voice.duration.toFixed(3)),fps:project.fps||30,voiceUrl:voice.url,beats:normalized.beats,generatedAt:new Date().toISOString()};res.json({success:true,voice,project:{...project,duration:Number(voice.duration.toFixed(3)),voiceUrl:voice.url,voiceDuration:Number(voice.duration.toFixed(3)),shots:normalized.shots,audioTimeline:timeline},timeline});}catch(err:any){res.status(500).json({error:err.message});}});

// Render Session State for Scalable Long-Form Video Compositing (15m+ support)
interface RenderSession {
  id: string;
  projectDir: string;
  fps: number;
  voiceUrl?: string;
  totalFrames: number;
  writtenFrames: number;
  createdAt: number;
}
const renderSessions = new Map<string, RenderSession>();

// Cleanup stale sessions older than 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of renderSessions.entries()) {
    if (now - session.createdAt > 30 * 60 * 1000) {
      try {
        fs.rmSync(session.projectDir, { recursive: true, force: true });
      } catch {}
      renderSessions.delete(id);
    }
  }
}, 5 * 60 * 1000);

function resolveSafeAudioPath(voiceUrl: string | undefined, projectDir: string): { inputArg: string; codecArg: string; hasAudio: boolean } {
  if (!voiceUrl || typeof voiceUrl !== 'string') {
    return { inputArg: '', codecArg: '', hasAudio: false };
  }

  let resolvedAudioPath: string | null = null;
  if (voiceUrl.startsWith('data:audio/')) {
    const ext = voiceUrl.includes('audio/wav') ? 'wav' : 'mp3';
    const tempVoicePath = path.join(projectDir, `voice_track.${ext}`);
    const base64Data = voiceUrl.replace(/^data:audio\/\w+;base64,/, '');
    fs.writeFileSync(tempVoicePath, Buffer.from(base64Data, 'base64'));
    resolvedAudioPath = tempVoicePath;
  } else {
    const cleanPath = voiceUrl.replace(/^\/+/, '');
    const candidateInCwd = path.resolve(process.cwd(), cleanPath);
    const safeDirs = [
      path.resolve(process.cwd(), 'outputs'),
      path.resolve(process.cwd(), 'public'),
    ];

    const isContained = (targetPath: string) =>
      safeDirs.some((dir) => {
        const rel = path.relative(dir, targetPath);
        return !rel.startsWith('..') && !path.isAbsolute(rel);
      });

    if (!isContained(candidateInCwd)) {
      throw new Error('Security violation: voiceUrl must reside strictly inside outputs/ or public/');
    }

    if (fs.existsSync(candidateInCwd)) {
      const realTarget = fs.realpathSync(candidateInCwd);
      if (!isContained(realTarget)) {
        throw new Error('Security violation: symlink traversal outside allowed directories detected');
      }
      resolvedAudioPath = candidateInCwd;
    }
  }

  if (resolvedAudioPath) {
    return {
      inputArg: `-i "${resolvedAudioPath}"`,
      codecArg: `-c:a aac -b:a 192k -af "apad" -shortest`,
      hasAudio: true,
    };
  }

  return { inputArg: '', codecArg: '', hasAudio: false };
}

async function verifyFinalVideoWithFFprobe(outputMp4Path: string, expectedAudio: boolean) {
  const probeCmd = `ffprobe -v error -show_entries stream=codec_name,codec_type,duration:format=duration,format_name -of json "${outputMp4Path}"`;
  const { stdout: probeStdout } = await execAsync(probeCmd);
  const probeData = JSON.parse(probeStdout || '{}');
  const streams: Array<{ codec_name: string; codec_type: string; duration?: string }> = Array.isArray(probeData.streams)
    ? probeData.streams
    : [];

  const videoStream = streams.find((s) => s.codec_type === 'video');
  const audioStream = streams.find((s) => s.codec_type === 'audio');

  if (!videoStream) {
    throw new Error('FFprobe verification failed: Rendered MP4 does not contain a video stream.');
  }
  if (videoStream.codec_name !== 'h264') {
    throw new Error(`FFprobe verification failed: Video codec must be h264, found: ${videoStream.codec_name}`);
  }

  if (expectedAudio) {
    if (!audioStream) {
      throw new Error('FFprobe verification failed: Audio track was specified but rendered MP4 contains no audio stream.');
    }
    if (audioStream.codec_name !== 'aac') {
      throw new Error(`FFprobe verification failed: Audio codec must be aac, found: ${audioStream.codec_name}`);
    }
  }

  return {
    video: videoStream.codec_name,
    audio: audioStream ? audioStream.codec_name : null,
    container: probeData.format?.format_name || 'mp4',
    duration: Number(probeData.format?.duration) || null,
    strictVerified: true,
  };
}

// Session-based chunked streaming render endpoints (prevents OOM on long documentary episodes)
app.post('/api/render/session/start', async (req, res) => {
  try {
    const { projectId, fps = 30, voiceUrl, totalFrames } = req.body;
    const sessionId = `vox_${projectId || 'doc'}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const projectDir = path.join(TEMP_DIR, sessionId);
    fs.mkdirSync(projectDir, { recursive: true });

    const session: RenderSession = {
      id: sessionId,
      projectDir,
      fps: Number(fps) || 30,
      voiceUrl,
      totalFrames: Number(totalFrames) || 0,
      writtenFrames: 0,
      createdAt: Date.now(),
    };

    renderSessions.set(sessionId, session);
    res.json({ success: true, sessionId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/render/session/chunk', async (req, res) => {
  try {
    const { sessionId, startFrameIndex = 0, frames } = req.body;
    const session = renderSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Render session not found or expired' });
    }
    if (!Array.isArray(frames) || !frames.length) {
      return res.status(400).json({ error: 'No frames provided in chunk' });
    }

    for (let i = 0; i < frames.length; i++) {
      const frameIdx = startFrameIndex + i;
      const framePath = path.join(session.projectDir, `frame_${String(frameIdx).padStart(5, '0')}.jpg`);
      const base64Data = String(frames[i]).replace(/^data:image\/\w+;base64,/, '').replace(/\s/g, '');
      fs.writeFileSync(framePath, Buffer.from(base64Data, 'base64'));
    }

    session.writtenFrames += frames.length;
    res.json({ success: true, writtenFrames: session.writtenFrames });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/render/session/finish', async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = renderSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Render session not found or expired' });
    }

    const outputMp4Path = path.join(OUTPUTS_DIR, `${session.id}.mp4`);
    const { inputArg, codecArg, hasAudio } = resolveSafeAudioPath(session.voiceUrl, session.projectDir);

    const ffmpegCmd = inputArg
      ? `ffmpeg -y -framerate ${session.fps} -i "${session.projectDir}/frame_%05d.jpg" ${inputArg} -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,format=yuv420p" -c:v libx264 -pix_fmt yuv420p -r ${session.fps} ${codecArg} -preset fast -crf 20 "${outputMp4Path}"`
      : `ffmpeg -y -framerate ${session.fps} -i "${session.projectDir}/frame_%05d.jpg" -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,format=yuv420p" -c:v libx264 -pix_fmt yuv420p -r ${session.fps} -preset fast -crf 20 "${outputMp4Path}"`;

    await execAsync(ffmpegCmd);
    fs.rmSync(session.projectDir, { recursive: true, force: true });
    renderSessions.delete(sessionId);

    const verifiedStreams = await verifyFinalVideoWithFFprobe(outputMp4Path, hasAudio);

    res.json({
      success: true,
      videoUrl: `/outputs/${session.id}.mp4`,
      renderId: session.id,
      frameCount: session.writtenFrames,
      fps: session.fps,
      hasAudio,
      verifiedStreams,
    });
  } catch (err: any) {
    const isSecurity = err?.message && err.message.includes('Security violation');
    res.status(isSecurity ? 400 : 500).json({ error: err.message });
  }
});

app.post('/api/render-final-video', async (req, res) => {
  try {
    const { projectId, shotFrames, fps = 30, voiceUrl } = req.body;
    if (!Array.isArray(shotFrames) || !shotFrames.length) {
      return res.status(400).json({ error: 'No frames provided for rendering' });
    }
    const renderId = `${projectId || 'vox_render'}_${Date.now()}`;
    const projectDir = path.join(TEMP_DIR, renderId);
    fs.mkdirSync(projectDir, { recursive: true });

    for (let i = 0; i < shotFrames.length; i++) {
      fs.writeFileSync(
        path.join(projectDir, `frame_${String(i).padStart(5, '0')}.jpg`),
        Buffer.from(String(shotFrames[i]).replace(/^data:image\/\w+;base64,/, '').replace(/\s/g, ''), 'base64')
      );
    }

    const outputMp4Path = path.join(OUTPUTS_DIR, `${renderId}.mp4`);
    const { inputArg, codecArg, hasAudio } = resolveSafeAudioPath(voiceUrl, projectDir);

    const ffmpegCmd = inputArg
      ? `ffmpeg -y -framerate ${Number(fps) || 30} -i "${projectDir}/frame_%05d.jpg" ${inputArg} -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,format=yuv420p" -c:v libx264 -pix_fmt yuv420p -r ${Number(fps) || 30} ${codecArg} -preset fast -crf 20 "${outputMp4Path}"`
      : `ffmpeg -y -framerate ${Number(fps) || 30} -i "${projectDir}/frame_%05d.jpg" -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,format=yuv420p" -c:v libx264 -pix_fmt yuv420p -r ${Number(fps) || 30} -preset fast -crf 20 "${outputMp4Path}"`;

    await execAsync(ffmpegCmd);
    fs.rmSync(projectDir, { recursive: true, force: true });

    const verifiedStreams = await verifyFinalVideoWithFFprobe(outputMp4Path, hasAudio);

    res.json({
      success: true,
      videoUrl: `/outputs/${renderId}.mp4`,
      renderId,
      frameCount: shotFrames.length,
      fps: Number(fps) || 30,
      hasAudio,
      verifiedStreams,
    });
  } catch (err: any) {
    const isSecurity = err?.message && err.message.includes('Security violation');
    res.status(isSecurity ? 400 : 500).json({ error: err.message });
  }
});

async function startServer(){if(process.env.NODE_ENV!=='production'){const vite=await createViteServer({server:{middlewareMode:true},appType:'spa'});app.use(vite.middlewares);}else{const distPath=path.join(process.cwd(),'dist');app.use(express.static(distPath));app.get('*',(_req,res)=>res.sendFile(path.join(distPath,'index.html')));}app.listen(PORT,'0.0.0.0',()=>console.log(`VOX Auto Video Engine server running on http://0.0.0.0:${PORT}`));}
startServer();