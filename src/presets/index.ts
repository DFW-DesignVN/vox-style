import { PresetLayout, PresetMotion, VisualStyleConfig } from '../types.ts';
import { VOX_50_VISUAL_STYLES, VOX_STYLE_CATEGORIES } from './visualStyles.ts';

export { VOX_50_VISUAL_STYLES, VOX_STYLE_CATEGORIES };
export const VOX_STYLE_PRESET: VisualStyleConfig = { name:'vox_paper_collage', palette:{ paper:'#E6DCB8',offWhite:'#F4EEDA',black:'#121212',gray:'#52525B',red:'#DC2626',yellow:'#CA8A04' }, texture:{paper:true,grain:true,halftone:true}, shadows:{enabled:true,color:'rgba(24, 20, 15, 0.45)',defaultBlur:14}, camera:{default:'locked'} };
export const VOX_LAYOUTS: PresetLayout[] = [
 {id:'hero_archive',name:'Ảnh lưu trữ chủ đạo',description:'Nền + ảnh lưu trữ lớn + ngày tháng + mũi tên đỏ',defaultLayers:['background','hero_photo','date_label','red_arrow']},
 {id:'newspaper',name:'Trang nhất báo chí',description:'Newsprint + headline + ảnh nhỏ + marker',defaultLayers:['newsprint_bg','hero_headline','small_photo','marker_highlight']},
 {id:'map',name:'Bản đồ lưu trữ',description:'Bản đồ + ghim + tuyến đường + bằng chứng',defaultLayers:['map_bg','location_pin','route_line','hero_object']},
 {id:'photo_stack',name:'Xếp chồng ảnh',description:'3–6 ảnh tư liệu xếp lớp + tape',defaultLayers:['background','photo_01','photo_02','photo_03','paper_tape']},
 {id:'document',name:'Tài liệu giải mật',description:'Trang tài liệu + con dấu + bằng chứng + dây nối',defaultLayers:['document_bg','official_stamp','clipping_object','red_string']},
 {id:'big_number',name:'Số liệu lớn',description:'Con số khổng lồ + cutout + annotation',defaultLayers:['background','huge_number','small_hero','annotation_text','red_underline']},
 {id:'timeline',name:'Dòng thời gian ngang',description:'Trục thời gian + mốc ngày + ảnh tư liệu',defaultLayers:['background','timeline_axis','date_markers','archival_chips']},
 {id:'collage_board',name:'Bảng điều tra',description:'Bảng + hero + tài liệu + tape + dây đỏ',defaultLayers:['cork_or_paper_bg','hero_asset','support_01','support_02','tape','red_string']},
 {id:'split_screen',name:'Chia đôi màn hình',description:'Hai panel bằng chứng song song',defaultLayers:['background','left_panel','right_panel','divider']},
];
export const VOX_MOTIONS: PresetMotion[] = [
 {id:'paper_drop',name:'Thả giấy',category:'paper',description:'Rơi từ trên xuống và dừng vật lý'},
 {id:'paper_slide_left',name:'Trượt sang trái',category:'paper',description:'Trượt từ phải sang trái'},
 {id:'paper_slide_right',name:'Trượt sang phải',category:'paper',description:'Trượt từ trái sang phải'},
 {id:'paper_slide_up',name:'Trượt lên',category:'paper',description:'Đẩy từ dưới lên mặt bàn'},
 {id:'paper_slide_down',name:'Trượt xuống',category:'paper',description:'Trượt từ trên xuống'},
 {id:'photo_stack',name:'Ảnh rơi vào chồng',category:'paper',description:'Ảnh rơi lệch nhẹ và nằm vào stack'},
 {id:'paper_reveal',name:'Lộ sau lớp giấy',category:'paper',description:'Nội dung xuất hiện sau lớp trên'},
 {id:'paper_flip',name:'Lật tờ giấy',category:'paper',description:'Lật ngang mô phỏng tờ giấy thật'},
 {id:'paper_flip_vertical',name:'Lật giấy dọc',category:'paper',description:'Lật theo trục dọc'},
 {id:'photo_flip',name:'Lật ảnh',category:'paper',description:'Ảnh in lật mặt trước/sau'},
 {id:'card_flip',name:'Lật thẻ hồ sơ',category:'paper',description:'Evidence card lật ngang'},
 {id:'typewriter',name:'Gõ máy chữ',category:'text',description:'Hiện từng ký tự'},
 {id:'headline_pop',name:'Headline bật vào',category:'text',description:'Headline dán xuống với overshoot'},
 {id:'stamp_in',name:'Đóng dấu',category:'graphic',description:'Con dấu đập xuống'},
 {id:'arrow_draw',name:'Vẽ mũi tên',category:'graphic',description:'Nét marker xuất hiện dần'},
 {id:'string_draw',name:'Kéo dây đỏ',category:'graphic',description:'Dây nối hai điểm'},
 {id:'number_pop',name:'Số bật lên',category:'text',description:'Số liệu pop-in'},
 {id:'bar_grow',name:'Thanh tăng trưởng',category:'graphic',description:'Thanh dữ liệu mở rộng'},
 {id:'diagram_draw',name:'Vẽ sơ đồ',category:'graphic',description:'Sơ đồ xuất hiện dần'},
 {id:'annotation_reveal',name:'Lộ chú thích',category:'graphic',description:'Annotation trượt vào'},
 {id:'node_connect',name:'Nối node',category:'graphic',description:'Node/network xuất hiện'},
 {id:'panel_slide',name:'Trượt panel',category:'paper',description:'Panel trượt vào'},
 {id:'slow_reveal',name:'Reveal chậm',category:'paper',description:'Reveal cinematic'},
 {id:'crop_reveal',name:'Reveal crop',category:'paper',description:'Khung crop mở dần'},
 {id:'ticker_slide',name:'Ticker trượt',category:'text',description:'Dòng chữ chạy ngang'},
];
