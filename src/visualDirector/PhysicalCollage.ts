import { LayoutID, MotionID, Shot, VisualAsset } from '../types.ts';

export type PhysicalBackgroundID = 'newsprint' | 'archival' | 'map' | 'corkboard' | 'cream_aged';
export type PhysicalBorderID = 'scissor_cut' | 'clean_edge';

export interface CompositionRecipe {
  layout: LayoutID;
  name: string;
  minAssets: number;
  maxAssets: number;
  preferredMotion: MotionID;
  roles: VisualAsset['role'][];
  background: PhysicalBackgroundID;
  description: string;
}

export const COMPOSITION_RECIPES: Record<LayoutID, CompositionRecipe> = {
  hero_archive:{layout:'hero_archive',name:'Hero Archive',minAssets:1,maxAssets:2,preferredMotion:'paper_drop',roles:['hero'],background:'archival',description:'One dominant archival image with optional supporting detail.'},
  newspaper:{layout:'newspaper',name:'Newspaper Headline',minAssets:2,maxAssets:3,preferredMotion:'paper_slide_left',roles:['hero','secondary','detail'],background:'newsprint',description:'Headline/photo composition with supporting evidence.'},
  map:{layout:'map',name:'Archival Map',minAssets:2,maxAssets:3,preferredMotion:'paper_reveal',roles:['background','detail','secondary'],background:'map',description:'Map surface plus location evidence.'},
  photo_stack:{layout:'photo_stack',name:'Photo Stack',minAssets:3,maxAssets:6,preferredMotion:'photo_stack',roles:['hero','secondary','secondary','detail','detail','detail'],background:'newsprint',description:'Multiple photographs physically stacked with staggered landings.'},
  document:{layout:'document',name:'Declassified Document',minAssets:2,maxAssets:4,preferredMotion:'paper_reveal',roles:['hero','detail','secondary','detail'],background:'archival',description:'Document page plus clipping/object evidence.'},
  big_number:{layout:'big_number',name:'Big Editorial Metric',minAssets:1,maxAssets:2,preferredMotion:'paper_drop',roles:['hero','secondary'],background:'cream_aged',description:'Dominant metric beside supporting evidence.'},
  timeline:{layout:'timeline',name:'Horizontal Timeline',minAssets:3,maxAssets:6,preferredMotion:'paper_slide_right',roles:['secondary','secondary','secondary','detail','detail','detail'],background:'newsprint',description:'Chronological evidence cards.'},
  collage_board:{layout:'collage_board',name:'Investigation Collage Board',minAssets:4,maxAssets:8,preferredMotion:'paper_drop',roles:['hero','secondary','secondary','detail','detail','detail'],background:'corkboard',description:'Investigation board with multiple evidence items.'},
  split_screen:{layout:'split_screen',name:'Split Screen',minAssets:2,maxAssets:2,preferredMotion:'paper_slide_left',roles:['hero','secondary'],background:'newsprint',description:'Two simultaneous evidence panels.'},
};

export const getCompositionRecipe=(layout:LayoutID):CompositionRecipe=>COMPOSITION_RECIPES[layout]||COMPOSITION_RECIPES.hero_archive;
export const getRequiredAssetCount=(layout:LayoutID):number=>getCompositionRecipe(layout).minAssets;
export function describeAssetRole(layout:LayoutID,index:number):VisualAsset['role']{
  const recipe=getCompositionRecipe(layout);
  return recipe.roles[index] || (index===0?'hero':'detail');
}
export function inferBackground(layout:LayoutID):PhysicalBackgroundID{return getCompositionRecipe(layout).background;}
export function inferMotion(layout:LayoutID,index=0):MotionID{
  if(layout==='photo_stack') return 'photo_stack';
  if(layout==='timeline') return index%2?'paper_slide_left':'paper_slide_right';
  if(layout==='collage_board') return index===0?'paper_drop':'paper_reveal';
  return getCompositionRecipe(layout).preferredMotion;
}

const ROLE_HINTS:Record<VisualAsset['role'],string>={
  hero:'main archival subject or hero photograph',
  secondary:'supporting archival photograph or contextual evidence',
  background:'archival map, document surface, or environmental evidence',
  detail:'small evidence detail, object, clipping, document fragment, or portrait detail',
};

export function buildAssetPrompt(shot:Shot,role:VisualAsset['role'],index:number):string{
  const concept=shot.visual_idea||shot.narration||'documentary subject';
  return `${ROLE_HINTS[role]} for shot ${shot.order}: ${concept}. Historical documentary evidence, physically plausible archival source, hand-cut paper collage aesthetic, black-and-white halftone where appropriate, rough scissor-cut edges, aged paper texture, restrained red signal accent, no modern UI, no glossy 3D render, no watermark, no text unless the source naturally contains it.`;
}

function createSeedAsset(shot:Shot,layout:LayoutID,index:number,role:VisualAsset['role'],existing?:VisualAsset):VisualAsset{
  const base=existing||{} as VisualAsset;
  return {
    ...base,
    id:base.id||`${shot.shot_id}_${role}_${index+1}`,
    type:base.type||'image', role, source:base.source||'',
    assetPrompt:base.assetPrompt||buildAssetPrompt(shot,role,index), provider:base.provider||'gemini',
    status:base.status||'pending', position:base.position||{x:50,y:50},
    scale:base.scale|| (role==='hero'?0.92:0.72),
    rotation:typeof base.rotation==='number'?base.rotation:(index===0?0:(index%2?-2.5:2.5)),
    motion:inferMotion(layout,index), start:typeof base.start==='number'?base.start:0.2+index*0.14,
    filter:base.filter||'high_contrast', paperCutout:base.paperCutout!==false,
    shadow:base.shadow||{enabled:true,offset:[10,14],blur:18,opacity:0.42},
  };
}

/** Normalize the asset structure so a layout change really changes the composition. */
export function ensureCompositionAssets(shot:Shot):Shot{
  const recipe=getCompositionRecipe(shot.layout);
  const source=[...(shot.assets||[])].filter(a=>a.type==='image');
  const targetCount=Math.max(recipe.minAssets,Math.min(recipe.maxAssets,source.length||recipe.minAssets));
  const assets:Array<VisualAsset>=[];
  for(let i=0;i<targetCount;i++){
    const role=describeAssetRole(shot.layout,i);
    assets.push(createSeedAsset(shot,shot.layout,i,role,source[i]));
  }
  return {...shot,assets,background:{...shot.background,type:inferBackground(shot.layout)},composition:{layout:shot.layout,background:inferBackground(shot.layout),border:shot.composition?.border||'scissor_cut',primaryMotion:assets[0]?.motion||inferMotion(shot.layout),autoGenerated:true,assetCount:assets.length}};
}

export function validateComposition(shot:Shot):string[]{
  const recipe=getCompositionRecipe(shot.layout); const count=(shot.assets||[]).filter(a=>a.type==='image').length; const errors:string[]=[];
  if(count<recipe.minAssets)errors.push(`${recipe.name} requires at least ${recipe.minAssets} image assets; ${count} configured.`);
  if(count>recipe.maxAssets)errors.push(`${recipe.name} supports at most ${recipe.maxAssets} image assets; ${count} configured.`);
  if(shot.layout==='photo_stack'&&count<3)errors.push('Photo Stack needs at least 3 photos.');
  if(shot.layout==='split_screen'&&count!==2)errors.push('Split Screen requires exactly 2 image assets.');
  return errors;
}

export function getMotionHelp(motion:MotionID):string{
  switch(motion){
    case 'photo_stack':return 'Multi-asset motion: every image lands as a staggered physical photo.';
    case 'string_draw':return 'Relationship motion: draw a red string between evidence points.';
    case 'arrow_draw':return 'Graphic motion: draw an annotation path.';
    case 'typewriter':return 'Text motion: animate text characters.';
    case 'headline_pop':return 'Text motion: paste a headline into the composition.';
    case 'stamp_in':return 'Graphic motion: slam a stamp onto the paper surface.';
    default:return 'Physical paper motion for the selected asset.';
  }
}
