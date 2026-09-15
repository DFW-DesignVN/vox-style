import { Project, QualityGateResult } from '../types.ts';

const SAFE_MIN = 6;
const SAFE_MAX = 94;
type Box = { left:number; top:number; right:number; bottom:number };
function overlapRatio(a:Box,b:Box){const w=Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left));const h=Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));const inter=w*h;const aArea=Math.max(1,(a.right-a.left)*(a.bottom-a.top));const bArea=Math.max(1,(b.right-b.left)*(b.bottom-b.top));return inter/Math.min(aArea,bArea);}

function detectLayoutCollisions(project: Project): string[] {
  const issues:string[]=[];
  for(const shot of project.shots){
    const imageBoxes:Box[]=(shot.assets||[]).filter(a=>a.type==='image'&&a.source).map(a=>{const w=a.role==='hero'?32:22;const h=a.role==='hero'?41:29;return{left:a.position.x-w/2,right:a.position.x+w/2,top:a.position.y-h/2,bottom:a.position.y+h/2};});
    const textBoxes:Box[]=(shot.text||[]).map(t=>{const size=Math.max(18,Number(t.fontSize)||36);const chars=Math.min(32,Math.max(6,String(t.content||'').length));const w=Math.min(42,Math.max(8,(chars*size/1920)*100));const h=Math.min(18,Math.max(4,(size/1080)*100*1.5));return{left:t.position.x,right:t.position.x+w,top:t.position.y-h,bottom:t.position.y};});
    for(const ib of imageBoxes){for(const tb of textBoxes){if(overlapRatio(ib,tb)>.65){issues.push(`${shot.shot_id}: text/ảnh chồng lấn nghiêm trọng`);break;}}if(issues.length>=6)break;}
    if(issues.length<6)for(let i=0;i<imageBoxes.length;i++){for(let j=i+1;j<imageBoxes.length;j++){if(overlapRatio(imageBoxes[i],imageBoxes[j])>.45){issues.push(`${shot.shot_id}: hai lớp ảnh chồng lấn nghiêm trọng`);break;}}if(issues.length>=6)break;}
    if(issues.length>=6)break;
  }
  return issues;
}

export function runQualityGate(project: Project, ffmpegAvailable: boolean): QualityGateResult {
  const messages:string[]=[];
  const scriptValid=typeof project.script==='string'&&project.script.trim().length>=15;
  if(!scriptValid)messages.push('Kịch bản quá ngắn (cần tối thiểu 15 ký tự).');
  const shots=[...project.shots].sort((a,b)=>a.start-b.start);
  const allShotsHaveAssets=shots.length>0&&shots.every(s=>Array.isArray(s.assets)&&s.assets.length>0);
  if(!allShotsHaveAssets)messages.push('Mỗi phân cảnh cần có ít nhất một hình ảnh tư liệu.');
  const unresolvedAssets=shots.flatMap(s=>(s.assets||[]).filter(a=>a.type==='image'&&(a.status==='failed'||(!a.source&&a.status!=='ready'))).map(a=>`${s.shot_id}/${a.id}`));
  const assetsResolved=unresolvedAssets.length===0&&allShotsHaveAssets;
  if(unresolvedAssets.length)messages.push(`Một số hình ảnh tư liệu chưa sẵn sàng: ${unresolvedAssets.slice(0,4).join(', ')}${unresolvedAssets.length>4?'…':''}`);
  const textWithinSafeArea=shots.every(s=>(s.text||[]).every(t=>t.position.x>=SAFE_MIN&&t.position.x<=SAFE_MAX&&t.position.y>=SAFE_MIN&&t.position.y<=SAFE_MAX));
  if(!textWithinSafeArea)messages.push('Một số tiêu đề đang nằm sát mép màn hình ngoài vùng an toàn (safe area).');
  const collisionIssues=detectLayoutCollisions(project);
  if(collisionIssues.length)messages.push(`Phát hiện layout có nguy cơ chồng lớp: ${collisionIssues.slice(0,3).join(' · ')}`);
  let timelineContinuous=shots.length>0;let cursor=0;
  for(const shot of shots){const start=Number(shot.start.toFixed(3));const end=Number(shot.end.toFixed(3));const duration=Number(shot.duration.toFixed(3));if(start<0||end<=start||Math.abs(end-start-duration)>.3)timelineContinuous=false;if(Math.abs(start-cursor)>.3)timelineContinuous=false;cursor=end;}
  if(Math.abs(cursor-project.duration)>.4)timelineContinuous=false;
  if(!timelineContinuous)messages.push('Timeline phân cảnh không liên tục hoặc không khớp tổng thời lượng.');
  const voiceValid=Boolean(project.voiceUrl&&project.voiceDuration&&project.voiceDuration>0);
  if(project.voiceover&&!voiceValid)messages.push('Chưa có giọng đọc thuyết minh cho video Final.');
  if(!ffmpegAvailable)messages.push('Máy chủ chưa cài đặt FFmpeg.');
  const readyToRender=scriptValid&&assetsResolved&&textWithinSafeArea&&timelineContinuous&&collisionIssues.length===0&&ffmpegAvailable&&(!project.voiceover||voiceValid);
  return{scriptValid,voiceValid,allShotsHaveAssets:assetsResolved,textWithinSafeArea,timelineContinuous,ffmpegAvailable,readyToRender,messages};
}
