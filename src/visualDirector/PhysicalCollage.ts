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
  hero_archive: { layout:'hero_archive', name:'Hero Archive', minAssets:1, maxAssets:2, preferredMotion:'paper_drop', roles:['hero'], background:'archival', description:'One dominant archival image with optional supporting detail.' },
  newspaper: { layout:'newspaper', name:'Newspaper Headline', minAssets:2, maxAssets:3, preferredMotion:'paper_slide_left', roles:['hero','secondary'], background:'newsprint', description:'Headline/photo composition with one supporting image.' },
  map: { layout:'map', name:'Archival Map', minAssets:2, maxAssets:3, preferredMotion:'paper_reveal', roles:['background','detail','secondary'], background:'map', description:'Map surface plus location evidence or object.' },
  photo_stack: { layout:'photo_stack', name:'Photo Stack', minAssets:3, maxAssets:6, preferredMotion:'photo_stack', roles:['hero','secondary','secondary','detail','detail'], background:'newsprint', description:'Multiple photographs physically stacked with staggered landings.' },
  document: { layout:'document', name:'Declassified Document', minAssets:2, maxAssets:4, preferredMotion:'paper_reveal', roles:['hero','detail','secondary'], background:'archival', description:'Document page plus clipping/object evidence.' },
  big_number: { layout:'big_number', name:'Big Editorial Metric', minAssets:1, maxAssets:2, preferredMotion:'paper_drop', roles:['hero','secondary'], background:'cream_aged', description:'One supporting visual beside a dominant metric.' },
  timeline: { layout:'timeline', name:'Horizontal Timeline', minAssets:3, maxAssets:6, preferredMotion:'paper_slide_right', roles:['secondary','secondary','secondary','detail','detail'], background:'newsprint', description:'Multiple chronological evidence cards.' },
  collage_board: { layout:'collage_board', name:'Investigation Collage Board', minAssets:4, maxAssets:8, preferredMotion:'paper_drop', roles:['hero','secondary','secondary','detail','detail','detail'], background:'corkboard', description:'Investigation board with multiple evidence items and relationships.' },
  split_screen: { layout:'split_screen', name:'Split Screen', minAssets:2, maxAssets:2, preferredMotion:'paper_slide_left', roles:['hero','secondary'], background:'newsprint', description:'Two simultaneous evidence panels.' },
};

export const getCompositionRecipe = (layout: LayoutID): CompositionRecipe => COMPOSITION_RECIPES[layout] || COMPOSITION_RECIPES.hero_archive;

export const getRequiredAssetCount = (layout: LayoutID): number => getCompositionRecipe(layout).minAssets;

export function describeAssetRole(layout: LayoutID, index: number): VisualAsset['role'] {
  const recipe = getCompositionRecipe(layout);
  return recipe.roles[index] || (index === 0 ? 'hero' : 'detail');
}

export function inferBackground(layout: LayoutID): PhysicalBackgroundID {
  return getCompositionRecipe(layout).background;
}

export function inferMotion(layout: LayoutID, index = 0): MotionID {
  const recipe = getCompositionRecipe(layout);
  if (layout === 'photo_stack') return 'photo_stack';
  if (layout === 'timeline') return index % 2 ? 'paper_slide_left' : 'paper_slide_right';
  if (layout === 'collage_board') return index === 0 ? 'paper_drop' : 'paper_reveal';
  return recipe.preferredMotion;
}

const ROLE_HINTS: Record<VisualAsset['role'], string> = {
  hero: 'main archival subject or hero photograph',
  secondary: 'supporting archival photograph or contextual evidence',
  background: 'archival map, document surface, or environmental evidence',
  detail: 'small evidence detail, object, clipping, document fragment, or portrait detail',
};

export function buildAssetPrompt(shot: Shot, role: VisualAsset['role'], index: number): string {
  const concept = shot.visual_idea || shot.narration || 'documentary subject';
  const hint = ROLE_HINTS[role];
  return `${hint} for shot ${shot.order}: ${concept}. Historical documentary evidence, physically plausible archival source, hand-cut paper collage aesthetic, black-and-white halftone where appropriate, rough scissor-cut edges, aged paper texture, restrained red signal accent, no modern UI, no glossy 3D render, no watermark, no text unless the source naturally contains it.`;
}

export function ensureCompositionAssets(shot: Shot): Shot {
  const recipe = getCompositionRecipe(shot.layout);
  const assets = [...(shot.assets || [])];
  const usedRoles = assets.map(a => a.role);
  while (assets.length < recipe.minAssets) {
    const index = assets.length;
    const role = describeAssetRole(shot.layout, index);
    const id = `${shot.shot_id}_${role}_${index + 1}`;
    assets.push({
      id,
      type: 'image',
      role,
      source: '',
      assetPrompt: buildAssetPrompt(shot, role, index),
      provider: 'gemini',
      status: 'pending',
      position: { x: 50, y: 50 },
      scale: role === 'hero' ? 0.92 : 0.72,
      rotation: index === 0 ? 0 : (index % 2 ? -2.5 : 2.5),
      motion: inferMotion(shot.layout, index),
      start: 0.25 + index * 0.18,
      filter: 'high_contrast',
      paperCutout: true,
      shadow: { enabled: true, offset: [10, 14], blur: 18, opacity: 0.42 },
    });
  }
  // Avoid duplicate semantic roles when the layout has a specific recipe.
  if (usedRoles.length === 0 && assets[0]) assets[0].role = 'hero';
  return { ...shot, assets };
}

export function validateComposition(shot: Shot): string[] {
  const recipe = getCompositionRecipe(shot.layout);
  const count = (shot.assets || []).filter(a => a.type === 'image').length;
  const errors: string[] = [];
  if (count < recipe.minAssets) errors.push(`${recipe.name} requires at least ${recipe.minAssets} image assets; ${count} configured.`);
  if (count > recipe.maxAssets) errors.push(`${recipe.name} supports at most ${recipe.maxAssets} image assets; ${count} configured.`);
  if (shot.layout === 'photo_stack' && count < 3) errors.push('Photo Stack Land is a multi-photo choreography and needs at least 3 photos.');
  if (shot.layout === 'split_screen' && count !== 2) errors.push('Split Screen requires exactly 2 image assets.');
  return errors;
}

export function getMotionHelp(motion: MotionID): string {
  switch (motion) {
    case 'photo_stack': return 'Multi-asset motion: every image lands as a staggered physical photo in the stack.';
    case 'string_draw': return 'Relationship motion: draw a red string between two evidence points/assets.';
    case 'arrow_draw': return 'Graphic motion: draws an annotation path; it does not generate another image.';
    case 'typewriter': return 'Text motion: animates text characters; it does not require another image.';
    case 'headline_pop': return 'Text motion: pastes a headline into the composition.';
    case 'stamp_in': return 'Graphic motion: slams a stamp onto the paper surface.';
    default: return 'Single-asset paper motion: animates the selected asset into its composition frame.';
  }
}
