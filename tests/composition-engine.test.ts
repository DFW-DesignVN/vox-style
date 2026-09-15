import { getCompositionFrame, getPhysicalLayoutFrame } from '../src/visualDirector/CompositionEngine.ts';

const styles=['classic_vox','investigative','newspaper','timeline','map_intelligence','data_documentary','blueprint','case_file','archive_museum','modern_editorial','financial_terminal','cyber_intelligence','scientific_lab','geopolitical','minimal_cinematic','photo_essay','split_screen','evidence_board','mixed_media'];
for(const style of styles){for(let i=0;i<6;i++){const frame=getCompositionFrame(style,i,6,i===0?'hero':'secondary');if(![frame.x,frame.y,frame.w,frame.h].every(Number.isFinite))throw new Error(`Invalid frame: ${style}`);if(frame.w<=0||frame.h<=0)throw new Error(`Empty frame: ${style}`);if(frame.x<0||frame.x>100||frame.y<0||frame.y>100)throw new Error(`Out of bounds origin: ${style}`);if(frame.x+frame.w>101||frame.y+frame.h>101)throw new Error(`Out of bounds frame: ${style}`);}}
const left=getCompositionFrame('split_screen',0,2,'hero'),right=getCompositionFrame('split_screen',1,2,'hero');
if(left.split!=='left'||right.split!=='right')throw new Error('Split-screen grammar failed');
if(Math.abs((left.x+left.w/2)-(right.x+right.w/2))<20)throw new Error('Split panes are not separated');
const evidence=getCompositionFrame('evidence_board',0,6,'secondary');
if(!evidence.label?.startsWith('EXHIBIT'))throw new Error('Evidence-board grammar missing exhibit labels');
const physicalLayouts=['hero_archive','newspaper','map','photo_stack','document','big_number','timeline','collage_board','split_screen'] as const;
for(const layout of physicalLayouts){for(let i=0;i<6;i++){const f=getPhysicalLayoutFrame(layout,i,6,i===0?'hero':'secondary');if(![f.x,f.y,f.w,f.h].every(Number.isFinite)||f.w<=0||f.h<=0)throw new Error(`Invalid physical layout: ${layout}`);if(f.x<0||f.y<0||f.x+f.w>101||f.y+f.h>101)throw new Error(`Physical layout out of bounds: ${layout}`);}}
const splitA=getPhysicalLayoutFrame('split_screen',0,2,'hero');const splitB=getPhysicalLayoutFrame('split_screen',1,2,'secondary');
if(splitA.split!=='left'||splitB.split!=='right')throw new Error('Physical split-screen grammar failed');
console.log(`Composition grammar test: PASS (${styles.length} visual styles + ${physicalLayouts.length} physical layouts)`);
