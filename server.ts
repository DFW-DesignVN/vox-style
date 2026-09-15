import express from 'express';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { generateAsset, processUploadedImage } from './server/assetEngine.ts';

dotenv.config();

const execAsync = promisify(exec);
const app = express();
const PORT = 3000;

// Set up output directories
const OUTPUTS_DIR = path.join(process.cwd(), 'outputs');
const PROJECTS_DIR = path.join(process.cwd(), 'projects');
const TEMP_DIR = path.join(process.cwd(), 'temp_renders');

for (const dir of [OUTPUTS_DIR, PROJECTS_DIR, TEMP_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Generous limit for frame uploads
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Static route for served media outputs
app.use('/outputs', express.static(OUTPUTS_DIR));

// 1. Health check & FFmpeg check
app.get('/api/health', async (req, res) => {
  try {
    const { stdout } = await execAsync('ffmpeg -version');
    const versionMatch = stdout.match(/ffmpeg version ([^\s]+)/);
    res.json({
      status: 'ok',
      ffmpeg: true,
      ffmpegVersion: versionMatch ? versionMatch[1] : 'detected',
      nodeEnv: process.env.NODE_ENV || 'development',
    });
  } catch (err: any) {
    res.json({
      status: 'ok',
      ffmpeg: false,
      error: err.message,
    });
  }
});

// 2. Presets API
app.get('/api/presets', (req, res) => {
  res.json({
    layouts: [
      'hero_archive',
      'newspaper',
      'map',
      'photo_stack',
      'document',
      'big_number',
      'timeline',
      'collage_board',
    ],
    motions: [
      'paper_drop',
      'paper_slide_left',
      'paper_slide_right',
      'paper_slide_up',
      'paper_slide_down',
      'photo_stack',
      'paper_reveal',
      'typewriter',
      'headline_pop',
      'stamp_in',
      'arrow_draw',
      'string_draw',
    ],
    style: {
      name: 'vox_paper_collage',
      palette: {
        paper: '#E6DCB8',
        offWhite: '#F4EEDA',
        black: '#121212',
        gray: '#52525B',
        red: '#DC2626',
        yellow: '#CA8A04',
      },
    },
  });
});

// 3. AI Director: Script & Storyboard Generator via Gemini API
app.post('/api/director/storyboard', async (req, res) => {
  try {
    const { topic, duration = 25, niche = 'documentary' } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const shotCount = duration <= 20 ? 4 : duration <= 25 ? 5 : 6;

    // Check if GEMINI_API_KEY is available
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const systemPrompt = `You are the AI Director for the VOX AUTO VIDEO ENGINE V0.1.
Your job is to produce a strict JSON output representing a documentary paper collage video on the given topic.
Rules:
1. Script must be factual, calm, concise, documentary narration with concrete actions, dates, and locations. No sponsor, no camera instructions.
2. Produce exactly ${shotCount} shots. Total duration must be approximately ${duration} seconds (each shot 3.5 to 5.2 seconds).
3. Layout must be one of: "hero_archive", "newspaper", "map", "photo_stack", "document", "big_number", "timeline", "collage_board".
4. Motion presets must ONLY be chosen from:
   "paper_drop", "paper_slide_left", "paper_slide_right", "paper_slide_up", "paper_slide_down", "photo_stack", "paper_reveal", "typewriter", "headline_pop", "stamp_in", "arrow_draw", "string_draw".
5. Keep text very short: max 2 text elements per shot (e.g., date label, bold headline, or big number).
6. Graphics: arrow, circle, underline, red_string, stamp, tape.
7. Return PURE JSON only matching this schema without markdown fences:
{
  "project_id": "string",
  "title": "string",
  "duration": ${duration},
  "script": "string",
  "shots": [
    {
      "shot_id": "shot_001",
      "order": 1,
      "start": 0.0,
      "end": 4.5,
      "duration": 4.5,
      "narration": "string",
      "visual_idea": "string",
      "layout": "newspaper",
      "background": { "type": "newsprint" },
      "assets": [
        {
          "id": "hero_01",
          "type": "image",
          "role": "hero",
          "source": "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1000&q=80",
          "position": { "x": 50, "y": 55 },
          "scale": 0.9,
          "rotation": -2,
          "motion": "paper_drop",
          "start": 0.3,
          "filter": "high_contrast",
          "assetPrompt": "Archival historical photograph or newspaper front page showing 1929 stock market crash, high contrast vintage newsprint cutout",
          "provider": "gemini",
          "status": "pending"
        }
      ],
      "text": [
        {
          "id": "t1",
          "content": "OCTOBER 1929",
          "role": "date",
          "style": "typewriter",
          "position": { "x": 16, "y": 20 },
          "motion": "typewriter",
          "start": 0.5,
          "fontSize": 32,
          "color": "#111111"
        },
        {
          "id": "t2",
          "content": "HEADLINE PHRASE",
          "role": "headline",
          "style": "condensed_bold",
          "position": { "x": 16, "y": 32 },
          "motion": "headline_pop",
          "start": 1.2,
          "fontSize": 64,
          "color": "#F4EEDA"
        }
      ],
      "graphics": [
        {
          "id": "g1",
          "type": "tape",
          "color": "#E5D6A7",
          "motion": "paper_drop",
          "start": 0.4,
          "position": { "x": 50, "y": 28 },
          "rotation": -8
        }
      ]
    }
  ]
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Topic: ${topic}. Total duration: ${duration} seconds. Generate the storyboard JSON.`,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
          },
        });

        const text = response.text || '';
        const parsed = JSON.parse(text);
        return res.json(parsed);
      } catch (geminiError: any) {
        console.warn('Gemini generation error, falling back to structured director template:', geminiError.message);
      }
    }

    // Fallback template generator if API key is not yet provided
    const defaultShots = generateStructuredFallback(topic, duration, shotCount);
    res.json(defaultShots);
  } catch (err: any) {
    console.error('Storyboard generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Helper for structured director fallback
function generateStructuredFallback(topic: string, totalDuration: number, count: number) {
  const shotDuration = Number((totalDuration / count).toFixed(1));
  const layouts = ['newspaper', 'hero_archive', 'big_number', 'document', 'collage_board'];
  const sampleImages = [
    'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1000&q=80',
  ];

  const shots = [];
  let currentTime = 0;

  for (let i = 0; i < count; i++) {
    const start = currentTime;
    const end = Number((currentTime + shotDuration).toFixed(1));
    currentTime = end;

    const layout = layouts[i % layouts.length];
    shots.push({
      shot_id: `shot_00${i + 1}`,
      order: i + 1,
      start,
      end,
      duration: shotDuration,
      narration: `Act ${i + 1}: Key historical beat regarding ${topic}, unfolding the critical context and impact.`,
      visual_idea: `Visual documentation of ${topic} using archival paper cutout and editorial annotations.`,
      layout,
      background: {
        type: i % 2 === 0 ? 'newsprint' : 'archival',
      },
      assets: [
        {
          id: `hero_0${i + 1}`,
          type: 'image',
          role: 'hero',
          source: sampleImages[i % sampleImages.length],
          position: { x: 50, y: 54 },
          scale: 0.9,
          rotation: (i % 2 === 0 ? -1 : 1) * 2,
          motion: i === 0 ? 'paper_drop' : i === 1 ? 'paper_slide_left' : 'photo_stack',
          start: 0.3,
          filter: 'high_contrast',
          paperCutout: true,
          shadow: { enabled: true, offset: [12, 16], blur: 24, opacity: 0.45 },
          assetPrompt: `Archival historical record and newspaper cutout depicting ${topic}, Chapter 0${i + 1}`,
          provider: 'gemini',
          status: 'pending',
        },
      ],
      text: [
        {
          id: `txt_d_${i + 1}`,
          content: `CHAPTER 0${i + 1}`,
          role: 'date',
          style: 'typewriter',
          position: { x: 18, y: 20 },
          motion: 'typewriter',
          start: 0.5,
          fontSize: 32,
          color: '#111111',
        },
        {
          id: `txt_h_${i + 1}`,
          content: `${topic.toUpperCase().slice(0, 24)}`,
          role: 'headline',
          style: 'condensed_bold',
          position: { x: 18, y: 32 },
          motion: 'headline_pop',
          start: 1.2,
          fontSize: 64,
          color: '#F4EEDA',
        },
      ],
      graphics: [
        {
          id: `tape_${i + 1}`,
          type: 'tape',
          color: '#E5D6A7',
          motion: 'paper_drop',
          start: 0.4,
          position: { x: 48, y: 28 },
          scale: 1,
          rotation: -8,
        },
        {
          id: `arrow_${i + 1}`,
          type: 'arrow',
          color: '#DC2626',
          motion: 'arrow_draw',
          start: 1.8,
          points: [
            [25, 70],
            [46, 52],
          ],
        },
      ],
    });
  }

  return {
    project_id: `vox_${Date.now()}`,
    title: topic,
    duration: totalDuration,
    script: shots.map((s) => s.narration).join(' '),
    shots,
  };
}

// 4. Asset Engine Endpoints

// A. Generate Single Asset (Gemini Image or Procedural Cutout Engine)
app.post('/api/assets/generate', async (req, res) => {
  try {
    const { prompt, topic, shotId, assetId, role, layout, style } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Asset prompt is required' });
    }

    const result = await generateAsset({
      prompt,
      topic,
      shotId,
      assetId,
      role,
      layout,
      style,
    });

    res.json(result);
  } catch (err: any) {
    console.error('Asset generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// B. Batch Generate All Assets in a Project
app.post('/api/assets/generate-all', async (req, res) => {
  try {
    const { project } = req.body;
    if (!project || !Array.isArray(project.shots)) {
      return res.status(400).json({ error: 'Project with shots is required' });
    }

    const updatedProject = JSON.parse(JSON.stringify(project));
    let generatedCount = 0;

    for (const shot of updatedProject.shots) {
      for (const asset of shot.assets) {
        if (asset.type === 'image') {
          const prompt =
            asset.assetPrompt ||
            `Archival historical photo or document regarding ${project.title}, shot ${shot.order}`;

          const genResult = await generateAsset({
            prompt,
            topic: project.title,
            shotId: shot.shot_id,
            assetId: asset.id,
            role: asset.role,
            layout: shot.layout,
          });

          if (genResult.success && genResult.url) {
            asset.source = genResult.url;
            asset.provider = genResult.provider;
            asset.status = 'ready';
            asset.paperCutout = true;
            generatedCount++;
          }
        }
      }
    }

    res.json({
      success: true,
      project: updatedProject,
      generatedCount,
    });
  } catch (err: any) {
    console.error('Batch asset generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// C. Upload Custom Archival Photo & Apply Cutout
app.post('/api/assets/upload', async (req, res) => {
  try {
    const { imageBase64, shotId, assetId } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    const result = await processUploadedImage(imageBase64, shotId, assetId);
    res.json(result);
  } catch (err: any) {
    console.error('Asset upload processing error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 5. Render Video via FFmpeg
// Accepts array of base64 JPEG/PNG frames or shot video segments and compiles 1080p MP4
app.post('/api/render-final-video', async (req, res) => {
  try {
    const { projectId, shotFrames, fps = 30 } = req.body;

    if (!shotFrames || !Array.isArray(shotFrames) || shotFrames.length === 0) {
      return res.status(400).json({ error: 'No frames provided for rendering' });
    }

    const renderId = `${projectId || 'vox_render'}_${Date.now()}`;
    const projectDir = path.join(TEMP_DIR, renderId);
    fs.mkdirSync(projectDir, { recursive: true });

    console.log(`Writing ${shotFrames.length} frames for rendering to ${projectDir}...`);

    // Write frames as image_%05d.jpg
    for (let i = 0; i < shotFrames.length; i++) {
      const frameData = shotFrames[i];
      // strip base64 prefix
      const base64Data = frameData.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const filename = path.join(projectDir, `frame_${String(i).padStart(5, '0')}.jpg`);
      fs.writeFileSync(filename, buffer);
    }

    const outputMp4Path = path.join(OUTPUTS_DIR, `${renderId}.mp4`);

    // Combine frames into compliant H.264 1080p MP4 with scale pad ensuring 1920x1080 even dimensions
    const ffmpegCmd = `ffmpeg -y -framerate ${fps} -i "${projectDir}/frame_%05d.jpg" -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,format=yuv420p" -c:v libx264 -pix_fmt yuv420p -r ${fps} -preset fast -crf 20 "${outputMp4Path}"`;

    console.log(`Executing FFmpeg: ${ffmpegCmd}`);
    await execAsync(ffmpegCmd);

    // Clean up temp frames to conserve disk space
    try {
      fs.rmSync(projectDir, { recursive: true, force: true });
    } catch (cleanupErr) {
      console.warn('Frame cleanup warning:', cleanupErr);
    }

    const videoUrl = `/outputs/${renderId}.mp4`;
    res.json({
      success: true,
      videoUrl,
      renderId,
      frameCount: shotFrames.length,
      fps,
    });
  } catch (err: any) {
    console.error('Video render error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 5. Shot-level Video Render API
app.post('/api/render-shot-video', async (req, res) => {
  try {
    const { shotId, frames, fps = 30 } = req.body;
    if (!frames || frames.length === 0) {
      return res.status(400).json({ error: 'No frames provided' });
    }

    const renderId = `${shotId || 'shot'}_${Date.now()}`;
    const projectDir = path.join(TEMP_DIR, renderId);
    fs.mkdirSync(projectDir, { recursive: true });

    for (let i = 0; i < frames.length; i++) {
      const base64Data = frames[i].replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(
        path.join(projectDir, `frame_${String(i).padStart(5, '0')}.jpg`),
        Buffer.from(base64Data, 'base64')
      );
    }

    const outputMp4Path = path.join(OUTPUTS_DIR, `${renderId}.mp4`);
    const ffmpegCmd = `ffmpeg -y -framerate ${fps} -i "${projectDir}/frame_%05d.jpg" -c:v libx264 -pix_fmt yuv420p -r ${fps} -preset fast -crf 20 "${outputMp4Path}"`;

    await execAsync(ffmpegCmd);

    try {
      fs.rmSync(projectDir, { recursive: true, force: true });
    } catch (_) {}

    res.json({
      success: true,
      videoUrl: `/outputs/${renderId}.mp4`,
      shotId,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Vite middleware for dev or Static serve in prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VOX Auto Video Engine server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
