import { getCompositionFrame, type CompositionFrame } from './CompositionEngine.ts';
import type { ClientVisualStyleId } from './StyleVisualTheme.ts';

export interface SemanticVisualInput { narration:string; visualIdea?:string; topic?:string; assetCount?:number; }
export interface SemanticVisualPlan {
  visualStyle: ClientVisualStyleId;
  styleVariant:'light'|'dark'|'minimal'|'archival'|'technical'|'editorial';
  styleReason:string;
  compositionGrammar:string;
  layout:string;
  hierarchy:{primary:string;secondary:string;supporting:string};
  frames:CompositionFrame[];
  recommendedAssetRoles:Array<'hero'|'secondary'|'background'|'detail'>;
}
const has=(text:string, patterns:RegExp[])=>patterns.some(p=>p.test(text));

/** Deterministic semantic fallback: explicit visual signals beat generic topic guesses. */
export function selectSemanticVisualStyle(input:SemanticVisualInput):ClientVisualStyleId{
  const t=`${input.narration} ${input.visualIdea||''} ${input.topic||''}`.toLowerCase();
  if(has(t,[/\b(before|after|versus|vs\.?|compare|comparison|trước|sau|so sánh|đối đầu|hai phía)\b/])) return 'split_screen';
  if(has(t,[/\b(stat|statistics|percent|percentage|rate|number|million|billion|revenue|growth|decline|data|chart|graph|tỷ lệ|phần trăm|số liệu|tăng trưởng|doanh thu)\b/,/\d+%/])) return 'data_documentary';
  if(has(t,[/\b(stock|market|wall street|finance|financial|investor|shares|price|earnings|ngân hàng|chứng khoán|thị trường|tài chính|cổ phiếu)\b/])) return 'financial_terminal';
  if(has(t,[/\b(cyber|hack|hacker|malware|ransomware|network|server|encryption|breach|cybersecurity|an ninh mạng|tin tặc|mã độc)\b/])) return 'cyber_intelligence';
  if(has(t,[/\b(science|scientist|experiment|laboratory|lab|research|cell|dna|gene|physics|biology|khoa học|thí nghiệm|nghiên cứu|gen)\b/])) return 'scientific_lab';
  if(has(t,[/\b(engine|mechanism|machine|technical|engineering|architecture|schematic|circuit|how it works|kỹ thuật|cơ chế|máy móc|sơ đồ|kiến trúc)\b/])) return 'blueprint';
  if(has(t,[/\b(map|route|border|country|countries|region|territory|geography|supply chain|biên giới|bản đồ|quốc gia|khu vực|tuyến đường)\b/])) return 'map_intelligence';
  if(has(t,[/\b(geopolit|alliance|war|conflict|diplomacy|sanction|NATO|treaty|ngoại giao|địa chính trị|xung đột|chiến tranh|hiệp ước)\b/])) return 'geopolitical';
  if(has(t,[/\b(clue|evidence|mystery|suspect|investigation|investigate|dossier|hồ sơ|bằng chứng|manh mối|nghi phạm|điều tra)\b/])) return 'evidence_board';
  if(has(t,[/\b(case file|court|trial|document|record|file|dossier|hồ sơ vụ án|tài liệu|biên bản)\b/])) return 'case_file';
  if(has(t,[/\b(timeline|year|years|century|decade|năm \d{3,4}|thế kỷ|thập kỷ|sau đó|tiếp theo)\b/])) return 'timeline';
  if(has(t,[/\b(artifact|museum|relic|manuscript|ancient|archaeology|di vật|bảo tàng|cổ vật|bản thảo|khảo cổ)\b/])) return 'archive_museum';
  if(has(t,[/\b(newspaper|headline|breaking news|journalism|press|news report|báo chí|tin tức|tiêu đề)\b/])) return 'newspaper';
  if(has(t,[/\b(photo|photograph|portrait|street|human story|interview|travel|landscape|ảnh|chân dung|phóng sự|con người|du lịch)\b/])) return 'photo_essay';
  if(has(t,[/\b(cold open|reveal|shock|dramatic|emotional|moment|silence|bí mật|khoảnh khắc|cao trào|hé lộ)\b/])) return 'minimal_cinematic';
  if(has(t,[/\b(business|startup|technology|culture|premium|industry|company|doanh nghiệp|công nghệ|văn hóa|thương hiệu)\b/])) return 'modern_editorial';
  if(has(t,[/\b(collage|mixed media|newspaper clipping|map and photo|document and photo|cắt dán|nhiều lớp|tư liệu)\b/])) return 'mixed_media';
  if(has(t,[/\b(investigative|scandal|corruption|cover[- ]up|whistleblower|tham nhũng|bê bối)\b/])) return 'investigative';
  return 'classic_vox';
}

export function buildSemanticVisualPlan(input:SemanticVisualInput):SemanticVisualPlan{
  const style=selectSemanticVisualStyle(input), count=Math.max(1,Math.min(8,input.assetCount||3));
  const roles:Array<'hero'|'secondary'|'background'|'detail'>=['hero',...Array(Math.max(0,count-1)).fill('secondary')];
  const grammar:Record<string,string>={classic_vox:'archival hero with layered paper evidence',investigative:'evidence stack with offset exhibits',newspaper:'editorial newspaper columns',timeline:'chronology cards on a visual axis',map_intelligence:'map-centric signal field',data_documentary:'metric blocks with dominant evidence visual',blueprint:'technical plate with callouts',case_file:'case dossier with exhibits',archive_museum:'museum exhibit presentation',modern_editorial:'asymmetric premium editorial grid',financial_terminal:'multi-panel market terminal',cyber_intelligence:'network signal and node board',scientific_lab:'specimen and research diagram',geopolitical:'regional briefing map',minimal_cinematic:'full-bleed sparse reveal',photo_essay:'full-bleed photographic essay',split_screen:'two-pane comparison',evidence_board:'node graph with connected exhibits',mixed_media:'layered paper collage'};
  const styleVariant=([ 'minimal_cinematic','photo_essay'].includes(style)?'minimal':['financial_terminal','cyber_intelligence','blueprint'].includes(style)?'technical':['modern_editorial','newspaper'].includes(style)?'editorial':['classic_vox','investigative','archive_museum','case_file','evidence_board','mixed_media'].includes(style)?'archival':'light') as SemanticVisualPlan['styleVariant'];
  return {visualStyle:style,styleVariant,styleReason:`Semantic signals selected ${style}; composition reinforces the information type instead of adding decoration.`,compositionGrammar:grammar[style],layout:style,hierarchy:{primary:'narrative hero visual',secondary:'supporting evidence or context',supporting:'labels, arrows and documentary texture'},frames:roles.map((role,i)=>getCompositionFrame(style,i,count,role)),recommendedAssetRoles:roles};
}
