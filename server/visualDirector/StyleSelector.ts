import { VisualStyleDefinition, VisualStyleId, VISUAL_STYLE_REGISTRY, getStyle } from './StyleRegistry.ts';
import { scoreDiversity, VisualHistoryItem } from './DiversityEngine.ts';

export interface ContentAnalysis { subject: string; informationType: string[]; visualNeeds: string[]; emotionalTone: string; importance: 'low'|'medium'|'high'; era?: string; location?: string; }
export interface StyleSelection { style: VisualStyleId; variant: string; layout: string; reason: string[]; diversityPenalty: number; warnings: string[]; }

const keywordMap: Array<{ terms: string[]; styles: VisualStyleId[] }> = [
  { terms:['crime','investigation','scandal','mystery','leak','expose'], styles:['investigative','case_file','evidence_board'] },
  { terms:['war','border','country','trade','migration','territory','geopolit'], styles:['map_intelligence','geopolitical','timeline'] },
  { terms:['money','market','stock','bank','economy','finance','revenue','inflation'], styles:['financial_terminal','data_documentary','newspaper'] },
  { terms:['science','physics','biology','dna','space','experiment','research'], styles:['scientific_lab','blueprint','data_documentary'] },
  { terms:['technology','computer','software','internet','ai','robot','engineering'], styles:['blueprint','cyber_intelligence','modern_editorial'] },
  { terms:['history','ancient','century','war','president','revolution','empire'], styles:['archive_museum','timeline','classic_vox'] },
  { terms:['compare','versus','before','after','difference','both','two sides'], styles:['split_screen','data_documentary','newspaper'] },
  { terms:['architecture','building','machine','process','how it works','system'], styles:['blueprint','scientific_lab','modern_editorial'] },
];

function scoreStyle(style: VisualStyleDefinition, analysis: ContentAnalysis): number {
  const haystack = `${analysis.subject} ${analysis.informationType.join(' ')} ${analysis.visualNeeds.join(' ')} ${analysis.era || ''} ${analysis.location || ''}`.toLowerCase();
  let score = 0;
  for (const term of style.bestFor) if (haystack.includes(term.toLowerCase())) score += 4;
  for (const group of keywordMap) if (group.styles.includes(style.id) && group.terms.some((term) => haystack.includes(term))) score += 7;
  if (analysis.importance === 'high' && ['data_documentary','timeline','map_intelligence','financial_terminal'].includes(style.id)) score += 2;
  if (analysis.emotionalTone === 'serious' && ['investigative','case_file','geopolitical','archive_museum'].includes(style.id)) score += 2;
  return score;
}

export function selectVisualStyle(analysis: ContentAnalysis, history: VisualHistoryItem[] = [], preferredStyle?: string): StyleSelection {
  const candidates = VISUAL_STYLE_REGISTRY.map((style) => ({ style, baseScore: scoreStyle(style, analysis) }))
    .sort((a,b) => b.baseScore - a.baseScore);
  const top = candidates.slice(0, Math.min(8, candidates.length));
  let selected = top[0]?.style || getStyle('classic_vox');
  let best = Number.POSITIVE_INFINITY;
  if (preferredStyle && preferredStyle !== 'auto') {
    const preferred = VISUAL_STYLE_REGISTRY.find((x) => x.id === preferredStyle);
    if (preferred) selected = preferred;
  } else {
    for (const candidate of top) {
      const layout = candidate.style.layouts[history.length % candidate.style.layouts.length];
      const diversity = scoreDiversity({ style: candidate.style.id, layout }, history);
      const score = diversity.penalty - candidate.baseScore;
      if (score < best) { best = score; selected = candidate.style; }
    }
  }
  const layout = selected.layouts[history.length % selected.layouts.length];
  const diversity = scoreDiversity({ style: selected.id, layout }, history);
  const variant = analysis.emotionalTone === 'serious' ? 'dramatic' : analysis.importance === 'high' ? 'dense' : 'clean';
  return {
    style: selected.id,
    variant,
    layout,
    reason: [`content:${analysis.subject}`, `information:${analysis.informationType.join(',') || 'documentary'}`, `visualNeeds:${analysis.visualNeeds.slice(0,4).join(',') || 'editorial'}`],
    diversityPenalty: diversity.penalty,
    warnings: diversity.warnings,
  };
}

export function analyzeBeat(narration: string, visualIdea = ''): ContentAnalysis {
  const text = `${narration} ${visualIdea}`.trim();
  const lower = text.toLowerCase();
  const informationType: string[] = [];
  if (/\b(19|20)\d{2}\b|century|year|histor|ancient|revolution/.test(lower)) informationType.push('historical_event');
  if (/\$|money|market|stock|bank|econom|revenue|percent|%/.test(lower)) informationType.push('economic');
  if (/map|country|city|border|route|migration|global/.test(lower)) informationType.push('geographic');
  if (/data|number|million|billion|percent|statistics|rate/.test(lower)) informationType.push('statistics');
  if (/investig|crime|scandal|evidence|secret|leak/.test(lower)) informationType.push('investigation');
  if (/system|process|machine|how|technology|software|ai|engineering/.test(lower)) informationType.push('technical');
  if (!informationType.length) informationType.push('narrative');
  const visualNeeds = [
    /date|year|century/.test(lower) ? 'date' : '',
    /map|country|city|route|border/.test(lower) ? 'map' : '',
    /data|number|million|billion|percent|%/.test(lower) ? 'chart' : '',
    /photo|person|portrait|leader/.test(lower) ? 'portrait' : '',
    /document|evidence|letter|report/.test(lower) ? 'document' : '',
  ].filter(Boolean);
  const emotionalTone = /crisis|war|death|scandal|collapse|shock|danger/.test(lower) ? 'serious' : /victory|success|growth|breakthrough/.test(lower) ? 'uplifting' : 'neutral';
  return { subject: narration.slice(0,120), informationType, visualNeeds, emotionalTone, importance: /critical|key|turning point|shock|collapse|breakthrough/.test(lower) ? 'high' : 'medium' };
}
