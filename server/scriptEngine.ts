export type ScriptSectionType =
  | 'cold_open'
  | 'context'
  | 'development'
  | 'turning_point'
  | 'conflict'
  | 'consequence'
  | 'analysis'
  | 'ending';

export interface ScriptSection {
  id: string;
  type: ScriptSectionType;
  title: string;
  text: string;
  targetWords: number;
  actualWords: number;
}

export interface ScriptDocument {
  title: string;
  topic: string;
  language: string;
  durationSeconds: number;
  wordsPerSecond: number;
  targetWords: number;
  actualWords: number;
  tolerancePercent: number;
  sections: ScriptSection[];
  narration: string;
}

export interface ScriptValidationIssue {
  code: string;
  severity: 'error' | 'warning';
  message: string;
}

export interface ScriptValidationResult {
  valid: boolean;
  actualWords: number;
  targetWords: number;
  deviationPercent: number;
  estimatedDurationSeconds: number;
  issues: ScriptValidationIssue[];
}

export interface ScriptConstraints {
  durationSeconds: number;
  wordsPerSecond?: number;
  tolerancePercent?: number;
  minSections?: number;
  maxSections?: number;
  language?: string;
}

const DEFAULT_WPS = 2.5;
const DEFAULT_TOLERANCE = 3;
const REQUIRED_SECTION_TYPES: ScriptSectionType[] = ['cold_open', 'context', 'turning_point', 'ending'];

export function countWords(text: string): number {
  return String(text || '')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function normalizeNarration(text: string): string {
  return String(text || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\[(?:visual|image|show|cut|pause|music|sfx)[^\]]*\]/gi, ' ')
    .replace(/^\s*(?:narration|voiceover|script)\s*:\s*/gim, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function calculateTargetWords(durationSeconds: number, wordsPerSecond = DEFAULT_WPS): number {
  return Math.max(1, Math.round(Number(durationSeconds) * wordsPerSecond));
}

export function validateScript(script: Partial<ScriptDocument> & { narration?: string }, constraints: ScriptConstraints): ScriptValidationResult {
  const duration = Number(constraints.durationSeconds);
  const wps = Number(constraints.wordsPerSecond || DEFAULT_WPS);
  const tolerance = Number(constraints.tolerancePercent ?? DEFAULT_TOLERANCE);
  const targetWords = calculateTargetWords(duration, wps);
  const narration = normalizeNarration(script.narration || '');
  const actualWords = countWords(narration);
  const deviationPercent = targetWords > 0 ? ((actualWords - targetWords) / targetWords) * 100 : 100;
  const estimatedDurationSeconds = actualWords / wps;
  const issues: ScriptValidationIssue[] = [];

  if (actualWords < 30) {
    issues.push({ code: 'SCRIPT_TOO_SHORT', severity: 'error', message: 'Kịch bản quá ngắn để tạo video tài liệu.' });
  }
  if (Math.abs(deviationPercent) > tolerance) {
    issues.push({
      code: 'WORD_COUNT_OUT_OF_RANGE',
      severity: 'error',
      message: `Số từ ${actualWords}/${targetWords} lệch ${deviationPercent.toFixed(1)}%, vượt dung sai ±${tolerance}%.`
    });
  }
  if (/[\[{<](?:insert|todo|placeholder|visual cue|show image|scene)/i.test(narration)) {
    issues.push({ code: 'PLACEHOLDER_TEXT', severity: 'error', message: 'Kịch bản còn placeholder hoặc chỉ dẫn dựng hình trong lời thuyết minh.' });
  }
  if (/^(here is|sure[,!]?|of course|as an ai|dưới đây là|tất nhiên)/i.test(narration)) {
    issues.push({ code: 'AI_META_TEXT', severity: 'error', message: 'Kịch bản chứa câu mở đầu kiểu trợ lý AI thay vì narration.' });
  }
  if (/(\bTODO\b|\bTBD\b|\[INSERT|\[PLACEHOLDER)/i.test(narration)) {
    issues.push({ code: 'UNFINISHED_TEXT', severity: 'error', message: 'Kịch bản có dấu hiệu chưa hoàn thiện.' });
  }

  const sections = Array.isArray(script.sections) ? script.sections : [];
  const minSections = constraints.minSections ?? 4;
  const maxSections = constraints.maxSections ?? 12;
  if (sections.length < minSections) {
    issues.push({ code: 'SECTION_COUNT_LOW', severity: 'error', message: `Cần ít nhất ${minSections} phần nội dung.` });
  }
  if (sections.length > maxSections) {
    issues.push({ code: 'SECTION_COUNT_HIGH', severity: 'error', message: `Không được vượt quá ${maxSections} phần nội dung.` });
  }
  const sectionTypes = new Set(sections.map(section => section.type));
  for (const required of REQUIRED_SECTION_TYPES) {
    if (!sectionTypes.has(required)) {
      issues.push({ code: `MISSING_${required.toUpperCase()}`, severity: 'error', message: `Thiếu section bắt buộc: ${required}.` });
    }
  }
  if (!narration.endsWith('.') && !narration.endsWith('!') && !narration.endsWith('?') && !narration.endsWith('…')) {
    issues.push({ code: 'ENDING_INCOMPLETE', severity: 'warning', message: 'Narration không kết thúc bằng câu hoàn chỉnh.' });
  }

  return {
    valid: issues.every(issue => issue.severity !== 'error'),
    actualWords,
    targetWords,
    deviationPercent,
    estimatedDurationSeconds: Number(estimatedDurationSeconds.toFixed(3)),
    issues,
  };
}

export function buildScriptSystemPrompt(constraints: ScriptConstraints, topic: string, niche: string): string {
  const duration = Number(constraints.durationSeconds);
  const wps = Number(constraints.wordsPerSecond || DEFAULT_WPS);
  const target = calculateTargetWords(duration, wps);
  const language = constraints.language || 'vi';
  return `You are a strict documentary script engine for a VOX-style production pipeline.\n\nTOPIC: ${topic}\nNICHE: ${niche}\nLANGUAGE: ${language}\nTARGET DURATION: ${duration}s\nTARGET WORDS: exactly about ${target} words at ${wps} words/second\nWORD TOLERANCE: ±${constraints.tolerancePercent ?? DEFAULT_TOLERANCE}%\n\nNON-NEGOTIABLE RULES:\n1. Return JSON only. No markdown and no commentary.\n2. Return 4-12 sections. Required section types: cold_open, context, turning_point, ending.\n3. The narration is continuous documentary prose. Never include [VISUAL], [IMAGE], camera directions, SFX, music cues, stage directions, placeholders, or AI meta commentary.\n4. Keep the narration within the requested word-count tolerance. Do not invent extra sections to hide word-count errors.\n5. Cold open must immediately create curiosity.\n6. Build context before the main development, then a clear turning point, consequences/analysis, and a concise ending.\n7. Ending must resolve the central thread and end with a memorable noun, name, or date; no generic 'thanks for watching'.\n8. Every section must contain actual narration and an explicit targetWords value.\n9. The top-level narration must equal the concatenation of section text in order.\n10. Do not fabricate facts. If the source material is insufficient, clearly mark uncertain claims in the narration rather than inventing specifics.\n\nJSON SHAPE:\n{\n  "title": "...",\n  "topic": "...",\n  "language": "${language}",\n  "durationSeconds": ${duration},\n  "wordsPerSecond": ${wps},\n  "targetWords": ${target},\n  "actualWords": 0,\n  "tolerancePercent": ${constraints.tolerancePercent ?? DEFAULT_TOLERANCE},\n  "sections": [{"id":"s01","type":"cold_open|context|development|turning_point|conflict|consequence|analysis|ending","title":"...","text":"...","targetWords":0,"actualWords":0}],\n  "narration": "..."\n}`;
}

export function repairScriptPrompt(document: Partial<ScriptDocument>, validation: ScriptValidationResult): string {
  return `Repair this documentary script without changing its factual meaning.\nTarget: ${validation.targetWords} words. Current: ${validation.actualWords}. Allowed deviation: ±${validation.targetWords ? ((validation.targetWords * 3) / 100).toFixed(0) : 0} words.\nIssues: ${validation.issues.map(i => i.code + ': ' + i.message).join(' | ')}\n\nReturn the same strict JSON schema. Preserve required section types, remove meta commentary/placeholders, keep continuous narration, and make the top-level narration exactly equal to section text concatenation.`;
}
