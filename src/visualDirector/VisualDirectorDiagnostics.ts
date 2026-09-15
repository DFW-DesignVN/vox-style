import { VISUAL_STYLES, VisualStyleEntry } from './StyleDirector.ts';
import { Project } from '../types.ts';

export interface VisualDirectorDiagnostics {
  totalStyles:number;
  totalCategories:number;
  uniqueLayouts:number;
  uniqueMotions:number;
  styleCoverage:number;
  motionCoverage:number;
  repeatedStyles:number;
  repeatedLayouts:number;
  warnings:string[];
}

export function getVisualDirectorDiagnostics(project:Project):VisualDirectorDiagnostics{
  const shots=project.shots||[];
  const styles=shots.map(s=>s.visualStyle).filter(Boolean) as string[];
  const layouts=shots.map(s=>s.layout).filter(Boolean);
  const motions=shots.flatMap(s=>s.assets||[]).map(a=>a.motion).filter(Boolean);
  const countRepeated=(values:string[])=>new Set(values.filter((v,i)=>values.indexOf(v)!==i)).size;
  const styleCoverage=VISUAL_STYLES.length?new Set(styles).size/VISUAL_STYLES.length:0;
  const warnings:string[]=[];
  if(shots.length>2&&new Set(styles).size<=1)warnings.push('STYLE_LOCKED_TOO_LONG');
  if(shots.length>3&&new Set(layouts).size<=1)warnings.push('LAYOUT_REPETITION_HIGH');
  if(shots.length>3&&new Set(motions).size<=1)warnings.push('MOTION_REPETITION_HIGH');
  if(shots.some(s=>!s.assets?.length))warnings.push('SHOT_WITHOUT_ASSET');
  if(shots.some(s=>!s.visualStyle))warnings.push('SHOT_WITHOUT_STYLE');
  return{totalStyles:VISUAL_STYLES.length,totalCategories:new Set(VISUAL_STYLES.map(s=>s.category)).size,uniqueLayouts:new Set(layouts).size,uniqueMotions:new Set(motions).size,styleCoverage:Number(styleCoverage.toFixed(3)),motionCoverage:new Set(motions).size/36,repeatedStyles:countRepeated(styles),repeatedLayouts:countRepeated(layouts),warnings};
}

export function getStyleById(id:string|undefined):VisualStyleEntry|undefined{return VISUAL_STYLES.find(s=>s.id===id);}
