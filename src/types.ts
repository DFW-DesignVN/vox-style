export type LayoutID =
  | 'hero_archive'
  | 'newspaper'
  | 'map'
  | 'photo_stack'
  | 'document'
  | 'big_number'
  | 'timeline'
  | 'collage_board';

export type MotionID =
  | 'paper_drop'
  | 'paper_slide_left'
  | 'paper_slide_right'
  | 'paper_slide_up'
  | 'paper_slide_down'
  | 'photo_stack'
  | 'paper_reveal'
  | 'typewriter'
  | 'headline_pop'
  | 'stamp_in'
  | 'arrow_draw'
  | 'string_draw';

export interface VisualAsset {
  id: string;
  type: 'image' | 'texture' | 'stamp' | 'tape' | 'cutout';
  role: 'hero' | 'secondary' | 'background' | 'detail';
  /** Resolved local/remote asset URL. Empty means the asset still needs generation. */
  source: string;
  /** AI Director's semantic request for an asset generator. */
  assetPrompt?: string;
  /** Provider hint for a future Asset Engine, e.g. gemini, local, upload. */
  provider?: string;
  position: { x: number; y: number }; // Percentage 0-100
  scale: number;
  rotation: number; // Degrees, e.g. -3 to +4
  motion: MotionID;
  start: number; // Seconds into the shot
  duration?: number;
  filter?: 'grayscale' | 'halftone' | 'high_contrast' | 'none';
  paperCutout?: boolean;
  shadow?: {
    enabled: boolean;
    offset: [number, number];
    blur: number;
    opacity: number;
  };
}

export interface TextElement {
  id: string;
  content: string;
  role: 'headline' | 'date' | 'big_number' | 'label' | 'sublabel';
  style: 'typewriter' | 'condensed_bold' | 'editorial_serif' | 'stamp';
  position: { x: number; y: number }; // Percentage 0-100
  motion: MotionID;
  start: number; // Seconds into the shot
  fontSize: number;
  color: string;
  highlightColor?: string;
  rotation?: number;
}

export interface GraphicElement {
  id: string;
  type:
    | 'arrow'
    | 'circle'
    | 'underline'
    | 'red_string'
    | 'marker'
    | 'stamp'
    | 'tape'
    | 'pin'
    | 'timeline_line';
  color: string;
  motion: MotionID;
  start: number; // Seconds into shot
  points?: [number, number][]; // Relative points 0-100
  position?: { x: number; y: number };
  scale?: number;
  rotation?: number;
}

export interface Shot {
  shot_id: string;
  order: number;
  start: number; // Overall timeline seconds
  end: number;
  duration: number; // Shot duration in seconds (2.0 - 5.5s)
  narration: string;
  visual_idea: string;
  layout: LayoutID;
  background: {
    type: 'newsprint' | 'archival' | 'map' | 'corkboard' | 'cream_aged';
    color?: string;
    textureUrl?: string;
  };
  assets: VisualAsset[];
  text: TextElement[];
  graphics: GraphicElement[];
  renderedThumbnail?: string;
  shotVideoUrl?: string;
}

export interface Project {
  project_id: string;
  title: string;
  duration: number;
  fps: number;
  resolution: '1920x1080';
  style: 'vox_paper_collage';
  voiceover: boolean;
  subtitles: boolean;
  sfx: boolean;
  shots: Shot[];
  script: string;
  voiceUrl?: string;
  finalVideoUrl?: string;
  createdAt: string;
}

export interface PresetLayout {
  id: LayoutID;
  name: string;
  description: string;
  defaultLayers: string[];
}

export interface PresetMotion {
  id: MotionID;
  name: string;
  category: 'paper' | 'text' | 'graphic';
  description: string;
}

export interface VisualStyleConfig {
  name: string;
  palette: {
    paper: string;
    black: string;
    gray: string;
    red: string;
    yellow: string;
    offWhite: string;
  };
  texture: {
    paper: boolean;
    grain: boolean;
    halftone: boolean;
  };
  shadows: {
    enabled: boolean;
    color: string;
    defaultBlur: number;
  };
  camera: {
    default: 'locked';
  };
}

export interface QualityGateResult {
  scriptValid: boolean;
  voiceValid: boolean;
  allShotsHaveAssets: boolean;
  textWithinSafeArea: boolean;
  timelineContinuous: boolean;
  ffmpegAvailable: boolean;
  readyToRender: boolean;
  messages: string[];
}
