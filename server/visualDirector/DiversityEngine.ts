import { VisualStyleId } from './StyleRegistry.ts';

export interface VisualHistoryItem { style: VisualStyleId; layout: string; motion: string; assetTypes: string[]; }
export interface DiversityDecision { penalty: number; warnings: string[]; avoidStyles: VisualStyleId[]; avoidLayouts: string[]; }

export function scoreDiversity(candidate: { style: VisualStyleId; layout: string; motion?: string; assetTypes?: string[] }, history: VisualHistoryItem[]): DiversityDecision {
  const recent = history.slice(-6);
  const warnings: string[] = [];
  const avoidStyles: VisualStyleId[] = [];
  const avoidLayouts: string[] = [];
  let penalty = 0;
  const styleRepeats = recent.filter((x) => x.style === candidate.style).length;
  const layoutRepeats = recent.filter((x) => x.layout === candidate.layout).length;
  const motionRepeats = candidate.motion ? recent.filter((x) => x.motion === candidate.motion).length : 0;
  if (styleRepeats >= 2) { penalty += 35; warnings.push('STYLE_REPETITION_HIGH'); avoidStyles.push(candidate.style); }
  else if (styleRepeats === 1) { penalty += 10; warnings.push('STYLE_RECENT'); }
  if (layoutRepeats >= 2) { penalty += 30; warnings.push('COMPOSITION_REPETITION_HIGH'); avoidLayouts.push(candidate.layout); }
  else if (layoutRepeats === 1) penalty += 8;
  if (motionRepeats >= 2) { penalty += 15; warnings.push('MOTION_REPETITION_HIGH'); }
  const assetTypes = new Set(candidate.assetTypes || []);
  const previousTypes = new Set(recent.flatMap((x) => x.assetTypes));
  if (assetTypes.size && [...assetTypes].every((x) => previousTypes.has(x))) { penalty += 8; warnings.push('ASSET_LANGUAGE_REPETITION'); }
  return { penalty: Math.min(100, penalty), warnings, avoidStyles, avoidLayouts };
}

export function chooseDiverse<T extends { id: VisualStyleId; layouts: string[] }>(candidates: T[], history: VisualHistoryItem[]): T {
  return [...candidates].sort((a, b) => {
    const aa = scoreDiversity({ style: a.id, layout: a.layouts[0] }, history).penalty;
    const bb = scoreDiversity({ style: b.id, layout: b.layouts[0] }, history).penalty;
    return aa - bb;
  })[0] || candidates[0];
}
