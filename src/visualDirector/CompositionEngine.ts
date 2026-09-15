import { ClientVisualStyleId } from './StyleVisualTheme.ts';

export interface CompositionFrame {
  x:number;
  y:number;
  w:number;
  h:number;
  anchor:'center'|'left'|'right'|'top'|'bottom';
  panel:boolean;
  label?:string;
  split?:'left'|'right';
}

const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));

/** Deterministic, lightweight composition grammar. Coordinates are percentages of the 1920x1080 canvas. */
export function getCompositionFrame(style:string|undefined,index:number,count:number,role:'hero'|'secondary'|'background'|'detail'='secondary'):CompositionFrame{
  const s=(style||'classic_vox') as ClientVisualStyleId;
  const i=Math.max(0,index), n=Math.max(1,count);
  const even=i%2===0;
  const grid=(cols:number,rows:number,gap=2)=>{
    const col=i%cols,row=Math.floor(i/cols)%rows;
    const w=(100-gap*(cols+1))/cols,h=(100-gap*(rows+1))/rows;
    return {x:gap+col*(w+gap),y:gap+row*(h+gap),w,h};
  };

  switch(s){
    case 'classic_vox':
      return role==='hero'?{x:31,y:50,w:56,h:62,anchor:'center',panel:true}:{x:even?17:79,y:72,w:28,h:30,anchor:'center',panel:true};
    case 'investigative':
      return role==='hero'?{x:42,y:50,w:58,h:66,anchor:'center',panel:true}:{x:16+i*5,y:18+i*7,w:27,h:29,anchor:'center',panel:true};
    case 'newspaper': {
      const g=grid(2,2,3); return {x:g.x+g.w/2,y:g.y+g.h/2,w:g.w,h:g.h,anchor:'center',panel:true,label:`COLUMN ${i+1}`};
    }
    case 'timeline':
      return {x:14+i*Math.min(72/Math.max(1,n-1),24),y:38+(i%2?20:-4),w:30,h:40,anchor:'center',panel:true,label:`${String(i+1).padStart(2,'0')}`};
    case 'map_intelligence':
    case 'geopolitical':
      return role==='hero'?{x:50,y:52,w:76,h:64,anchor:'center',panel:false,label:s==='geopolitical'?'REGIONAL BRIEF':'MAP / SIGNAL'}:{x:78,y:76,w:30,h:24,anchor:'center',panel:true};
    case 'data_documentary':
      return role==='hero'?{x:34,y:51,w:58,h:54,anchor:'center',panel:true,label:'DATA'}:{x:76,y:52+(i%2)*28,w:25,h:22,anchor:'center',panel:true,label:'METRIC'};
    case 'blueprint':
      return role==='hero'?{x:50,y:52,w:70,h:62,anchor:'center',panel:false,label:'TECHNICAL PLATE'}:{x:82,y:75,w:25,h:25,anchor:'center',panel:true,label:'DETAIL'};
    case 'case_file':
      return role==='hero'?{x:50,y:52,w:55,h:67,anchor:'center',panel:true,label:'CASE FILE'}:{x:even?20:80,y:24+(i%3)*25,w:25,h:30,anchor:'center',panel:true,label:`EXHIBIT ${String(i+1).padStart(2,'0')}`};
    case 'archive_museum':
      return role==='hero'?{x:50,y:52,w:62,h:66,anchor:'center',panel:true,label:'EXHIBIT'}:{x:18+(i%4)*21,y:75,w:18,h:25,anchor:'center',panel:true};
    case 'modern_editorial':
      return role==='hero'?{x:58,y:50,w:62,h:70,anchor:'center',panel:false}:{x:17+(i%3)*23,y:76,w:20,h:24,anchor:'center',panel:true};
    case 'financial_terminal':
      return role==='hero'?{x:55,y:53,w:62,h:55,anchor:'center',panel:true,label:'PRIMARY'}:{x:15+(i%3)*29,y:82,w:25,h:17,anchor:'center',panel:true,label:'METRIC'};
    case 'cyber_intelligence':
      return role==='hero'?{x:50,y:50,w:58,h:58,anchor:'center',panel:true,label:'SIGNAL NODE'}:{x:16+(i%3)*33,y:78,w:26,h:20,anchor:'center',panel:true,label:'NODE'};
    case 'scientific_lab':
      return role==='hero'?{x:50,y:51,w:64,h:62,anchor:'center',panel:true,label:'SPECIMEN'}:{x:17+(i%4)*22,y:76,w:18,h:24,anchor:'center',panel:true};
    case 'minimal_cinematic':
      return role==='hero'?{x:50,y:50,w:88,h:78,anchor:'center',panel:false}:{x:78,y:78,w:28,h:22,anchor:'center',panel:false};
    case 'photo_essay':
      return role==='hero'?{x:50,y:50,w:92,h:78,anchor:'center',panel:false}:{x:50,y:82,w:38,h:22,anchor:'center',panel:false};
    case 'split_screen':
      return {x: i%2===0?25:75,y:50,w:47,h:82,anchor:'center',panel:true,split:i%2===0?'left':'right'};
    case 'evidence_board':
      return {x:18+(i%4)*22,y:22+Math.floor(i/4)*28,w:20,h:24,anchor:'center',panel:true,label:`EXHIBIT ${String(i+1).padStart(2,'0')}`};
    case 'mixed_media':
      return {x:even?34:67,y:52+(i%3-1)*13,w:42,h:45,anchor:'center',panel:true};
    default:
      return {x:50,y:50,w:50,h:50,anchor:'center',panel:true};
  }
}

export function getStyleTextAnchor(style:string|undefined):'left'|'center'|'right'{
  if(['modern_editorial','newspaper','financial_terminal','cyber_intelligence'].includes(style||'')) return 'left';
  if(['minimal_cinematic','photo_essay'].includes(style||'')) return 'center';
  return 'left';
}

export function getStyleBackgroundMode(style:string|undefined):'paper'|'grid'|'map'|'dark'|'clean'{
  if(['classic_vox','investigative','newspaper','case_file','archive_museum','evidence_board','mixed_media'].includes(style||'')) return 'paper';
  if(['map_intelligence','geopolitical'].includes(style||'')) return 'map';
  if(['financial_terminal','cyber_intelligence','blueprint'].includes(style||'')) return 'grid';
  if(style==='minimal_cinematic') return 'dark';
  return 'clean';
}
