import { PresetLayout, PresetMotion, VisualStyleConfig } from '../types.ts';

export const VOX_STYLE_PRESET: VisualStyleConfig = {
  name: 'vox_paper_collage',
  palette: { paper:'#E6DCB8', offWhite:'#F4EEDA', black:'#121212', gray:'#52525B', red:'#DC2626', yellow:'#CA8A04' },
  texture: { paper:true, grain:true, halftone:true },
  shadows: { enabled:true, color:'rgba(24, 20, 15, 0.45)', defaultBlur:14 },
  camera: { default:'locked' },
};

export const VOX_LAYOUTS: PresetLayout[] = [
  { id:'hero_archive', name:'Hero Archive', description:'Background + one dominant archival photo cutout + date label + red arrow annotation', defaultLayers:['background','hero_photo','date_label','red_arrow'] },
  { id:'newspaper', name:'Newspaper Headline', description:'Aged newsprint background + bold headline + small archival photo + marker highlight', defaultLayers:['newsprint_bg','hero_headline','small_photo','marker_highlight'] },
  { id:'map', name:'Archival Map', description:'Vintage map texture + location marker + route line + supporting evidence', defaultLayers:['map_bg','location_pin','route_line','hero_object'] },
  { id:'photo_stack', name:'Photo Stack', description:'Paper surface + 3–6 cascading archival photographs + tape', defaultLayers:['background','photo_01','photo_02','photo_03','paper_tape'] },
  { id:'document', name:'Declassified Document', description:'Official document page + stamp + clipping/object + connection string', defaultLayers:['document_bg','official_stamp','clipping_object','red_string'] },
  { id:'big_number', name:'Big Editorial Metric', description:'Giant statistic + supporting cutout + annotation + underline', defaultLayers:['background','huge_number','small_hero','annotation_text','red_underline'] },
  { id:'timeline', name:'Horizontal Timeline', description:'Drawn axis + chronological dates + archival photo chips', defaultLayers:['background','timeline_axis','date_markers','archival_chips'] },
  { id:'collage_board', name:'Investigation Collage Board', description:'Archival board + hero + supporting documents + tape + red yarn', defaultLayers:['cork_or_paper_bg','hero_asset','support_01','support_02','tape','red_string'] },
  { id:'split_screen', name:'Split Screen', description:'Two simultaneous evidence panels with a hard editorial divider', defaultLayers:['background','left_panel','right_panel','divider'] },
];

export const VOX_MOTIONS: PresetMotion[] = [
  { id:'paper_drop', name:'Paper Drop', category:'paper', description:'Drops from above with physical deceleration and settle' },
  { id:'paper_slide_left', name:'Paper Slide Left', category:'paper', description:'Slides in from right to left with friction drag' },
  { id:'paper_slide_right', name:'Paper Slide Right', category:'paper', description:'Slides in from left to right with friction drag' },
  { id:'paper_slide_up', name:'Paper Slide Up', category:'paper', description:'Pushes upward onto the desk surface' },
  { id:'paper_slide_down', name:'Paper Slide Down', category:'paper', description:'Slides downward with stepped stop-motion cadence' },
  { id:'photo_stack', name:'Photo Stack Land', category:'paper', description:'Lands as a staggered physical photo in a stack' },
  { id:'paper_reveal', name:'Paper Reveal', category:'paper', description:'Reveals from behind another layer' },
  { id:'typewriter', name:'Typewriter Text', category:'text', description:'Character-by-character reveal' },
  { id:'headline_pop', name:'Headline Pop', category:'text', description:'Physical paste-on with overshoot' },
  { id:'stamp_in', name:'Official Stamp', category:'graphic', description:'Rapid downward stamp impact' },
  { id:'arrow_draw', name:'Red Arrow Draw', category:'graphic', description:'Hand-drawn marker stroke along a trajectory' },
  { id:'string_draw', name:'Red String Tension', category:'graphic', description:'Red yarn line drawing between focal points' },
];
