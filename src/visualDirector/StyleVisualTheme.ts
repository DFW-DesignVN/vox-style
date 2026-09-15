export type ClientVisualStyleId =
  | 'classic_vox' | 'investigative' | 'newspaper' | 'timeline' | 'map_intelligence'
  | 'data_documentary' | 'blueprint' | 'case_file' | 'archive_museum' | 'modern_editorial'
  | 'financial_terminal' | 'cyber_intelligence' | 'scientific_lab' | 'geopolitical'
  | 'minimal_cinematic' | 'photo_essay' | 'split_screen' | 'evidence_board' | 'mixed_media';

export interface ClientVisualTheme {
  bg:string; panel:string; ink:string; muted:string; accent:string; secondary:string;
  imageFilter:string; frame:'paper'|'clean'|'terminal'|'blueprint'|'split';
  radius:number; shadow:boolean; halftone:boolean; vignette:boolean;
}

const themes: Record<ClientVisualStyleId, ClientVisualTheme> = {
  classic_vox:{bg:'#E9E0CC',panel:'#F4EEDA',ink:'#161411',muted:'#6E665A',accent:'#C62828',secondary:'#D8A928',imageFilter:'grayscale(100%) contrast(122%)',frame:'paper',radius:0,shadow:true,halftone:true,vignette:false},
  investigative:{bg:'#24211E',panel:'#EFE7D2',ink:'#111111',muted:'#9A9286',accent:'#C62828',secondary:'#D9C9A3',imageFilter:'grayscale(100%) contrast(125%)',frame:'paper',radius:0,shadow:true,halftone:true,vignette:false},
  newspaper:{bg:'#E7E2D6',panel:'#F8F6EF',ink:'#141414',muted:'#5B5B56',accent:'#B51F2A',secondary:'#D6B84A',imageFilter:'grayscale(100%) contrast(120%)',frame:'paper',radius:0,shadow:true,halftone:true,vignette:false},
  timeline:{bg:'#EEE6D3',panel:'#F8F3E7',ink:'#1B1B18',muted:'#746C5C',accent:'#B3262E',secondary:'#C8A63A',imageFilter:'contrast(105%) saturate(90%)',frame:'clean',radius:8,shadow:true,halftone:false,vignette:false},
  map_intelligence:{bg:'#D8C8A5',panel:'#E8D9B9',ink:'#28231B',muted:'#766A55',accent:'#B5262D',secondary:'#566D78',imageFilter:'sepia(25%) contrast(105%)',frame:'paper',radius:0,shadow:true,halftone:false,vignette:false},
  data_documentary:{bg:'#F1F0EA',panel:'#FFFFFF',ink:'#111111',muted:'#666666',accent:'#C62828',secondary:'#D1AA31',imageFilter:'contrast(105%) saturate(92%)',frame:'clean',radius:18,shadow:false,halftone:false,vignette:false},
  blueprint:{bg:'#183A57',panel:'#244E70',ink:'#F5F7FA',muted:'#AFC7D8',accent:'#E85B4F',secondary:'#D8E5EE',imageFilter:'grayscale(30%) contrast(120%)',frame:'blueprint',radius:0,shadow:false,halftone:false,vignette:false},
  case_file:{bg:'#A98962',panel:'#F0E3C7',ink:'#17130F',muted:'#5F503D',accent:'#B3262E',secondary:'#D5B44B',imageFilter:'sepia(18%) contrast(112%)',frame:'paper',radius:0,shadow:true,halftone:false,vignette:false},
  archive_museum:{bg:'#EAE2D2',panel:'#F8F4E9',ink:'#29251F',muted:'#7B7265',accent:'#9B3B36',secondary:'#A58B58',imageFilter:'sepia(12%) contrast(105%)',frame:'clean',radius:4,shadow:true,halftone:false,vignette:false},
  modern_editorial:{bg:'#F5F5F3',panel:'#FFFFFF',ink:'#101010',muted:'#707070',accent:'#D62C32',secondary:'#B8B8B0',imageFilter:'contrast(108%) saturate(105%)',frame:'clean',radius:18,shadow:false,halftone:false,vignette:false},
  financial_terminal:{bg:'#101516',panel:'#172021',ink:'#F2F4EF',muted:'#84918A',accent:'#E04A4A',secondary:'#86A98C',imageFilter:'contrast(112%) saturate(90%)',frame:'terminal',radius:2,shadow:false,halftone:false,vignette:true},
  cyber_intelligence:{bg:'#090D10',panel:'#111A20',ink:'#E8F0F4',muted:'#6E8895',accent:'#FF4D55',secondary:'#6CA6B8',imageFilter:'contrast(115%) saturate(85%)',frame:'terminal',radius:2,shadow:false,halftone:false,vignette:true},
  scientific_lab:{bg:'#EDF0ED',panel:'#FFFFFF',ink:'#1B2424',muted:'#6E7977',accent:'#C63C3C',secondary:'#7895A0',imageFilter:'contrast(105%) saturate(90%)',frame:'clean',radius:14,shadow:false,halftone:false,vignette:false},
  geopolitical:{bg:'#D8C8A5',panel:'#F0E4C6',ink:'#191713',muted:'#716652',accent:'#BD292E',secondary:'#A88735',imageFilter:'sepia(18%) contrast(110%)',frame:'paper',radius:0,shadow:true,halftone:false,vignette:false},
  minimal_cinematic:{bg:'#101010',panel:'#1A1A1A',ink:'#FAFAF7',muted:'#A0A0A0',accent:'#D52D32',secondary:'#D0D0CC',imageFilter:'contrast(112%) saturate(88%)',frame:'clean',radius:0,shadow:true,halftone:false,vignette:true},
  photo_essay:{bg:'#F0EEE9',panel:'#FFFFFF',ink:'#161616',muted:'#77736C',accent:'#B6292F',secondary:'#BDB7AB',imageFilter:'contrast(108%) saturate(102%)',frame:'clean',radius:4,shadow:true,halftone:false,vignette:false},
  split_screen:{bg:'#ECECE8',panel:'#FFFFFF',ink:'#111111',muted:'#686868',accent:'#C92F35',secondary:'#9B9B95',imageFilter:'contrast(105%) saturate(95%)',frame:'split',radius:0,shadow:false,halftone:false,vignette:false},
  evidence_board:{bg:'#9A7655',panel:'#EFE0C0',ink:'#191510',muted:'#65503C',accent:'#C52D32',secondary:'#D5B443',imageFilter:'sepia(20%) contrast(112%)',frame:'paper',radius:0,shadow:true,halftone:false,vignette:false},
  mixed_media:{bg:'#E6E0D2',panel:'#F6F2E7',ink:'#171717',muted:'#6D675C',accent:'#C62B31',secondary:'#C7A43C',imageFilter:'grayscale(55%) contrast(115%)',frame:'paper',radius:0,shadow:true,halftone:true,vignette:false},
};

export function getClientVisualTheme(styleId?:string, variant?:string):ClientVisualTheme{
  const base=themes[(styleId||'classic_vox') as ClientVisualStyleId]||themes.classic_vox;
  if(variant==='dark' && base.bg[0]==='#') return {...base,bg:'#111111',panel:'#1B1B1B',ink:'#F5F5F2',vignette:true};
  if(variant==='minimal') return {...base,shadow:false,halftone:false};
  return base;
}
