import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs';

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
const DUMMY_JPEG = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

async function runBenchmark2m() {
  console.log('====================================================');
  console.log('🏁 BENCHMARK LEVEL 2: 2 MINUTES RENDER STRESS TEST');
  console.log('Target: 3,600 frames @ 30 FPS (144 chunks of 25 frames)');
  console.log(`Server: ${BASE_URL}`);
  console.log('====================================================\n');

  const startTime = Date.now();
  const memoryBefore = process.memoryUsage();

  const totalFrames = 3600;
  const fps = 30;
  const chunkSize = 25;
  const voiceUrl = '/outputs/audio/wall_street_demo.mp3';

  console.log(`[1/4] Initializing render session (${totalFrames} frames)...`);
  const startRes = await fetch(`${BASE_URL}/api/render/session/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId: 'bench_level2_2m',
      fps,
      voiceUrl,
      totalFrames,
    }),
  });

  assert.strictEqual(startRes.status, 200, 'Start session failed');
  const { sessionId } = await startRes.json();
  console.log(`Session ID created: ${sessionId}`);

  // 2. Stream chunks (144 chunks of 25 frames)
  console.log(`[2/4] Streaming 144 chunks of 25 frames...`);
  const chunkStreamStart = Date.now();
  let uploadedFrames = 0;

  for (let i = 0; i < totalFrames; i += chunkSize) {
    const chunkFrames = new Array(chunkSize).fill(DUMMY_JPEG);
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

    if ((i / chunkSize + 1) % 24 === 0 || uploadedFrames === totalFrames) {
      const pct = Math.round((uploadedFrames / totalFrames) * 100);
      const elapsedSec = ((Date.now() - chunkStreamStart) / 1000).toFixed(1);
      console.log(`  -> Chunk ${i / chunkSize + 1}/${totalFrames / chunkSize} uploaded (${uploadedFrames}/${totalFrames} frames - ${pct}% in ${elapsedSec}s)`);
    }
  }

  const chunkStreamDuration = ((Date.now() - chunkStreamStart) / 1000).toFixed(2);
  console.log(`Streaming completed in ${chunkStreamDuration}s (${(totalFrames / Number(chunkStreamDuration)).toFixed(0)} frames/sec)`);

  // 3. Finish and Transcode with FFmpeg
  console.log(`[3/4] Transcoding 3,600 frames to 1080p H.264 & muxing AAC audio...`);
  const transcodeStart = Date.now();
  const finishRes = await fetch(`${BASE_URL}/api/render/session/finish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });

  assert.strictEqual(finishRes.status, 200, 'Finish transcode failed');
  const result = await finishRes.json();
  const transcodeDuration = ((Date.now() - transcodeStart) / 1000).toFixed(2);
  console.log(`Transcode completed in ${transcodeDuration}s`);

  // 4. Verification and Metrics Collection
  console.log(`[4/4] Validating output video with FFprobe...`);
  const outputFilePath = path.join(process.cwd(), result.videoUrl.replace(/^\/+/, ''));
  assert(fs.existsSync(outputFilePath), `Output MP4 file does not exist: ${outputFilePath}`);

  const stat = fs.statSync(outputFilePath);
  const memoryAfter = process.memoryUsage();
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n====================================================');
  console.log('📊 BENCHMARK RESULTS (LEVEL 2: 2m / 3,600 FRAMES)');
  console.log('====================================================');
  console.log(`• Success:               ${result.success}`);
  console.log(`• Video URL:             ${result.videoUrl}`);
  console.log(`• Output File Size:      ${(stat.size / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`• Total Frames Written:  ${result.frameCount} / ${totalFrames}`);
  console.log(`• Video FPS:             ${result.fps}`);
  console.log(`• Video Codec:           ${result.verifiedStreams.video} (Expected: h264)`);
  console.log(`• Audio Codec:           ${result.verifiedStreams.audio} (Expected: aac)`);
  console.log(`• Container:             ${result.verifiedStreams.container}`);
  console.log(`• Probe Video Duration:  ${result.verifiedStreams.duration}s`);
  console.log(`• Chunk Streaming Time:  ${chunkStreamDuration}s`);
  console.log(`• FFmpeg Transcode Time: ${transcodeDuration}s`);
  console.log(`• Total Pipeline Time:   ${totalDuration}s`);
  console.log(`• Client RSS Delta:      ${((memoryAfter.rss - memoryBefore.rss) / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`• Client Heap Delta:     ${((memoryAfter.heapUsed - memoryBefore.heapUsed) / (1024 * 1024)).toFixed(2)} MB`);
  console.log('====================================================\n');

  assert.strictEqual(result.frameCount, totalFrames, `Frame count mismatch: ${result.frameCount} vs ${totalFrames}`);
  assert.strictEqual(result.verifiedStreams.video, 'h264', 'Video codec must be h264');
  assert.strictEqual(result.verifiedStreams.audio, 'aac', 'Audio codec must be aac');
  assert(result.verifiedStreams.duration !== null && result.verifiedStreams.duration > 0, 'Duration must be positive');

  // Cleanup bench artifact
  if (fs.existsSync(outputFilePath)) {
    fs.unlinkSync(outputFilePath);
    console.log('🧹 Cleaned up temporary benchmark artifact.');
  }

  console.log('🎯 LEVEL 2 BENCHMARK PASSED 100%!');
}

runBenchmark2m().catch((err) => {
  console.error('❌ Benchmark error:', err);
  process.exit(1);
});
