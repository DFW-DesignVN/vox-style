import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs';

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
const DUMMY_JPEG = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

async function runTests() {
  console.log('🚀 Starting Vox Pipeline Automated Test Suite...');
  console.log(`Target server: ${BASE_URL}\n`);

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    process.stdout.write(`• ${name}... `);
    try {
      await fn();
      console.log('✅ PASS');
      passed++;
    } catch (err: any) {
      console.log('❌ FAIL');
      console.error('  Error:', err.message);
      failed++;
    }
  }

  // 1. Health check
  await test('Backend Healthcheck (/api/health)', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'ok');
  });

  // 2. Path Traversal & Security Violations
  await test('Audio Security: Reject /etc/passwd path traversal', async () => {
    const res = await fetch(`${BASE_URL}/api/render-final-video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: 'sec_test_1',
        shotFrames: [DUMMY_JPEG],
        fps: 5,
        voiceUrl: '/etc/passwd',
      }),
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert(data.error.includes('Security violation'), `Expected security violation, got: ${data.error}`);
  });

  await test('Audio Security: Reject sibling folder prefix attack (outputs_evil)', async () => {
    const res = await fetch(`${BASE_URL}/api/render-final-video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: 'sec_test_2',
        shotFrames: [DUMMY_JPEG],
        fps: 5,
        voiceUrl: '/outputs_evil/hack.mp3',
      }),
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert(data.error.includes('Security violation'), `Expected security violation, got: ${data.error}`);
  });

  await test('Audio Security: Reject dot-dot traversal (outputs/../server.ts)', async () => {
    const res = await fetch(`${BASE_URL}/api/render-final-video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: 'sec_test_3',
        shotFrames: [DUMMY_JPEG],
        fps: 5,
        voiceUrl: '/outputs/../server.ts',
      }),
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert(data.error.includes('Security violation'), `Expected security violation, got: ${data.error}`);
  });

  // 3. Strict FFmpeg + FFprobe verification: Video H.264 + Audio AAC
  let renderedAudioMp4 = '';
  await test('Render Pipeline: 30 FPS with Audio Mux + Strict FFprobe (H.264 + AAC)', async () => {
    const res = await fetch(`${BASE_URL}/api/render-final-video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: 'test_render_audio',
        shotFrames: [DUMMY_JPEG, DUMMY_JPEG, DUMMY_JPEG],
        fps: 30,
        voiceUrl: '/outputs/audio/wall_street_demo.mp3',
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.hasAudio, true);
    assert.strictEqual(data.fps, 30);
    assert.strictEqual(data.verifiedStreams?.video, 'h264');
    assert.strictEqual(data.verifiedStreams?.audio, 'aac');
    assert.strictEqual(data.verifiedStreams?.strictVerified, true);
    renderedAudioMp4 = path.join(process.cwd(), data.videoUrl.replace(/^\/+/, ''));
    assert(fs.existsSync(renderedAudioMp4), `Rendered file not found: ${renderedAudioMp4}`);
  });

  // 4. Strict FFmpeg + FFprobe verification: Silent Video H.264
  let renderedSilentMp4 = '';
  await test('Render Pipeline: 20 FPS Draft Silent Video + Strict FFprobe (H.264 only)', async () => {
    const res = await fetch(`${BASE_URL}/api/render-final-video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: 'test_render_silent',
        shotFrames: [DUMMY_JPEG, DUMMY_JPEG],
        fps: 20,
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.hasAudio, false);
    assert.strictEqual(data.fps, 20);
    assert.strictEqual(data.verifiedStreams?.video, 'h264');
    assert.strictEqual(data.verifiedStreams?.audio, null);
    assert.strictEqual(data.verifiedStreams?.strictVerified, true);
    renderedSilentMp4 = path.join(process.cwd(), data.videoUrl.replace(/^\/+/, ''));
    assert(fs.existsSync(renderedSilentMp4), `Rendered file not found: ${renderedSilentMp4}`);
  });

  // 5. Scalable Chunked Session Render (supports 15m+ long documentary episodes without OOM)
  let renderedChunkedMp4 = '';
  await test('Scalable Render: Chunked Session Streaming + Audio Mux + Strict FFprobe', async () => {
    // A. Start Session
    const startRes = await fetch(`${BASE_URL}/api/render/session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: 'test_session_doc',
        fps: 30,
        voiceUrl: '/outputs/audio/wall_street_demo.mp3',
        totalFrames: 4,
      }),
    });
    assert.strictEqual(startRes.status, 200);
    const { sessionId } = await startRes.json();
    assert(sessionId, 'Session ID must be returned');

    // B. Upload Chunk 1 (Frames 0-1)
    const chunk1Res = await fetch(`${BASE_URL}/api/render/session/chunk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        startFrameIndex: 0,
        frames: [DUMMY_JPEG, DUMMY_JPEG],
      }),
    });
    assert.strictEqual(chunk1Res.status, 200);

    // C. Upload Chunk 2 (Frames 2-3)
    const chunk2Res = await fetch(`${BASE_URL}/api/render/session/chunk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        startFrameIndex: 2,
        frames: [DUMMY_JPEG, DUMMY_JPEG],
      }),
    });
    assert.strictEqual(chunk2Res.status, 200);

    // D. Finish and transcode with FFmpeg + strict FFprobe
    const finishRes = await fetch(`${BASE_URL}/api/render/session/finish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });
    assert.strictEqual(finishRes.status, 200);
    const finishData = await finishRes.json();
    assert.strictEqual(finishData.success, true);
    assert.strictEqual(finishData.hasAudio, true);
    assert.strictEqual(finishData.frameCount, 4);
    assert.strictEqual(finishData.verifiedStreams?.video, 'h264');
    assert.strictEqual(finishData.verifiedStreams?.audio, 'aac');
    assert.strictEqual(finishData.verifiedStreams?.strictVerified, true);
    renderedChunkedMp4 = path.join(process.cwd(), finishData.videoUrl.replace(/^\/+/, ''));
    assert(fs.existsSync(renderedChunkedMp4), `Rendered session file not found: ${renderedChunkedMp4}`);
  });

  // 6. Topic → Script → Storyboard Generation Test
  await test('AI Director: Topic to Script & Storyboard generation (/api/director/storyboard)', async () => {
    const res = await fetch(`${BASE_URL}/api/director/storyboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: 'The Fall of the Roman Empire',
        duration: 25,
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert(data.title, 'Project must have a title');
    assert(Array.isArray(data.shots) && data.shots.length > 0, 'Project must contain shots');
    assert(data.shots[0].narration, 'First shot must have narration');
    assert(data.shots[0].assets.length > 0, 'First shot must have assets');
  });

  // Cleanup test output files
  if (renderedAudioMp4 && fs.existsSync(renderedAudioMp4)) {
    fs.unlinkSync(renderedAudioMp4);
  }
  if (renderedSilentMp4 && fs.existsSync(renderedSilentMp4)) {
    fs.unlinkSync(renderedSilentMp4);
  }
  if (renderedChunkedMp4 && fs.existsSync(renderedChunkedMp4)) {
    fs.unlinkSync(renderedChunkedMp4);
  }

  console.log(`\n========================================`);
  console.log(`Tests: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
