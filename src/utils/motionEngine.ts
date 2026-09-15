import { MotionID } from '../types.ts';

export interface MotionTransform { offsetX:number; offsetY:number; scale:number; rotation:number; opacity:number; progress:number; revealedChars?:number; }
export function steppedEase(t:number,steps=12):number{return Math.floor(Math.max(0,Math.min(1,t))*steps)/steps;}
export function overshootSettle(t:number,overshoot=1.08):number{if(t<=0)return 0;if(t>=1)return 1;return 1+Math.sin(t*Math.PI)*(overshoot-1)*Math.exp(-t*3);}
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));

/** All motion IDs have a deterministic visible transform when assigned to an image asset. */
export function calculateMotionTransform(motion:MotionID,shotTime:number,startTime:number,textLength=0):MotionTransform{
  const elapsed=shotTime-startTime;
  if(elapsed<0)return {offsetX:0,offsetY:0,scale:0,rotation:0,opacity:0,progress:0,revealedChars:0};
  const t=(d:number)=>Math.min(1,Math.max(0,elapsed/d));
  const stepped=(d:number,s=12)=>steppedEase(t(d),s);
  const settle=(v:number,o=1.06)=>overshootSettle(v,o);
  switch(motion){
    case 'paper_drop':{const p=t(.45),e=settle(stepped(.45,10),1.05);return {offsetX:0,offsetY:-450*(1-e),scale:.95+.05*e,rotation:Math.sin(p*Math.PI)*2.5,opacity:Math.min(1,p*4),progress:p};}
    case 'paper_slide_left':{const p=t(.5),e=settle(stepped(.5),1.04);return {offsetX:550*(1-e),offsetY:0,scale:1,rotation:(1-e)*2,opacity:Math.min(1,p*5),progress:p};}
    case 'paper_slide_right':{const p=t(.5),e=settle(stepped(.5),1.04);return {offsetX:-550*(1-e),offsetY:0,scale:1,rotation:-(1-e)*2,opacity:Math.min(1,p*5),progress:p};}
    case 'paper_slide_up':{const p=t(.5),e=settle(stepped(.5),1.03);return {offsetX:0,offsetY:450*(1-e),scale:1,rotation:0,opacity:Math.min(1,p*4),progress:p};}
    case 'paper_slide_down':{const p=t(.5),e=settle(stepped(.5),1.03);return {offsetX:0,offsetY:-450*(1-e),scale:1,rotation:0,opacity:Math.min(1,p*4),progress:p};}
    case 'photo_stack':{const p=t(.55),e=settle(stepped(.55,9),1.07);return {offsetX:Math.sin(p*Math.PI)*18,offsetY:-300*(1-e),scale:.92+.08*e,rotation:(1-e)*6,opacity:Math.min(1,p*4),progress:p};}
    case 'paper_reveal':{const p=t(.55),e=stepped(.55,10);return {offsetX:0,offsetY:(1-e)*60,scale:.95+.05*e,rotation:(1-e)*-2,opacity:e,progress:p};}
    case 'headline_pop':{const p=t(.3),e=settle(p,1.15);return {offsetX:0,offsetY:0,scale:Math.max(.01,e),rotation:0,opacity:p>0?1:0,progress:p};}
    case 'stamp_in':{const p=t(.28),e=settle(p,1.25);return {offsetX:0,offsetY:(1-p)*-80,scale:.8+.2*e,rotation:(1-p)*-4,opacity:Math.min(1,p*6),progress:p};}
    case 'typewriter':{const chars=Math.floor(elapsed*22),revealed=Math.min(textLength,Math.max(0,chars));return {offsetX:18*(1-Math.min(1,elapsed/.25)),offsetY:0,scale:1,rotation:0,opacity:1,progress:textLength?clamp(revealed/textLength,0,1):1,revealedChars:revealed};}
    case 'arrow_draw':{const p=t(.6),e=stepped(.6,15);return {offsetX:Math.sin(e*Math.PI)*8,offsetY:0,scale:.96+.04*e,rotation:(1-e)*1.5,opacity:p>0?1:0,progress:e};}
    case 'string_draw':{const p=t(.6),e=stepped(.6,15);return {offsetX:Math.sin(e*Math.PI)*10,offsetY:Math.cos(e*Math.PI)*4,scale:.94+.06*e,rotation:(1-e)*-1.5,opacity:p>0?1:0,progress:e};}
    case 'number_pop':{const p=t(.4),e=settle(p,1.12);return {offsetX:0,offsetY:0,scale:Math.max(.01,e),rotation:0,opacity:p>0?1:0,progress:p};}
    case 'bar_grow':{const p=t(.65);return {offsetX:-140*(1-p),offsetY:0,scale:.7+.3*p,rotation:0,opacity:p,progress:p};}
    case 'diagram_draw':{const p=t(.7);return {offsetX:0,offsetY:(1-p)*35,scale:.9+.1*p,rotation:0,opacity:p,progress:p};}
    case 'annotation_reveal':{const p=t(.5);return {offsetX:20*(1-p),offsetY:0,scale:1,rotation:(1-p)*2,opacity:p,progress:p};}
    case 'node_connect':{const p=t(.7);return {offsetX:Math.sin(p*Math.PI)*12,offsetY:0,scale:.92+.08*p,rotation:0,opacity:p,progress:p};}
    case 'panel_slide':{const p=t(.5),e=settle(stepped(.5),1.04);return {offsetX:-420*(1-e),offsetY:0,scale:1,rotation:0,opacity:Math.min(1,p*5),progress:p};}
    case 'slow_reveal':{const p=t(1.2);return {offsetX:0,offsetY:50*(1-p),scale:.97+.03*p,rotation:0,opacity:p,progress:p};}
    case 'crop_reveal':{const p=t(.75);return {offsetX:70*(1-p),offsetY:0,scale:.88+.12*p,rotation:0,opacity:p,progress:p};}
    case 'ticker_slide':{const p=t(.55);return {offsetX:-500*(1-p),offsetY:0,scale:1,rotation:0,opacity:Math.min(1,p*5),progress:p};}
    default:return {offsetX:0,offsetY:0,scale:1,rotation:0,opacity:1,progress:1};
  }
}
