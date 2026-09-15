import assert from 'node:assert/strict';
import { ensureCompositionAssets, getCompositionRecipe, validateComposition, inferMotion } from '../src/visualDirector/PhysicalCollage.ts';
import { Shot } from '../src/types.ts';

const baseShot = (layout: Shot['layout']): Shot => ({
  shot_id: 'shot_test', order: 1, start: 0, end: 5, duration: 5,
  narration: 'A documentary test shot.', visual_idea: 'Archival evidence about the test subject.',
  layout, visualStyle: 'classic_vox', styleVariant: 'default',
  background: { type: 'newsprint' }, assets: [], text: [], graphics: []
});

{
  const shot = ensureCompositionAssets(baseShot('photo_stack'));
  assert.equal(shot.assets.length, 3);
  assert.equal(shot.assets.every(a => a.motion === 'photo_stack'), true);
  assert.equal(validateComposition(shot).length, 0);
  assert.equal(getCompositionRecipe('photo_stack').minAssets, 3);
}

{
  const shot = ensureCompositionAssets(baseShot('collage_board'));
  assert.equal(shot.assets.length, 4);
  assert.equal(shot.assets[0].role, 'hero');
  assert.equal(validateComposition(shot).length, 0);
}

{
  const shot = ensureCompositionAssets(baseShot('split_screen'));
  assert.equal(shot.assets.length, 2);
  assert.equal(validateComposition(shot).length, 0);
}

assert.equal(inferMotion('photo_stack'), 'photo_stack');
assert.equal(inferMotion('timeline', 0), 'paper_slide_right');
assert.equal(inferMotion('timeline', 1), 'paper_slide_left');
console.log('physical-collage.test.ts passed');
