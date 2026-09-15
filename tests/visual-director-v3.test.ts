import assert from 'node:assert/strict';
import { calculateMotionTransform } from '../src/utils/motionEngine.ts';
import { VOX_MOTIONS } from '../src/presets/index.ts';
import { VISUAL_STYLES } from '../src/visualDirector/StyleDirector.ts';
import { getVisualDirectorDiagnostics } from '../src/visualDirector/VisualDirectorDiagnostics.ts';

const physical=['paper_curl','paper_uncurl','paper_tear','tape_peel','photo_swing','photo_rotate','stack_shuffle','stamp_slam','camera_push','camera_pull','jitter'] as const;
for(const motion of physical){
 const a=calculateMotionTransform(motion,0.1,0);
 const b=calculateMotionTransform(motion,0.7,0);
 assert.ok(a.progress>=0&&a.progress<=1,`${motion} progress range`);
 assert.notDeepEqual(a,b,`${motion} should evolve over time`);
}
assert.ok(VISUAL_STYLES.length>=69,'style library should include legacy + 50 styles');
for(const motion of physical) assert.ok(VOX_MOTIONS.some(m=>m.id===motion),`${motion} registered`);
const project:any={shots:[
 {visualStyle:'paper_flip',layout:'document',assets:[{motion:'paper_flip'}]},
 {visualStyle:'photo_flip',layout:'photo_stack',assets:[{motion:'photo_flip'}]},
 {visualStyle:'paper_flip',layout:'document',assets:[{motion:'paper_curl'}]},
]};
const d=getVisualDirectorDiagnostics(project);
assert.ok(d.totalStyles>=69);
assert.ok(d.uniqueLayouts===2);
assert.ok(d.uniqueMotions===3);
assert.ok(d.warnings.includes('STYLE_LOCKED_TOO_LONG')===false);
console.log('visual-director-v3 tests passed');
