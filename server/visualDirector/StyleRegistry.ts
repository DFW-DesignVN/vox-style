export type VisualStyleId =
  | 'classic_vox' | 'investigative' | 'newspaper' | 'timeline' | 'map_intelligence'
  | 'data_documentary' | 'blueprint' | 'case_file' | 'archive_museum' | 'modern_editorial'
  | 'financial_terminal' | 'cyber_intelligence' | 'scientific_lab' | 'geopolitical'
  | 'minimal_cinematic' | 'photo_essay' | 'split_screen' | 'evidence_board' | 'mixed_media';

export type StyleVariant = 'clean' | 'dramatic' | 'dark' | 'minimal' | 'dense' | 'technical' | 'archival';

export interface VisualStyleDefinition {
  id: VisualStyleId;
  name: string;
  description: string;
  bestFor: string[];
  avoidFor: string[];
  layouts: string[];
  materials: string[];
  motions: string[];
  palette: string[];
  typography: string[];
  density: 'low' | 'medium' | 'high';
  variants: StyleVariant[];
}

const S = (id: VisualStyleId, name: string, description: string, bestFor: string[], layouts: string[], materials: string[], motions: string[], palette: string[], typography: string[], density: VisualStyleDefinition['density'] = 'medium'): VisualStyleDefinition => ({
  id, name, description, bestFor, avoidFor: ['comedy', 'generic lifestyle'], layouts, materials, motions, palette, typography, density,
  variants: ['clean', 'dramatic', 'dark', 'minimal', 'dense', 'archival'],
});

export const VISUAL_STYLE_REGISTRY: VisualStyleDefinition[] = [
  S('classic_vox','Classic VOX','Hand-cut editorial documentary collage with archival paper, halftone photographs and signal accents.',['general documentary','history','explainer'],['hero_archive','collage_board','photo_stack'],['newsprint','paper_cutout','masking_tape','halftone_photo','red_string'],['paper_drop','paper_reveal','headline_pop','string_draw'],['tan','ink black','halftone gray','hot red','mustard'],['condensed headline','typewriter'], 'medium'),
  S('investigative','Investigative','Serious investigative visual language built around documents, annotations, redactions and evidence.',['investigation','scandal','controversy','mystery'],['document','collage_board','hero_archive'],['case_folder','document_scan','redaction','evidence_tag','stamp'],['document_slide','stamp_in','typewriter','annotation_reveal'],['charcoal','paper white','red','black'],['typewriter','condensed headline'], 'medium'),
  S('newspaper','Newspaper','Editorial newspaper page compositions with clippings, columns, headlines and photographic inserts.',['breaking news','history','media','politics','business'],['newspaper','photo_stack','big_number'],['newsprint','clipping','headline','column','photo_cutout'],['paper_slide_left','headline_pop','paper_reveal'],['newsprint white','ink black','red','yellow'],['newspaper serif','condensed headline'], 'high'),
  S('timeline','Timeline','Chronological visual storytelling emphasizing dates, milestones and causality.',['history','biography','technology evolution','events'],['timeline','big_number','photo_stack'],['timeline_rule','date_card','photo','marker','paper'],['typewriter','paper_slide_left','arrow_draw'],['cream','black','red','mustard'],['condensed headline','typewriter'], 'medium'),
  S('map_intelligence','Map Intelligence','Cartographic storytelling with routes, pins, borders, coordinates and strategic annotations.',['geography','migration','trade','war','expansion'],['map','collage_board','timeline'],['aged_map','route_line','pin','coordinate','red_string'],['arrow_draw','string_draw','paper_reveal','pin_drop'],['map tan','ink brown','red','blue-gray'],['technical label','condensed headline'], 'medium'),
  S('data_documentary','Data Documentary','Editorial data visualization with large statistics, charts and evidence-led numeric emphasis.',['statistics','research','economics','science'],['big_number','timeline','split_screen'],['chart','grid','number_card','paper','marker'],['number_pop','bar_grow','underline_draw','typewriter'],['off-white','black','red','mustard'],['numeric display','condensed headline'], 'low'),
  S('blueprint','Blueprint','Technical diagram aesthetic using grids, measurements, cutaways and precise annotations.',['engineering','architecture','how it works','technology'],['document','split_screen','collage_board'],['blueprint_grid','diagram','measurement','callout','technical_ink'],['diagram_draw','annotation_reveal','line_draw'],['blueprint blue','white','red','graphite'],['technical mono','label'], 'medium'),
  S('case_file','Case File','Evidence-board presentation with numbered exhibits, folders, photos and classified stamps.',['crime','investigation','corporate scandal','mystery'],['collage_board','document','photo_stack'],['folder','evidence_photo','exhibit_number','stamp','tape'],['stamp_in','paper_drop','string_draw','typewriter'],['manila','black','red','cream'],['typewriter','stamp'], 'high'),
  S('archive_museum','Archive Museum','Museum-like historical presentation with artifact cards, captions and restrained archival spacing.',['ancient history','culture','biography','artifacts'],['hero_archive','photo_stack','document'],['artifact','museum_label','archival_photo','aged_paper','frame'],['paper_reveal','slow_slide','label_attach'],['ivory','sepia','charcoal','muted red'],['editorial serif','museum label'], 'low'),
  S('modern_editorial','Modern Editorial','Contemporary magazine design with clean grids, strong typography and controlled imagery.',['business','technology','culture','profiles'],['split_screen','hero_archive','big_number'],['magazine_grid','photo','rule','label','paper'],['slide','headline_pop','word_reveal'],['white','black','red','warm gray'],['modern sans','display'], 'low'),
  S('financial_terminal','Financial Terminal','Financial newsroom language with market numbers, charts, ticker strips and event markers.',['markets','finance','business','economics'],['big_number','split_screen','timeline'],['ticker','chart','market_card','grid','redline'],['number_pop','ticker_slide','chart_draw'],['black','green-gray','white','red'],['numeric mono','terminal'], 'high'),
  S('cyber_intelligence','Cyber Intelligence','Digital intelligence board combining network diagrams, logs, nodes and forensic data.',['cybersecurity','AI','internet','surveillance','networks'],['collage_board','split_screen','big_number'],['terminal','node_graph','log','grid','signal'],['scanline','node_connect','text_reveal','glitch_micro'],['near-black','cyan-gray','white','red'],['monospace','technical'], 'high'),
  S('scientific_lab','Scientific Lab','Scientific editorial visuals using specimen cards, diagrams, measurements and restrained laboratory imagery.',['science','medicine','biology','physics','space'],['document','split_screen','hero_archive'],['specimen','diagram','measurement','lab_note','grid'],['diagram_draw','label_attach','zoomless_reveal'],['paper white','graphite','red','blue-gray'],['scientific serif','technical label'], 'medium'),
  S('geopolitical','Geopolitical','Strategic visual language combining maps, borders, blocs, routes and evidence cards.',['geopolitics','war','trade','diplomacy','international affairs'],['map','split_screen','timeline'],['map','border','flag_block','route','briefing_card'],['route_draw','pin_drop','briefing_reveal','arrow_draw'],['map beige','black','red','mustard'],['briefing sans','condensed headline'], 'high'),
  S('minimal_cinematic','Minimal Cinematic','Large cinematic imagery and typography with generous negative space and very few layers.',['dramatic moments','profiles','opening','ending'],['hero_archive','big_number'],['photo','black field','headline','thin rule'],['slow_reveal','headline_pop','fade'],['black','white','single accent red'],['large display','minimal sans'], 'low'),
  S('photo_essay','Photo Essay','Photography-first storytelling with strong captions, image crops and subtle editorial movement.',['biography','travel','culture','human stories'],['hero_archive','photo_stack','split_screen'],['photo','caption','frame','paper'],['slow_slide','crop_reveal','caption_attach'],['photo neutral','white','black','red'],['editorial serif','caption'], 'low'),
  S('split_screen','Split Screen','Two-column visual comparison for before/after, A/B, opposing forces and contrasts.',['comparison','versus','before after','two sides'],['split_screen','big_number'],['left_panel','right_panel','divider','label','photo'],['panel_slide','divider_draw','label_attach'],['white','black','red','gray'],['display','label'], 'medium'),
  S('evidence_board','Evidence Board','Connected evidence wall with photos, documents, pins, strings and relationship mapping.',['investigation','networks','history','conspiracy analysis'],['collage_board','map','photo_stack'],['photo','document','pin','string','tape','annotation'],['string_draw','pin_drop','paper_drop','annotation_reveal'],['cork','paper','black','red','yellow'],['typewriter','marker'], 'high'),
  S('mixed_media','Mixed Media','Adaptive editorial mix that intentionally changes material and composition from shot to shot.',['long-form documentary','complex subjects','multi-domain stories'],['hero_archive','map','timeline','document','split_screen','collage_board','big_number'],['paper','photo','map','chart','document','tape','stamp'],['paper_drop','slide','typewriter','arrow_draw','string_draw','headline_pop'],['paper neutral','black','red','mustard','gray'],['mixed editorial'], 'medium'),
];

export const STYLE_BY_ID = Object.fromEntries(VISUAL_STYLE_REGISTRY.map((style) => [style.id, style])) as Record<VisualStyleId, VisualStyleDefinition>;

export function getStyle(id?: string): VisualStyleDefinition {
  return STYLE_BY_ID[(id as VisualStyleId)] || STYLE_BY_ID.classic_vox;
}

export function listStyles() {
  return VISUAL_STYLE_REGISTRY.map(({ id, name, description, bestFor, layouts, variants, density }) => ({ id, name, description, bestFor, layouts, variants, density }));
}
