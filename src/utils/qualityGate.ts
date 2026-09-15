import { Project, QualityGateResult } from '../types.ts';
const SAFE_MIN = 8;
const SAFE_MAX = 92;
function isLocalAssetSource(source: string): boolean { return source.startsWith('/outputs/') || source.startsWith('data:image/'); }
export function runQualityGate(project: Project, ffmpegAvailable: boolean): QualityGateResult {
  const messages:string[]=[];
  const scriptValid=project.script.trim().length>=30;
  if(!scriptValid)messages.push('Script is too short (must be at least 30 characters).');
  const shots=[...project.shots].sort((a,b)=>a.start-b.start);
  const allShotsHaveAssets=shots.length>0&&shots.every(s=>s.assets.length>0);
  if(!allShotsHaveAssets)messages.push('Every shot must contain at least one visual asset.');
  const unresolvedAssets=shots.flatMap(s=>s.assets.filter(a=>a.type==='image'&&(!a.source||a.status!=='ready')).map(a=>`${s.shot_id}/${a.id}`));
  const remoteAssets=shots.flatMap(s=>s.assets.filter(a=>a.type==='image'&&a.source&&!isLocalAssetSource(a.source)).map(a=>`${s.shot_id}/${a.id}`));
  const assetsResolved=unresolvedAssets.length===0&&remoteAssets.length===0&&allShotsHaveAssets;
  if(unresolvedAssets.length)messages.push(`Visual assets are not ready: ${unresolvedAssets.slice(0,5).join(', ')}${unresolvedAssets.length>5?'…':''}`);
  if(remoteAssets.length)messages.push(`External image URLs are blocked for final render: ${remoteAssets.slice(0,5).join(', ')}${remoteAssets.length>5?'…':''}. Generate or upload local assets first.`);
  const textWithinSafeArea=shots.every(s=>s.text.every(t=>t.position.x>=SAFE_MIN&&t.position.x<=SAFE_MAX&&t.position.y>=SAFE_MIN&&t.position.y<=SAFE_MAX));
  if(!textWithinSafeArea)messages.push('One or more text elements are outside the 8–92% safe area.');
  let timelineContinuous=shots.length>0,cursor=0;
  for(const shot of shots){const start=Number(shot.start.toFixed(3)),end=Number(shot.end.toFixed(3)),duration=Number(shot.duration.toFixed(3));if(start<0||end<=start||Math.abs(end-start-duration)>0.12)timelineContinuous=false;if(Math.abs(start-cursor)>0.12)timelineContinuous=false;cursor=end;}
  if(Math.abs(cursor-project.duration)>0.2)timelineContinuous=false;
  if(!timelineContinuous)messages.push('Shot timeline has gaps, overlaps, or does not match project duration.');
  const voiceValid = Boolean(project.voiceUrl && project.voiceDuration);
  if (!voiceValid && project.voiceover) {
    messages.push('Notice: Voice track not generated yet. Final MP4 will be silent until Voice & Beats are generated.');
  }
  const readyToRender = scriptValid && assetsResolved && textWithinSafeArea && timelineContinuous && ffmpegAvailable;
  if (!ffmpegAvailable) messages.push('FFmpeg is not available.');
  return { scriptValid, voiceValid, allShotsHaveAssets: assetsResolved, textWithinSafeArea, timelineContinuous, ffmpegAvailable, readyToRender, messages };
}
