import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// CI-safe deterministic smoke test. A real provider smoke test can be enabled explicitly.
process.env.IMAGE_FALLBACK_ENABLED = '1';
if (!process.env.REAL_API_TESTS) delete process.env.GEMINI_API_KEY;

const { generateAsset } = await import('../server/assetEngine.ts');

const result = await generateAsset({
  prompt: 'A historical documentary archival photograph of a 1960s newsroom, monochrome, paper collage source, no text',
  topic: 'Image Pipeline Smoke Test',
  shotId: 'test_shot',
  assetId: `image_smoke_${Date.now()}`,
  layout: 'hero_archive',
});

assert.equal(result.success, true);
assert.match(result.url, /^\/outputs\/assets\/.+\.png$/);
assert.equal(typeof result.provider, 'string');
assert.equal(typeof result.usedFallback, 'boolean');

const filePath = path.join(process.cwd(), result.url.replace(/^\//, ''));
assert.equal(fs.existsSync(filePath), true, `Generated image does not exist: ${filePath}`);
assert.ok(fs.statSync(filePath).size > 100, 'Generated image is unexpectedly empty');

if (process.env.CLEAN_IMAGE_SMOKE !== '0') {
  try { fs.unlinkSync(filePath); } catch {}
}

console.log(`Image pipeline smoke test: PASS (${result.provider})`);
