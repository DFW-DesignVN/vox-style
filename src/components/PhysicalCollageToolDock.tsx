import React from 'react';
import { Layers, Move3d, Film, RotateCcw, Info } from 'lucide-react';
import { PhysicalCollageParams, Shot } from '../types.ts';

const DEFAULTS: PhysicalCollageParams = { enabled:true, paperLift:35, shadowDepth:45, edgeRoughness:20, tapeStrength:60, depthParallax:18, stopMotion:true, frameStep:2, rotationJitter:3, positionJitter:2, settleAmount:70, holdFrames:2 };

const labels: Record<string,string> = {
  paperLift:'Độ nhấc giấy', shadowDepth:'Độ sâu bóng', edgeRoughness:'Độ thô mép giấy', tapeStrength:'Độ bám băng keo', depthParallax:'Độ sâu lớp / parallax',
  frameStep:'Bước khung hình', rotationJitter:'Rung xoay', positionJitter:'Rung vị trí', settleAmount:'Độ ổn định khi hạ xuống', holdFrames:'Giữ khung hình'
};
const help: Record<string,string> = {
  paperLift:'Tạo cảm giác tờ giấy nằm nổi trên mặt bàn.', shadowDepth:'Tăng bóng đổ để phân biệt các lớp giấy.', edgeRoughness:'Mép càng cao càng giống giấy cắt thủ công.', tapeStrength:'Độ rõ của tape giữ ảnh/tài liệu.', depthParallax:'Khoảng cách thị giác giữa các lớp khi chuyển động.', frameStep:'1 = mượt; 2–3 = stop-motion rõ; 4+ = giật mạnh.', rotationJitter:'Độ lệch góc nhỏ giữa các frame.', positionJitter:'Độ lệch vị trí nhỏ giữa các frame.', settleAmount:'Vật thể rung rồi dần đứng yên.', holdFrames:'Số frame giữ nguyên trước khi đổi pose.'
};

interface Props { shot:Shot; onUpdate:(patch:Partial<Shot>)=>void; lang?:'vi'|'en'; }

export const PhysicalCollageToolDock:React.FC<Props>=({shot,onUpdate})=>{
 const p={...DEFAULTS,...shot.physicalCollage};
 const update=(key:keyof PhysicalCollageParams,value:number|boolean)=>onUpdate({physicalCollage:{...p,[key]:value} as PhysicalCollageParams});
 const Slider=({k,min,max,step=1}:{k:keyof PhysicalCollageParams;min:number;max:number;step?:number})=><div className="space-y-1.5"><div className="flex justify-between gap-2"><span className="text-[10px] text-zinc-300">{labels[k]}</span><span className="text-[10px] font-mono text-amber-400">{p[k] as number}</span></div><input aria-label={labels[k]} type="range" min={min} max={max} step={step} value={p[k] as number} onChange={e=>update(k,Number(e.target.value))} className="w-full accent-amber-500"/><div className="text-[9px] text-zinc-600">{help[k]}</div></div>;
 return <aside className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col gap-4 shadow-xl">
  <div className="flex items-center justify-between border-b border-zinc-800 pb-3"><div><div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400"><Layers className="w-4 h-4"/>COLLAGE VẬT LÝ</div><div className="text-[10px] text-zinc-500 mt-1">Điều khiển giấy, ảnh, tape và chiều sâu</div></div><button onClick={()=>onUpdate({physicalCollage:DEFAULTS})} title="Đặt lại thông số" className="p-1.5 rounded border border-zinc-800 text-zinc-500 hover:text-amber-300"><RotateCcw className="w-3.5 h-3.5"/></button></div>
  <label className="flex items-center justify-between bg-zinc-900 rounded border border-zinc-800 p-2.5 cursor-pointer"><span className="flex items-center gap-2 text-xs text-zinc-200"><Move3d className="w-3.5 h-3.5 text-sky-400"/>Bật hiệu ứng vật lý</span><input type="checkbox" checked={p.enabled} onChange={e=>update('enabled',e.target.checked)} className="accent-amber-500"/></label>
  <div className="space-y-3"><Slider k="paperLift" min={0} max={100}/><Slider k="shadowDepth" min={0} max={100}/><Slider k="edgeRoughness" min={0} max={100}/><Slider k="tapeStrength" min={0} max={100}/><Slider k="depthParallax" min={0} max={50}/></div>
  <div className="border-t border-zinc-800 pt-3"><div className="flex items-center gap-2 text-xs font-mono font-bold text-red-300 mb-2"><Film className="w-3.5 h-3.5"/>STOP-MOTION — CHUYỂN ĐỘNG TỪNG KHUNG</div><div className="text-[10px] text-zinc-500 mb-3">Dùng khi muốn cảm giác thủ công: ảnh/giấy hơi lệch giữa các frame rồi tự ổn định.</div><label className="flex items-center justify-between bg-zinc-900 rounded border border-zinc-800 p-2 mb-3"><span className="text-xs text-zinc-200">Bật stop-motion</span><input type="checkbox" checked={p.stopMotion} onChange={e=>update('stopMotion',e.target.checked)} className="accent-red-500"/></label><div className="space-y-3"><Slider k="frameStep" min={1} max={6}/><Slider k="rotationJitter" min={0} max={12}/><Slider k="positionJitter" min={0} max={12}/><Slider k="settleAmount" min={0} max={100}/><Slider k="holdFrames" min={0} max={8}/></div></div>
  <div className="flex gap-2 p-2.5 rounded bg-amber-950/20 border border-amber-900/40 text-[10px] text-amber-200"><Info className="w-3.5 h-3.5 shrink-0 mt-0.5"/><span><b>Gợi ý:</b> tài liệu điều tra: Lift 35–50, Shadow 45–65, Parallax 15–25. Stop-motion: bước 2, rung xoay 2–4, rung vị trí 1–3, ổn định 65–80.</span></div>
 </aside>;
};
