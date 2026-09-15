import { directProjectVisuals, VISUAL_STYLES } from '../src/visualDirector/StyleDirector.ts';

const project = {
  project_id:'style-test', title:'The Fall of a Financial Empire', duration:30, fps:30, resolution:'1920x1080',
  style:'vox_paper_collage', voiceover:false, subtitles:false, sfx:false, script:'', createdAt:new Date().toISOString(),
  shots:[
    {shot_id:'1',order:1,start:0,end:5,duration:5,narration:'In 1929 the stock market collapsed and banks failed.',visual_idea:'financial crash and Wall Street',layout:'hero_archive',assets:[{id:'a1',type:'image',role:'hero',source:'',position:{x:50,y:50},scale:1,rotation:0,motion:'paper_drop',start:0}] ,text:[],graphics:[]},
    {shot_id:'2',order:2,start:5,end:10,duration:5,narration:'Investigators searched evidence for the hidden cause of the scandal.',visual_idea:'documents and evidence',layout:'hero_archive',assets:[{id:'a2',type:'image',role:'hero',source:'',position:{x:50,y:50},scale:1,rotation:0,motion:'paper_drop',start:0}],text:[],graphics:[]},
    {shot_id:'3',order:3,start:10,end:15,duration:5,narration:'A map reveals how the crisis spread across countries and borders.',visual_idea:'global map and routes',layout:'hero_archive',assets:[{id:'a3',type:'image',role:'hero',source:'',position:{x:50,y:50},scale:1,rotation:0,motion:'paper_drop',start:0}],text:[],graphics:[]}
  ]
};

const directed:any = directProjectVisuals(project,'auto');
if (VISUAL_STYLES.length !== 19) throw new Error(`Expected 19 styles, got ${VISUAL_STYLES.length}`);
if (directed.shots.some((s:any)=>!s.visualStyle || !s.styleVariant || !s.styleReason?.length)) throw new Error('Visual direction metadata missing');
if (new Set(directed.shots.map((s:any)=>s.visualStyle)).size < 2) throw new Error('Director failed to diversify style choices');
if (directed.shots.some((s:any)=>!s.assets[0].assetPrompt.includes('VISUAL STYLE:'))) throw new Error('Style was not injected into asset prompts');
console.log(`Visual director test: PASS (${directed.shots.map((s:any)=>s.visualStyle).join(', ')})`);
