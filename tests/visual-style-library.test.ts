import { VOX_50_VISUAL_STYLES, VOX_STYLE_CATEGORIES } from '../src/presets/visualStyles.ts';
import { calculateMotionTransform } from '../src/utils/motionEngine.ts';

if (VOX_50_VISUAL_STYLES.length !== 50) throw new Error(`Expected 50 visual styles, got ${VOX_50_VISUAL_STYLES.length}`);
if (VOX_STYLE_CATEGORIES.length !== 7) throw new Error(`Expected 7 style categories, got ${VOX_STYLE_CATEGORIES.length}`);
if (new Set(VOX_50_VISUAL_STYLES.map(s=>s.id)).size !== 50) throw new Error('Visual style IDs must be unique');
for (const style of VOX_50_VISUAL_STYLES) {
  if (!style.name || !style.englishName || !style.category || style.layouts.length===0 || style.motions.length===0) throw new Error(`Incomplete style: ${style.id}`);
}
for (const motion of ['paper_flip','paper_flip_vertical','photo_flip','card_flip'] as const) {
  const a = calculateMotionTransform(motion, 0.34, 0);
  const b = calculateMotionTransform(motion, 0.72, 0);
  if (a.opacity <= 0 || b.opacity <= 0) throw new Error(`Flip motion not visible: ${motion}`);
  if (a.scaleX === undefined && a.scaleY === undefined) throw new Error(`Flip motion lacks axis transform: ${motion}`);
  if (a.scaleX === b.scaleX && a.scaleY === b.scaleY) throw new Error(`Flip motion does not change geometry: ${motion}`);
}
console.log(`visual-style-library: ${VOX_50_VISUAL_STYLES.length} styles / ${VOX_STYLE_CATEGORIES.length} categories / physical flip regression OK`);
