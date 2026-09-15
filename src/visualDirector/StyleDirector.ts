import { selectSemanticVisualStyle } from './SemanticVisualDirector.ts';
import { getCompositionFrame, getPhysicalLayoutFrame } from './CompositionEngine.ts';
import { VOX_50_VISUAL_STYLES, VisualStyleCategory } from '../presets/visualStyles.ts';

export type VisualDirectionMode = 'auto' | 'manual' | 'hybrid';
export type VisualStyleId = string;
export interface VisualStyleEntry { id:VisualStyleId; name:string; category:VisualStyleCategory|string; englishName?:string; bestFor:string[]; layouts:string[]; motions?:string[]; description?:string; material?:string; }

const LEGACY_STYLES:VisualStyleEntry[] = [
 {id:'classic_vox',name:'VOX Cổ điển',category:'Bộ nền hiện có',englishName:'Classic VOX',bestFor:['documentary','history'],layouts:['hero_archive','collage_board','photo_stack']},
 {id:'investigative',name:'Điều tra',category:'Điều tra & Bằng chứng',englishName:'Investigative',bestFor:['investigation','scandal','mystery'],layouts:['document','collage_board','hero_archive']},
 {id:'newspaper',name:'Báo chí',category:'Báo chí & Biên tập',englishName:'Newspaper',bestFor:['news','business','history'],layouts:['newspaper','photo_stack','big_number']},
 {id:'timeline',name:'Dòng thời gian',category:'Báo chí & Biên tập',englishName:'Timeline',bestFor:['history','biography','events'],layouts:['timeline','big_number','photo_stack']},
 {id:'map_intelligence',name:'Bản đồ tình báo',category:'Bản đồ & Địa lý',englishName:'Map Intelligence',bestFor:['geography','war','migration','trade'],layouts:['map','collage_board','timeline']},
 {id:'data_documentary',name:'Phóng sự dữ liệu',category:'Dữ liệu & Công nghệ',englishName:'Data Documentary',bestFor:['statistics','research','economics'],layouts:['big_number','timeline','split_screen']},
 {id:'blueprint',name:'Bản vẽ kỹ thuật',category:'Dữ liệu & Công nghệ',englishName:'Blueprint',bestFor:['engineering','architecture','technology'],layouts:['document','split_screen','collage_board']},
 {id:'case_file',name:'Hồ sơ vụ án',category:'Điều tra & Bằng chứng',englishName:'Case File',bestFor:['crime','investigation','scandal'],layouts:['collage_board','document','photo_stack']},
 {id:'archive_museum',name:'Bảo tàng lưu trữ',category:'Giấy & Tài liệu',englishName:'Archive Museum',bestFor:['ancient','culture','artifacts','biography'],layouts:['hero_archive','photo_stack','document']},
 {id:'modern_editorial',name:'Biên tập hiện đại',category:'Báo chí & Biên tập',englishName:'Modern Editorial',bestFor:['business','technology','culture'],layouts:['split_screen','hero_archive','big_number']},
 {id:'financial_terminal',name:'Màn hình tài chính',category:'Dữ liệu & Công nghệ',englishName:'Financial Terminal',bestFor:['finance','markets','economics'],layouts:['big_number','split_screen','timeline']},
 {id:'cyber_intelligence',name:'Tình báo mạng',category:'Dữ liệu & Công nghệ',englishName:'Cyber Intelligence',bestFor:['cyber','internet','ai','networks'],layouts:['collage_board','split_screen','big_number']},
 {id:'scientific_lab',name:'Phòng thí nghiệm',category:'Dữ liệu & Công nghệ',englishName:'Scientific Lab',bestFor:['science','biology','physics','space'],layouts:['document','split_screen','hero_archive']},
 {id:'geopolitical',name:'Địa chính trị',category:'Bản đồ & Địa lý',englishName:'Geopolitical',bestFor:['geopolitics','war','diplomacy','trade'],layouts:['map','split_screen','timeline']},
 {id:'minimal_cinematic',name:'Điện ảnh tối giản',category:'Điện ảnh & Tối giản',englishName:'Minimal Cinematic',bestFor:['opening','ending','dramatic'],layouts:['hero_archive','big_number']},
 {id:'photo_essay',name:'Phóng sự ảnh',category:'Ảnh & Collage',englishName:'Photo Essay',bestFor:['biography','travel','culture','human'],layouts:['hero_archive','photo_stack','split_screen']},
 {id:'split_screen',name:'Chia đôi màn hình',category:'Điện ảnh & Tối giản',englishName:'Split Screen',bestFor:['comparison','versus','before after'],layouts:['split_screen','big_number']},
 {id:'evidence_board',name:'Bảng bằng chứng',category:'Điều tra & Bằng chứng',englishName:'Evidence Board',bestFor:['investigation','networks','history'],layouts:['collage_board','map','photo_stack']},
 {id:'mixed_media',name:'Đa chất liệu',category:'Ảnh & Collage',englishName:'Mixed Media',bestFor:['long-form','complex','documentary'],layouts:['hero_archive','map','timeline','document','split_screen','collage_board','big_number']},
];

export const VISUAL_STYLES:VisualStyleEntry[] = [...LEGACY_STYLES, ...VOX_50_VISUAL_STYLES];
export const VISUAL_STYLE_CATEGORIES = Array.from(new Set(VISUAL_STYLES.map(s=>s.category)));

const containsAny=(text:string,terms:string[])=>terms.some(term=>text.includes(term.toLowerCase()));
export function analyzeContent(narration:string,visualIdea=''){
 const text=`${narration} ${visualIdea}`.toLowerCase(); const types:string[]=[];
 if(/\b(19|20)\d{2}\b|history|historical|century|revolution|empire|lịch sử|thế kỷ/.test(text))types.push('historical_event');
 if(/money|market|stock|bank|econom|revenue|inflation|finance|\$|%|tiền|thị trường|tài chính/.test(text))types.push('economic');
 if(/map|country|city|border|route|migration|global|bản đồ|quốc gia|biên giới/.test(text))types.push('geographic');
 if(/data|number|million|billion|percent|statistics|rate|dữ liệu|triệu|tỷ|phần trăm/.test(text))types.push('statistics');
 if(/investig|crime|scandal|evidence|secret|leak|điều tra|bằng chứng|bí mật/.test(text))types.push('investigation');
 if(/system|process|machine|technology|software|ai|engineering|công nghệ|máy móc/.test(text))types.push('technical');
 if(!types.length)types.push('narrative');
 return{text,types,serious:/crisis|war|death|scandal|collapse|shock|danger|khủng hoảng|chiến tranh|cái chết/.test(text),highImportance:/critical|key|turning point|shock|collapse|breakthrough|quan trọng|bước ngoặt/.test(text)};
}
function scoreStyle(style:VisualStyleEntry,analysis:ReturnType<typeof analyzeContent>){
 let score=0; const haystack=`${analysis.text} ${analysis.types.join(' ')}`;
 for(const term of style.bestFor)if(haystack.includes(term.toLowerCase()))score+=6;
 if(analysis.types.includes('investigation')&&style.category==='Điều tra & Bằng chứng')score+=10;
 if(analysis.types.includes('historical_event')&&(style.category==='Giấy & Tài liệu'||style.category==='Báo chí & Biên tập'))score+=6;
 if(analysis.types.includes('geographic')&&style.category==='Bản đồ & Địa lý')score+=10;
 if(analysis.types.includes('technical')&&style.category==='Dữ liệu & Công nghệ')score+=8;
 if(analysis.serious&&['Điều tra & Bằng chứng','Bản đồ & Địa lý'].includes(style.category))score+=3;
 return score;
}
export function chooseStyle(narration:string,visualIdea:string,history:Array<{style?:string;layout?:string;motion?:string}>,mode:VisualDirectionMode='auto',manualStyle:VisualStyleId='classic_vox'){
 const analysis=analyzeContent(narration,visualIdea); const locked=VISUAL_STYLES.find(s=>s.id===manualStyle)||VISUAL_STYLES[0];
 if(mode==='manual')return{style:locked.id,variant:analysis.serious?'dramatic':'clean',layout:locked.layouts[history.length%locked.layouts.length],motion:locked.motions?.[history.length%(locked.motions?.length||1)]||'paper_drop',reason:['manual style lock'],diversityWarnings:[]};
 const semanticStyle=selectSemanticVisualStyle({narration,visualIdea});
 const ranked=VISUAL_STYLES.map(style=>{const recent=history.slice(-5).filter(x=>x.style===style.id).length;let score=scoreStyle(style,analysis)-recent*18;if(style.id===semanticStyle)score+=mode==='auto'?24:12;if(mode==='hybrid'&&style.id===locked.id)score+=10;return{style,score};}).sort((a,b)=>b.score-a.score);
 const selected=ranked[0]?.style||locked; const layout=selected.layouts[history.length%selected.layouts.length]; const motion=selected.motions?.[history.length%(selected.motions?.length||1)]||'paper_drop';
 return{style:selected.id,variant:analysis.serious?'dramatic':analysis.highImportance?'dense':'clean',layout,motion,reason:[`semantic:${semanticStyle}`,`content:${analysis.types.join(',')}`,`category:${selected.category}`,`mode:${mode}`],diversityWarnings:history.slice(-5).filter(x=>x.style===selected.id).length>=2?['STYLE_REPETITION_HIGH']:[]};
}
function applyComposition(shot:any,styleId:VisualStyleId){
 const style=VISUAL_STYLES.find(s=>s.id===styleId)||VISUAL_STYLES[0]; const assets=Array.isArray(shot.assets)?shot.assets:[]; const imageAssets=assets.filter((a:any)=>a.type==='image'); const count=Math.max(1,imageAssets.length); let imageIndex=0;
 const nextAssets=assets.map((asset:any)=>{if(asset.type!=='image')return asset;const frame=getPhysicalLayoutFrame((style.layouts[0]||shot.layout) as any,imageIndex,count,asset.role||'secondary');imageIndex+=1;return{...asset,position:{x:frame.x,y:frame.y},scale:Number(Math.max(.35,Math.min(1.6,frame.w/48)).toFixed(3)),compositionFrame:frame,styleMotion:style.motions?.[imageIndex%(style.motions?.length||1)]||'paper_drop'};});
 return{...shot,assets:nextAssets,compositionGrammar:`${style.name} / ${style.englishName||''}`.trim(),visualMaterial:style.material};
}
export function directProjectVisuals(project:any,mode:VisualDirectionMode='auto',manualStyle:VisualStyleId='classic_vox'){
 const history:Array<{style?:string;layout?:string;motion?:string}>=[];
 const shots=(project.shots||[]).map((shot:any)=>{const choice=chooseStyle(shot.narration||'',shot.visual_idea||'',history,mode,manualStyle);history.push({style:choice.style,layout:choice.layout,motion:choice.motion});const style=VISUAL_STYLES.find(s=>s.id===choice.style)||VISUAL_STYLES[0];const allowedLayout=style.layouts.includes(shot.layout)&&choice.style==='classic_vox'?shot.layout:choice.layout;const assets=(shot.assets||[]).map((asset:any)=>({...asset,motion:(choice.motion||asset.motion),assetPrompt:`${asset.assetPrompt||shot.visual_idea||project.title}. STYLE SYSTEM: ${style.name} (${style.englishName||'VOX'}). CATEGORY: ${style.category}. MATERIAL: ${style.material||'editorial paper'}. ${style.description||''} Preserve documentary realism, clear subject separation, generous negative space, no watermark.`}));const composed=applyComposition({...shot,visualStyle:choice.style,styleVariant:choice.variant,styleReason:choice.reason,layout:allowedLayout,assets},choice.style);return{...composed,visualDirector:{style:choice.style,styleName:style.name,category:style.category,englishName:style.englishName,variant:choice.variant,layout:allowedLayout,motion:choice.motion,reason:choice.reason,diversityWarnings:choice.diversityWarnings}};});return{...project,visualDirectionMode:mode,manualVisualStyle:manualStyle,shots};
}
