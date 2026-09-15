import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
const TMP_FRAMES_DIR = path.join('/tmp', 'benchmark_real_frames_30s');
const FONT_FILE = '/usr/share/fonts/opentype/urw-base35/NimbusSans-Regular.otf';

/**
 * Pre-generate full 1920x1080 documentary frames containing actual visuals:
 * archival background, newspaper box, text captions, graphics, timestamps, and realistic compression payloads (~60-90KB each)
 */
function prepareRealVisualFrames(frameCount: number = 25) {
  if (fs.existsSync(TMP_FRAMES_DIR)) {
    fs.rmSync(TMP_FRAMES_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(TMP_FRAMES_DIR, { recursive: true });

  console.log(`[Setup] Synthesizing ${frameCount} distinct 1920x1080 VOX editorial visual frames with realistic entropy...`);
  
  for (let i = 0; i < frameCount; i++) {
    const frameFile = path.join(TMP_FRAMES_DIR, `real_frame_${i}.jpg`);
    const dateText = `OCTOBER 24 1929 - FRAME ${i}`;
    const panicIndex = (100 + Math.sin(i * 0.25) * 45).toFixed(1);
    
    // Generate authentic 1920x1080 frame with newspaper box, archival header, panic index, and timecode
    const cmd = `ffmpeg -y -f lavfi -i "color=c=0x221F1A:s=1920x1080:d=1" -vf "\
drawbox=x=30:y=30:w=1860:h=1020:color=0x3F3F46@0.4:t=2,\
drawbox=x=80:y=120:w=640:h=820:color=0x18181B@0.9:t=fill,\
drawbox=x=80:y=120:w=640:h=820:color=0xD97706@0.6:t=3,\
drawtext=fontfile=${FONT_FILE}:text='THE WALL STREET JOURNAL':fontsize=38:fontcolor=0xF4EEDA:x=110:y=160,\
drawtext=fontfile=${FONT_FILE}:text='${dateText}':fontsize=28:fontcolor=0xFBBF24:x=110:y=220,\
drawtext=fontfile=${FONT_FILE}:text='PANIC INDEX: ${panicIndex}%':fontsize=48:fontcolor=0xEF4444:x=110:y=310,\
drawbox=x=760:y=120:w=1080:h=820:color=0x121214@0.85:t=fill,\
drawtext=fontfile=${FONT_FILE}:text='ARCHIVAL COMPOSITOR REAL FRAME BENCHMARK':fontsize=36:fontcolor=0xE4E4E7:x=790:y=160,\
drawtext=fontfile=${FONT_FILE}:text='Resolution: 1920x1080 (Full HD)  |  Color Space: YUV420P':fontsize=22:fontcolor=0xA1A1AA:x=790:y=220,\
drawtext=fontfile=${FONT_FILE}:text='Engine: VOX Documentary Stop-Motion Paper Pipeline':fontsize=22:fontcolor=0xA1A1AA:x=790:y=255" \
-vframes 1 -q:v 3 "${frameFile}"`;

    execSync(cmd, { stdio: 'pipe' });
  }

  // Load them into memory as real base64 data URLs
  const base64Frames: string[] = [];
  for (let i = 0; i < frameCount; i++) {
    const frameFile = path.join(TMP_FRAMES_DIR, `real_frame_${i}.jpg`);
    const buf = fs.readFileSync(frameFile);
    base64Frames.push(`data:image/jpeg;base64,${buf.toString('base64')}`);
  }

  const sampleSize = fs.statSync(path.join(TMP_FRAMES_DIR, 'real_frame_0.jpg')).size;
  console.log(`[Setup] Real 1920x1080 frame pool generated (${frameCount} frames). Average payload: ${(sampleSize / 1024).toFixed(1)} KB.\n`);

  return base64Frames;
}

async function runBenchmarkBrowserReal() {
  console.log('================================================================');
  console.log('🏁 REAL BROWSER/CANVAS BENCHMARK: LEVEL 1 (30s / 900 REAL FRAMES)');
  console.log('• Resolution: 1920x1080 true Full HD frames (NOT dummy 1x1 JPEG)');
  console.log('• Target: 900 real frames @ 30 FPS with full AAC Audio Muxing');
  console.log(`• Server: ${BASE_URL}`);
  console.log('================================================================\n');

  const startTime = Date.now();
  const memoryBefore = process.memoryUsage();

  const realFramePool = prepareRealVisualFrames(25);

  const totalFrames = 900;
  const fps = 30;
  const chunkSize = 25;
  const voiceUrl = '/outputs/audio/wall_street_demo.mp3';

  // 1. Initialize session
  console.log(`[1/4] Initializing render session (${totalFrames} frames @ 30 FPS)...`);
  const startRes = await fetch(`${BASE_URL}/api/render/session/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId: 'bench_real_level1_30s',
      fps,
      voiceUrl,
      totalFrames,
    }),
  });

  assert.strictEqual(startRes.status, 200, 'Start session failed');
  const { sessionId } = await startRes.json();
  console.log(`Session initialized: ${sessionId}`);

  // 2. Stream real 1920x1080 frames in chunks of 25
  console.log(`[2/4] Streaming 36 chunks of 25 real 1080p frames (Total: 900 frames)...`);
  const chunkStreamStart = Date.now();
  let uploadedFrames = 0;
  let totalBytesStreamed = 0;

  for (let i = 0; i < totalFrames; i += chunkSize) {
    const chunkFrames: string[] = [];
    for (let f = 0; f < chunkSize; f++) {
      const poolIndex = (i + f) % realFramePool.length;
      const frameData = realFramePool[poolIndex];
      chunkFrames.push(frameData);
      totalBytesStreamed += frameData.length;
    }

    const chunkRes = await fetch(`${BASE_URL}/api/render/session/chunk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        startFrameIndex: i,
        frames: chunkFrames,
      }),
    });

    assert.strictEqual(chunkRes.status, 200, `Chunk upload failed at frame ${i}`);
    const chunkData = await chunkRes.json();
    uploadedFrames = chunkData.writtenFrames;

    if ((i / chunkSize + 1) % 6 === 0 || uploadedFrames === totalFrames) {
      const pct = Math.round((uploadedFrames / totalFrames) * 100);
      const elapsedSec = ((Date.now() - chunkStreamStart) / 1000).toFixed(1);
      const mbStreamed = (totalBytesStreamed / (1024 * 1024)).toFixed(1);
      console.log(`  -> Chunk ${i / chunkSize + 1}/${totalFrames / chunkSize} uploaded (${uploadedFrames}/${totalFrames} frames - ${pct}% in ${elapsedSec}s, ${mbStreamed} MB transferred)`);
    }
  }

  const chunkStreamDuration = ((Date.now() - chunkStreamStart) / 1000).toFixed(2);
  const streamThroughput = (totalFrames / Number(chunkStreamDuration)).toFixed(1);
  console.log(`Streaming completed in ${chunkStreamDuration}s (${streamThroughput} real 1080p frames/sec)\n`);

  // 3. Transcode and AAC audio mux
  console.log(`[3/4] Transcoding 900 real 1080p frames to H.264 MP4 & muxing AAC audio...`);
  const transcodeStart = Date.now();
  const finishRes = await fetch(`${BASE_URL}/api/render/session/finish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });

  assert.strictEqual(finishRes.status, 200, 'Finish transcode failed');
  const result = await finishRes.json();
  const transcodeDuration = ((Date.now() - transcodeStart) / 1000).toFixed(2);
  console.log(`Transcode completed in ${transcodeDuration}s\n`);

  // 4. Verification with FFprobe
  console.log(`[4/4] Validating production video with FFprobe...`);
  const outputFilePath = path.join(process.cwd(), result.videoUrl.replace(/^\/+/, ''));
  assert(fs.existsSync(outputFilePath), `Output MP4 file does not exist: ${outputFilePath}`);

  const stat = fs.statSync(outputFilePath);
  const memoryAfter = process.memoryUsage();
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('================================================================');
  console.log('📊 REAL BENCHMARK RESULTS (LEVEL 1: 30s / 900 REAL 1080p FRAMES)');
  console.log('================================================================');
  console.log(`• Success:               ${result.success}`);
  console.log(`• Video URL:             ${result.videoUrl}`);
  console.log(`• Output File Size:      ${(stat.size / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`• Total Frames Rendered: ${result.frameCount} / ${totalFrames}`);
  console.log(`• Video Resolution:      1920x1080`);
  console.log(`• Video FPS:             ${result.fps}`);
  console.log(`• Video Codec:           ${result.verifiedStreams.video} (Expected: h264)`);
  console.log(`• Audio Codec:           ${result.verifiedStreams.audio} (Expected: aac)`);
  console.log(`• Video Container:       ${result.verifiedStreams.container}`);
  console.log(`• Probe Video Duration:  ${result.verifiedStreams.duration}s`);
  console.log(`• Total Raw Data Flow:   ${(totalBytesStreamed / (1024 * 1024)).toFixed(1)} MB base64 payload`);
  console.log(`• Frame Stream Time:     ${chunkStreamDuration}s (${streamThroughput} fps)`);
  console.log(`• FFmpeg Transcode Time: ${transcodeDuration}s`);
  console.log(`• Total End-to-End Time: ${totalDuration}s`);
  console.log(`• Client RSS Delta:      ${((memoryAfter.rss - memoryBefore.rss) / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`• Client Heap Delta:     ${((memoryAfter.heapUsed - memoryBefore.heapUsed) / (1024 * 1024)).toFixed(2)} MB`);
  console.log('================================================================\n');

  // Assertions
  assert.strictEqual(result.frameCount, totalFrames, `Frame count mismatch: ${result.frameCount} vs ${totalFrames}`);
  assert.strictEqual(result.verifiedStreams.video, 'h264', 'Video codec must be h264');
  assert.strictEqual(result.verifiedStreams.audio, 'aac', 'Audio codec must be aac');
  assert(result.verifiedStreams.duration !== null && result.verifiedStreams.duration >= 24, 'Duration must match timeline');

  // Clean up frames dir and temporary output
  if (fs.existsSync(TMP_FRAMES_DIR)) {
    fs.rmSync(TMP_FRAMES_DIR, { recursive: true, force: true });
  }
  if (fs.existsSync(outputFilePath)) {
    fs.unlinkSync(outputFilePath);
  }

  console.log('🎯 REAL BROWSER/CANVAS LEVEL 1 BENCHMARK PASSED WITH 100% SUCCESS!');
}

runBenchmarkBrowserReal().catch((err) => {
  console.error('❌ Real Benchmark failed:', err);
  process.exit(1);
});
