import { PresetLayout, PresetMotion, VisualStyleConfig } from '../types.ts';

export const VOX_STYLE_PRESET: VisualStyleConfig = {
  name: 'vox_paper_collage',
  palette: {
    paper: '#E6DCB8', // Aged newsprint/archival paper
    offWhite: '#F4EEDA', // Cream document
    black: '#121212', // Ink black
    gray: '#52525B', // Halftone charcoal gray
    red: '#DC2626', // Hot archival red marker/string
    yellow: '#CA8A04', // Mustard accent
  },
  texture: {
    paper: true,
    grain: true,
    halftone: true,
  },
  shadows: {
    enabled: true,
    color: 'rgba(24, 20, 15, 0.45)',
    defaultBlur: 14,
  },
  camera: {
    default: 'locked',
  },
};

export const VOX_LAYOUTS: PresetLayout[] = [
  {
    id: 'hero_archive',
    name: 'Hero Archive',
    description: 'Background + One dominant archival photo cutout + Date label + Red arrow annotation',
    defaultLayers: ['background', 'hero_photo', 'date_label', 'red_arrow'],
  },
  {
    id: 'newspaper',
    name: 'Newspaper Headline',
    description: 'Aged newsprint background + Bold cutout headline + Small archival photo + Red marker box',
    defaultLayers: ['newsprint_bg', 'hero_headline', 'small_photo', 'marker_highlight'],
  },
  {
    id: 'map',
    name: 'Archival Map',
    description: 'Vintage map texture + Location marker pin + Red route line + Supporting cutout asset',
    defaultLayers: ['map_bg', 'location_pin', 'route_line', 'hero_object'],
  },
  {
    id: 'photo_stack',
    name: 'Photo Stack',
    description: 'Paper surface + 3 cascading archival photographs placed at staggered physical angles + Tape',
    defaultLayers: ['background', 'photo_01', 'photo_02', 'photo_03', 'paper_tape'],
  },
  {
    id: 'document',
    name: 'Declassified Document',
    description: 'Official document page + Red ink stamp + Signature/clipping + Red connection string',
    defaultLayers: ['document_bg', 'official_stamp', 'clipping_object', 'red_string'],
  },
  {
    id: 'big_number',
    name: 'Big Editorial Metric',
    description: 'Giant bold statistic number + Supporting archival cutout + Typewriter annotation + Underline',
    defaultLayers: ['background', 'huge_number', 'small_hero', 'annotation_text', 'red_underline'],
  },
  {
    id: 'timeline',
    name: 'Horizontal Timeline',
    description: 'Drawn horizontal axis + Staggered chronological dates + Mini archival photo chips',
    defaultLayers: ['background', 'timeline_axis', 'date_markers', 'archival_chips'],
  },
  {
    id: 'collage_board',
    name: 'Investigation Collage Board',
    description: 'Archival paper board + Hero photo + 2 supporting documents + Masking tape + Red yarn string',
    defaultLayers: ['cork_or_paper_bg', 'hero_asset', 'support_01', 'support_02', 'tape', 'red_string'],
  },
];

export const VOX_MOTIONS: PresetMotion[] = [
  { id: 'paper_drop', name: 'Paper Drop', category: 'paper', description: 'Drops from above with physical deceleration, subtle angle tilt, and slight ground bounce' },
  { id: 'paper_slide_left', name: 'Paper Slide Left', category: 'paper', description: 'Slides in horizontally from right to left with physical friction drag' },
  { id: 'paper_slide_right', name: 'Paper Slide Right', category: 'paper', description: 'Slides in from left to right with friction drag' },
  { id: 'paper_slide_up', name: 'Paper Slide Up', category: 'paper', description: 'Pushed upward onto desk surface with paper rustle settle' },
  { id: 'paper_slide_down', name: 'Paper Slide Down', category: 'paper', description: 'Slid down into place with stop-motion stepped cadence' },
  { id: 'photo_stack', name: 'Photo Stack Land', category: 'paper', description: 'Lands on top of existing stack with micro rotational jitter' },
  { id: 'paper_reveal', name: 'Paper Reveal', category: 'paper', description: 'Unfolding or sliding paper reveal from behind another layer' },
  { id: 'typewriter', name: 'Typewriter Text', category: 'text', description: 'Staccato mechanical character-by-character reveal at 24 chars/sec' },
  { id: 'headline_pop', name: 'Headline Pop', category: 'text', description: 'Immediate physical paste-on with 1.08x overshoot and instant snap' },
  { id: 'stamp_in', name: 'Official Stamp', category: 'graphic', description: 'Rapid downward impact with ink spread and micro dust bounce' },
  { id: 'arrow_draw', name: 'Red Arrow Draw', category: 'graphic', description: 'Hand-drawn marker stroke animating along trajectory curve with arrowhead' },
  { id: 'string_draw', name: 'Red String Tension', category: 'graphic', description: 'Pin-to-pin red yarn line drawing between two focal points' },
];
