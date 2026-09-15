import assert from 'node:assert/strict';
import { calculateMotionTransform } from '../src/utils/motionEngine.ts';
import { MotionID } from '../src/types.ts';

const motions:MotionID[]=['paper_drop','paper_slide_left','paper_slide_right','paper_slide_up','paper_slide_down','photo_stack','paper_reveal','typewriter','headline_pop','stamp_in','arrow_draw','string_draw'];
for(const motion of motions){
  const before=calculateMotionTransform(motion,0.1,0.2,20);
  const during=calculateMotionTransform(motion,0.35,0,20);
  const changed=before.offsetX!==during.offsetX||before.offsetY!==during.offsetY||before.scale!==during.scale||before.rotation!==during.rotation||before.opacity!==during.opacity||before.progress!==during.progress;
  assert.equal(changed,true,`Motion did not visibly change: ${motion}`);
}
console.log(`Motion transform test: PASS (${motions.length} motions)`);
