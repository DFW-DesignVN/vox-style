import { Shot } from '../types.ts';
import { calculateMotionTransform } from './motionEngine.ts';
import { drawAgedPaperBackground, drawMaskingTape, drawArchivalStamp, drawRedString, drawRedMarkerArrow } from './paperAssets.ts';
import { getCachedImage, getOrLoadDecodedImage, getHalftonePatternCanvas } from './assetCache.ts';
import { getClientVisualTheme } from '../visualDirector/StyleVisualTheme.ts';

export { getCachedImage };

export async function preloadShotImages(shot: Shot): Promise<void> {
  await Promise.all(shot.assets.filter(a => a.source).map(a => getOrLoadDecodedImage(a.source)));
}

function roundRect(ctx: CanvasRenderingContext2D, x:number, y:number, w:number, h:number, r:number) {
  if (r <= 0) { ctx.rect(x,y,w,h); return; }
  ctx.roundRect(x,y,w,h,r);
}

function fillPanel(ctx:CanvasRenderingContext2D, theme:ReturnType<typeof getClientVisualTheme>, x:number,y:number,w:number,h:number) {
  ctx.fillStyle=theme.panel;
  ctx.beginPath(); roundRect(ctx,x,y,w,h,theme.radius); ctx.fill();
  ctx.strokeStyle=theme.accent; ctx.globalAlpha=.45; ctx.lineWidth=theme.frame==='blueprint'?2:1.5;
  ctx.beginPath(); roundRect(ctx,x,y,w,h,theme.radius); ctx.stroke(); ctx.globalAlpha=1;
}

function drawBackground(ctx:CanvasRenderingContext2D, shot:Shot, width:number,height:number, theme:ReturnType<typeof getClientVisualTheme>) {
  const style=shot.visualStyle||'classic_vox';
  ctx.fillStyle=theme.bg; ctx.fillRect(0,0,width,height);
  if(['classic_vox','investigative','newspaper','case_file','evidence_board','mixed_media'].includes(style)) drawAgedPaperBackground(ctx,width,height,shot.background.type);
  if(['map_intelligence','geopolitical'].includes(style)) {
    ctx.save();ctx.globalAlpha=.12;ctx.strokeStyle=theme.ink;ctx.lineWidth=1;
    for(let x=-width;x<width*2;x+=100){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+height*.45,height);ctx.stroke();}
    for(let y=0;y<height;y+=80){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y+20);ctx.stroke();}
    ctx.restore();
  }
  if(style==='blueprint') {
    ctx.save();ctx.strokeStyle='rgba(220,240,255,.18)';ctx.lineWidth=1;
    for(let x=0;x<width;x+=48){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,height);ctx.stroke();}
    for(let y=0;y<height;y+=48){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke();}
    ctx.restore();
  }
  if(['data_documentary','financial_terminal','cyber_intelligence','scientific_lab'].includes(style)) {
    ctx.save();ctx.strokeStyle=theme.ink;ctx.globalAlpha=.065;ctx.lineWidth=1;
    for(let x=50;x<width;x+=120){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,height);ctx.stroke();}
    for(let y=50;y<height;y+=90){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke();}
    ctx.restore();
  }
  if(style==='minimal_cinematic'){ctx.fillStyle='#080808';ctx.fillRect(0,0,width,height);}
}

function drawFrameDecoration(ctx:CanvasRenderingContext2D, style:string, theme:ReturnType<typeof getClientVisualTheme>, x:number,y:number,w:number,h:number) {
  if(theme.shadow){ctx.save();ctx.shadowColor='rgba(0,0,0,.28)';ctx.shadowBlur=style==='minimal_cinematic'?28:16;ctx.shadowOffsetX=7;ctx.shadowOffsetY=9;ctx.fillStyle=theme.panel;ctx.beginPath();roundRect(ctx,x,y,w,h,theme.radius);ctx.fill();ctx.restore();}
  if(style==='newspaper') {
    ctx.save();ctx.strokeStyle='rgba(20,20,20,.25)';ctx.lineWidth=1;
    for(let i=1;i<4;i++){ctx.beginPath();ctx.moveTo(x+w*i/4,y+10);ctx.lineTo(x+w*i/4,y+h-10);ctx.stroke();}
    ctx.restore();
  }
  if(style==='blueprint') {ctx.save();ctx.setLineDash([8,6]);ctx.strokeStyle=theme.secondary;ctx.globalAlpha=.45;ctx.strokeRect(x+12,y+12,w-24,h-24);ctx.restore();}
  if(style==='financial_terminal'||style==='cyber_intelligence'){ctx.fillStyle=theme.accent;ctx.globalAlpha=.75;ctx.fillRect(x,y,5,h);ctx.globalAlpha=1;}
}

function drawHeaderOverlay(ctx:CanvasRenderingContext2D, shot:Shot, theme:ReturnType<typeof getClientVisualTheme>, width:number,height:number,time:number) {
  const style=shot.visualStyle||'classic_vox';
  ctx.save();
  if(['financial_terminal','cyber_intelligence'].includes(style)) {
    ctx.fillStyle=theme.secondary;ctx.font='14px monospace';ctx.fillText(style==='financial_terminal'?'MARKET / LIVE BRIEF':'INTELLIGENCE / SIGNAL',40,40);
    ctx.fillStyle=theme.accent;ctx.fillRect(40,52,180,3);
    ctx.fillStyle=theme.muted;ctx.font='11px monospace';ctx.fillText(`FRAME ${Math.floor(time*30).toString().padStart(6,'0')}`,width-150,40);
  }
  if(['map_intelligence','geopolitical'].includes(style)) {
    ctx.fillStyle=theme.ink;ctx.font='bold 12px monospace';ctx.fillText('FIELD BRIEFING',42,40);
    ctx.fillStyle=theme.accent;ctx.fillRect(42,50,155,3);
  }
  if(style==='timeline') {
    ctx.strokeStyle=theme.accent;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(80,height-76);ctx.lineTo(width-80,height-76);ctx.stroke();
    ctx.fillStyle=theme.ink;ctx.font='bold 13px sans-serif';ctx.fillText('CHRONOLOGY',80,height-96);
  }
  if(style==='blueprint') {
    ctx.strokeStyle=theme.secondary;ctx.lineWidth=2;ctx.strokeRect(width-250,38,190,88);
    ctx.fillStyle=theme.ink;ctx.font='11px monospace';ctx.fillText('TECHNICAL PLATE',width-230,64);ctx.fillText('SCALE 1:100',width-230,86);ctx.fillText(`DOC / ${shot.order.toString().padStart(2,'0')}`,width-230,108);
  }
  if(['case_file','evidence_board'].includes(style)) {
    ctx.fillStyle=theme.accent;ctx.font='bold 13px monospace';ctx.fillText(`EXHIBIT ${shot.order.toString().padStart(2,'0')}`,40,40);
  }
  if(style==='minimal_cinematic') {ctx.strokeStyle=theme.accent;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(70,height-80);ctx.lineTo(220,height-80);ctx.stroke();}
  if(theme.vignette){const g=ctx.createRadialGradient(width/2,height/2,width*.22,width/2,height/2,width*.78);g.addColorStop(0,'transparent');g.addColorStop(1,'rgba(0,0,0,.45)');ctx.fillStyle=g;ctx.fillRect(0,0,width,height);}
  ctx.restore();
}

export function renderShotFrame(ctx: CanvasRenderingContext2D, shot: Shot, shotTime: number, width:number=1920, height:number=1080) {
  const style=shot.visualStyle||'classic_vox';
  const theme=getClientVisualTheme(style,shot.styleVariant);
  ctx.clearRect(0,0,width,height);
  drawBackground(ctx,shot,width,height,theme);

  for(const asset of shot.assets){
    if(shotTime<asset.start) continue;
    const tr=calculateMotionTransform(asset.motion,shotTime,asset.start); if(tr.opacity<=0) continue;
    ctx.save();ctx.globalAlpha=tr.opacity;
    const px=asset.position.x/100*width+tr.offsetX, py=asset.position.y/100*height+tr.offsetY;
    ctx.translate(px,py);ctx.rotate((asset.rotation+tr.rotation)*Math.PI/180);ctx.scale(asset.scale*tr.scale,asset.scale*tr.scale);
    const hero=asset.role==='hero';
    let itemW=hero?620:420,itemH=hero?440:310;
    if(['minimal_cinematic','photo_essay'].includes(style)){itemW=hero?980:520;itemH=hero?620:360;}
    if(style==='split_screen'){itemW=hero?700:500;itemH=hero?500:350;}
    if(['data_documentary','financial_terminal','cyber_intelligence'].includes(style)){itemW=hero?560:360;itemH=hero?400:250;}
    const x=-itemW/2,y=-itemH/2,pad=style==='minimal_cinematic'||style==='photo_essay'?8:14;
    drawFrameDecoration(ctx,style,theme,x,y,itemW,itemH);fillPanel(ctx,theme,x,y,itemW,itemH);
    const img=getCachedImage(asset.source), iw=itemW-pad*2, ih=itemH-pad*2;
    if(img&&img.complete&&img.naturalWidth>0){
      ctx.save();ctx.beginPath();roundRect(ctx,x+pad,y+pad,iw,ih,Math.max(0,theme.radius-6));ctx.clip();ctx.filter=theme.imageFilter;
      const ia=img.naturalWidth/img.naturalHeight,ba=iw/ih;let dw=iw,dh=ih,ox=x+pad,oy=y+pad;
      if(ia>ba){dw=ih*ia;ox-=(dw-iw)/2;}else{dh=iw/ia;oy-=(dh-ih)/2;}
      ctx.drawImage(img,ox,oy,dw,dh);
      if(theme.halftone){ctx.filter='none';ctx.globalAlpha=.2;ctx.drawImage(getHalftonePatternCanvas(iw,ih),x+pad,y+pad);}
      ctx.restore();
    } else {
      ctx.fillStyle=theme.panel;ctx.globalAlpha=.92;ctx.fillRect(x+pad,y+pad,iw,ih);ctx.globalAlpha=1;ctx.fillStyle=theme.muted;ctx.font='bold 14px monospace';ctx.textAlign='center';ctx.fillText(asset.status==='generating'?'GENERATING ASSET':'ASSET PENDING',0,0);
    }
    if(style==='newspaper'){ctx.fillStyle=theme.ink;ctx.font='bold 15px Georgia';ctx.textAlign='left';ctx.fillText('ARCHIVE / REPORT',x+18,y+itemH-18);}
    if(['case_file','evidence_board'].includes(style)) drawArchivalStamp(ctx,'EXHIBIT',x+itemW-65,y+42,-8,theme.accent);
    if(['modern_editorial','photo_essay'].includes(style)){ctx.fillStyle=theme.ink;ctx.font='13px sans-serif';ctx.textAlign='left';ctx.fillText(asset.role.toUpperCase(),x+18,y+itemH-18);}
    ctx.restore();
  }

  for(const g of shot.graphics){
    if(shotTime<g.start) continue;const tr=calculateMotionTransform(g.motion,shotTime,g.start);if(tr.opacity<=0)continue;
    const gx=g.position?g.position.x/100*width:width/2,gy=g.position?g.position.y/100*height:height/2,color=g.color||theme.accent;
    if(g.type==='tape')drawMaskingTape(ctx,gx,gy,g.scale?g.scale*140:140,g.rotation||-12);
    else if(g.type==='stamp')drawArchivalStamp(ctx,'CONFIDENTIAL',gx,gy,g.rotation||-8,color);
    else if(g.type==='arrow'){const a=g.points?.[0]||[30,70],b=g.points?.[1]||[50,45];drawRedMarkerArrow(ctx,a[0]/100*width,a[1]/100*height,b[0]/100*width,b[1]/100*height,tr.progress,color);}
    else if(g.type==='red_string'){const a=g.points?.[0]||[25,30],b=g.points?.[1]||[75,60];drawRedString(ctx,a[0]/100*width,a[1]/100*height,b[0]/100*width,b[1]/100*height,tr.progress);}
    else if(g.type==='circle'){ctx.save();ctx.strokeStyle=color;ctx.lineWidth=4;ctx.beginPath();ctx.arc(gx,gy,(g.scale||1)*70,-Math.PI/2,-Math.PI/2+Math.PI*2*tr.progress);ctx.stroke();ctx.restore();}
    else if(g.type==='underline'){ctx.save();ctx.strokeStyle=color;ctx.lineWidth=6;ctx.lineCap='round';const len=260*tr.progress;ctx.beginPath();ctx.moveTo(gx-len/2,gy);ctx.lineTo(gx+len/2,gy+2);ctx.stroke();ctx.restore();}
    else if(g.type==='pin'){ctx.save();ctx.fillStyle=color;ctx.beginPath();ctx.arc(gx,gy,10,0,Math.PI*2);ctx.fill();ctx.restore();}
    else if(g.type==='timeline_line'){ctx.save();ctx.strokeStyle=color;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(80,gy);ctx.lineTo(width-80,gy);ctx.stroke();ctx.restore();}
  }

  for(const t of shot.text){
    if(shotTime<t.start)continue;const tr=calculateMotionTransform(t.motion,shotTime,t.start,t.content.length);if(tr.opacity<=0)continue;
    ctx.save();const tx=t.position.x/100*width+tr.offsetX,ty=t.position.y/100*height+tr.offsetY;ctx.translate(tx,ty);ctx.rotate((t.rotation||0)*Math.PI/180);ctx.scale(tr.scale,tr.scale);
    let content=t.content;if(t.motion==='typewriter'){const chars=tr.revealedChars??content.length;content=content.substring(0,chars)+(chars<content.length&&Math.floor(shotTime*5)%2===0?'█':'');}
    const dark=['financial_terminal','cyber_intelligence','blueprint','minimal_cinematic'].includes(style);
    if(t.role==='big_number'){
      ctx.font=`900 ${t.fontSize||130}px "Oswald",Arial,sans-serif`;ctx.fillStyle=t.color||theme.accent;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(content,0,0);
    } else if(t.role==='headline'){
      const fs=t.fontSize||64;ctx.font=`800 ${fs}px "Oswald","Arial Narrow",sans-serif`;ctx.textAlign=Math.abs(t.position.x-50)<5?'center':'left';ctx.textBaseline='alphabetic';
      const max=style==='minimal_cinematic'?900:560,words=content.split(' ');const lines:string[]=[];let line='';for(const word of words){const test=line?line+' '+word:word;if(ctx.measureText(test).width>max&&line){lines.push(line);line=word;}else line=test;}if(line)lines.push(line);
      lines.forEach((ln,i)=>{const yy=i*fs*1.1,m=ctx.measureText(ln),xx=ctx.textAlign==='center'?0:0;if(['classic_vox','investigative','newspaper','case_file'].includes(style)){ctx.fillStyle=t.highlightColor||theme.ink;ctx.fillRect((ctx.textAlign==='center'?-m.width/2:0)-12,yy-fs*.85,m.width+24,fs*1.05);ctx.fillStyle=t.highlightColor?'#111':theme.panel;}else{ctx.fillStyle=t.color||(dark?theme.ink:theme.ink);}ctx.fillText(ln,xx,yy);});
    } else if(t.role==='date'||t.role==='label'){
      const fs=t.fontSize||30;ctx.font=`700 ${fs}px ${style==='archive_museum'?'Georgia':'monospace'}`;const m=ctx.measureText(content);ctx.fillStyle=t.highlightColor||theme.panel;ctx.fillRect(-8,-fs*.9,m.width+16,fs*1.15);ctx.fillStyle=t.color||theme.ink;ctx.textAlign='left';ctx.fillText(content,0,0);
    } else {ctx.font=`600 ${t.fontSize||34}px sans-serif`;ctx.fillStyle=t.color||theme.ink;ctx.textAlign='left';ctx.fillText(content,0,0);}
    ctx.restore();
  }
  drawHeaderOverlay(ctx,shot,theme,width,height,shotTime);
}
