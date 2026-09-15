export type VisualStyleCategory =
  | 'Giấy & Tài liệu'
  | 'Báo chí & Biên tập'
  | 'Điều tra & Bằng chứng'
  | 'Ảnh & Collage'
  | 'Bản đồ & Địa lý'
  | 'Dữ liệu & Công nghệ'
  | 'Điện ảnh & Tối giản';

export interface VisualStyleDefinition {
  id: string;
  name: string;
  category: VisualStyleCategory;
  englishName: string;
  bestFor: string[];
  layouts: string[];
  motions: string[];
  description: string;
  material: string;
}

const S = (id:string,name:string,category:VisualStyleCategory,englishName:string,bestFor:string[],layouts:string[],motions:string[],description:string,material:string):VisualStyleDefinition => ({id,name,category,englishName,bestFor,layouts,motions,description,material});

export const VOX_50_VISUAL_STYLES: VisualStyleDefinition[] = [
  S('paper_flip','Lật tờ giấy','Giấy & Tài liệu','Paper Flip',['tài liệu','hồ sơ','lịch sử'],['document','hero_archive'],['paper_drop','paper_slide_right','paper_reveal'],'Tờ giấy lật 3D như tài liệu thật trên bàn.','giấy ngà, mép cắt, bóng đổ vật lý'),
  S('paper_flip_vertical','Lật giấy dọc','Giấy & Tài liệu','Paper Flip Vertical',['tài liệu','mở đầu'],['document','big_number'],['paper_slide_up','paper_reveal'],'Lật trang theo trục dọc từ dưới lên.','giấy dày, nếp gấp nhẹ'),
  S('photo_flip','Lật ảnh','Ảnh & Collage','Photo Flip',['ảnh tư liệu','tiểu sử'],['photo_stack','hero_archive'],['photo_stack','paper_reveal'],'Ảnh tư liệu lật mặt trước/sau.','ảnh in bóng mờ, viền giấy'),
  S('card_flip','Lật thẻ hồ sơ','Điều tra & Bằng chứng','Card Flip',['hồ sơ','nhân vật','điều tra'],['document','collage_board'],['paper_drop','paper_reveal'],'Thẻ hồ sơ bật và lật như evidence card.','card hồ sơ, ghim, bóng đổ'),
  S('folder_open','Mở bìa hồ sơ','Giấy & Tài liệu','File Folder Open',['hồ sơ','điều tra'],['document','collage_board'],['paper_slide_right','paper_reveal'],'Bìa hồ sơ mở để lộ bằng chứng bên trong.','bìa kraft, giấy đánh máy, kẹp'),
  S('folder_close','Đóng hồ sơ','Giấy & Tài liệu','File Folder Close',['kết luận','chuyển cảnh'],['document'],['paper_slide_left'],'Hồ sơ khép lại như một case file.','bìa giấy dày, khóa hồ sơ'),
  S('page_turn','Lật trang','Giấy & Tài liệu','Page Turn',['sách','lịch sử','tài liệu'],['document','newspaper'],['paper_slide_right','paper_reveal'],'Một trang mới lật vào khung hình.','giấy in, mép trang, bóng mềm'),
  S('rapid_page_turn','Lật nhiều trang','Giấy & Tài liệu','Rapid Page Turn',['timeline','lịch sử'],['timeline','document'],['paper_slide_right','paper_slide_left','paper_reveal'],'Nhiều trang lật liên tiếp theo nhịp.','xấp giấy, stop-motion nhẹ'),
  S('book_open','Mở sách','Giấy & Tài liệu','Book Open',['lịch sử','kiến thức'],['hero_archive','document'],['paper_slide_left','paper_slide_right'],'Hai nửa trang sách mở ra.','sách cũ, gáy sách, giấy ố'),
  S('book_close','Đóng sách','Giấy & Tài liệu','Book Close',['kết luận','chuyển đoạn'],['hero_archive'],['paper_slide_left','paper_slide_right'],'Cuốn sách đóng lại tạo điểm kết.','bìa cứng, bóng gáy'),
  S('paper_curl','Cuộn mép giấy','Giấy & Tài liệu','Paper Curl',['tài liệu','bí mật'],['document'],['paper_reveal'],'Mép giấy cong lên để lộ lớp dưới.','giấy mỏng, highlight mép'),
  S('paper_uncurl','Duỗi phẳng giấy','Giấy & Tài liệu','Paper Uncurl',['tài liệu','giải thích'],['document'],['paper_slide_down'],'Tờ giấy bung phẳng trở lại.','giấy có nếp gấp'),
  S('paper_tear','Xé giấy','Giấy & Tài liệu','Paper Tear',['khủng hoảng','tiết lộ'],['document','hero_archive'],['paper_reveal'],'Mép giấy rách mở ra để chuyển cảnh.','sợi giấy, mép rách, shadow'),
  S('torn_reveal','Lộ qua mép rách','Giấy & Tài liệu','Torn Reveal',['bí mật','evidence'],['document','hero_archive'],['paper_reveal','crop_reveal'],'Nội dung ẩn xuất hiện sau vùng giấy rách.','paper tear, lớp chồng'),
  S('tape_peel','Bóc băng keo','Ảnh & Collage','Tape Peel',['collage','ảnh tư liệu'],['photo_stack','collage_board'],['paper_reveal','paper_slide_up'],'Băng keo được bóc khỏi ảnh/tài liệu.','tape trong, giấy cũ'),
  S('tape_stick','Dán băng keo','Ảnh & Collage','Tape Stick',['collage','bằng chứng'],['photo_stack','collage_board'],['paper_drop','paper_slide_down'],'Miếng tape bay vào và dán xuống.','tape, bóng tiếp xúc'),
  S('pin_board','Ghim lên bảng','Điều tra & Bằng chứng','Pin Board',['điều tra','mạng lưới'],['collage_board'],['paper_drop','string_draw'],'Ảnh và tài liệu được ghim lên bảng.','corkboard, push pin, giấy'),
  S('photo_pin','Ghim ảnh','Ảnh & Collage','Photo Pin',['ảnh','điều tra'],['photo_stack','collage_board'],['paper_drop'],'Ảnh rơi xuống rồi được ghim cố định.','ảnh in, ghim kim loại'),
  S('photo_swing','Ảnh đung đưa','Ảnh & Collage','Photo Swing',['tiểu sử','hồ sơ'],['photo_stack','hero_archive'],['paper_drop','slow_reveal'],'Ảnh treo dây và đung đưa nhẹ.','ảnh giấy, dây mảnh'),
  S('photo_rotate','Xoay ảnh','Ảnh & Collage','Photo Rotate',['ảnh tư liệu','montage'],['photo_stack','hero_archive'],['paper_slide_right','paper_drop'],'Ảnh xoay vào đúng vị trí trên bàn.','ảnh in, góc nghiêng'),
  S('photo_scatter','Ảnh rải trên bàn','Ảnh & Collage','Photo Scatter',['montage','lịch sử'],['photo_stack','collage_board'],['photo_stack','paper_drop','paper_slide_left'],'Nhiều ảnh rơi rải thành bố cục tự nhiên.','ảnh chồng, giấy, tape'),
  S('photo_stack_build','Xếp chồng ảnh','Ảnh & Collage','Photo Stack Build',['ảnh tư liệu','so sánh'],['photo_stack'],['photo_stack','paper_drop'],'Ảnh lần lượt rơi thành một chồng.','paper stack, depth, shadow'),
  S('photo_stack_remove','Rút ảnh khỏi chồng','Ảnh & Collage','Photo Stack Remove',['hồ sơ','evidence'],['photo_stack'],['paper_slide_up','photo_stack'],'Từng ảnh được rút khỏi chồng.','paper stack, parallax'),
  S('document_slide','Trượt tài liệu','Giấy & Tài liệu','Document Slide',['tài liệu','business'],['document','split_screen'],['paper_slide_right','paper_slide_left'],'Tài liệu trượt trên mặt bàn.','giấy phẳng, friction'),
  S('document_push','Đẩy tài liệu','Giấy & Tài liệu','Document Push',['so sánh','timeline'],['document','timeline'],['paper_slide_right'],'Tờ mới đẩy tờ cũ sang bên.','xếp lớp giấy'),
  S('document_pull','Kéo tài liệu','Giấy & Tài liệu','Document Pull',['evidence','hồ sơ'],['document'],['paper_slide_left'],'Một tài liệu được kéo ra khỏi xấp.','paper stack, contact shadow'),
  S('envelope_open','Mở phong bì','Giấy & Tài liệu','Envelope Open',['thư','bí mật','hồ sơ'],['document'],['paper_reveal','paper_slide_up'],'Phong bì mở và lộ tài liệu.','phong bì giấy, con dấu'),
  S('envelope_insert','Cho tài liệu vào phong bì','Giấy & Tài liệu','Envelope Insert',['hồ sơ','thư'],['document'],['paper_slide_down'],'Tài liệu trượt vào phong bì.','paper envelope'),
  S('envelope_extract','Rút tài liệu khỏi phong bì','Giấy & Tài liệu','Envelope Extract',['tiết lộ','evidence'],['document'],['paper_slide_up','paper_reveal'],'Tài liệu được rút ra khỏi phong bì.','paper, shadow'),
  S('stamp_slam','Đóng dấu mạnh','Điều tra & Bằng chứng','Stamp Slam',['chính phủ','hồ sơ','mật'],['document','collage_board'],['stamp_in'],'Con dấu đập xuống với lực và rung.','mực đỏ, dấu cao su'),
  S('stamp_rotate','Xoay con dấu','Điều tra & Bằng chứng','Stamp Rotate',['hồ sơ','phê duyệt'],['document'],['stamp_in','paper_drop'],'Con dấu xoay rồi đóng xuống.','rubber stamp, ink'),
  S('marker_scribble','Bút marker nguệch ngoạc','Điều tra & Bằng chứng','Marker Scribble',['điều tra','báo chí'],['newspaper','document'],['arrow_draw','annotation_reveal'],'Nét marker thô vẽ nhanh trên tài liệu.','marker đỏ/đen'),
  S('underline_draw','Gạch chân viết tay','Điều tra & Bằng chứng','Underline Draw',['nhấn mạnh','trích dẫn'],['newspaper','document'],['arrow_draw'],'Đường gạch chân được vẽ bằng tay.','marker, paper'),
  S('circle_draw','Khoanh vùng','Điều tra & Bằng chứng','Circle Draw',['evidence','điều tra'],['document','collage_board'],['arrow_draw'],'Vòng tròn khoanh vùng xuất hiện từng nét.','marker đỏ'),
  S('arrow_sketch','Mũi tên phác tay','Điều tra & Bằng chứng','Arrow Sketch',['giải thích','điều tra'],['hero_archive','collage_board'],['arrow_draw'],'Mũi tên vẽ tay chỉ vào chủ thể.','marker stroke'),
  S('red_string_connect','Dây đỏ liên kết','Điều tra & Bằng chứng','Red String Connect',['mạng lưới','điều tra','quan hệ'],['collage_board','map'],['string_draw','node_connect'],'Dây đỏ nối các bằng chứng theo thứ tự.','red yarn, pin'),
  S('push_pin_connect','Ghim và nối dây','Điều tra & Bằng chứng','Push Pin Connect',['mạng lưới','case'],['collage_board'],['paper_drop','string_draw'],'Ghim xuất hiện trước rồi dây nối giữa các điểm.','corkboard, yarn'),
  S('map_fold','Gấp bản đồ','Bản đồ & Địa lý','Map Fold',['địa lý','chiến tranh','hành trình'],['map'],['paper_slide_left','paper_slide_right'],'Bản đồ gấp lại theo nếp.','bản đồ giấy, nếp gấp'),
  S('map_unfold','Mở bản đồ','Bản đồ & Địa lý','Map Unfold',['địa lý','hành trình'],['map'],['paper_reveal','paper_slide_right'],'Bản đồ bung ra và lộ tuyến đường.','map paper, route ink'),
  S('newspaper_unfold','Mở tờ báo','Báo chí & Biên tập','Newspaper Unfold',['tin tức','lịch sử'],['newspaper'],['paper_slide_right','paper_reveal'],'Tờ báo mở ra từ giữa, headline lộ dần.','newsprint, ink'),
  S('newspaper_fold','Gấp tờ báo','Báo chí & Biên tập','Newspaper Fold',['kết luận','tin tức'],['newspaper'],['paper_slide_left','paper_slide_down'],'Tờ báo gấp lại như bàn làm việc.','newsprint'),
  S('headline_peel','Bóc headline','Báo chí & Biên tập','Headline Peel',['tin nóng','headline'],['newspaper','big_number'],['paper_reveal','headline_pop'],'Headline được bóc như lớp sticker giấy.','newsprint, tape'),
  S('sticker_slap','Dán sticker mạnh','Ảnh & Collage','Sticker Slap',['meme','social','highlight'],['collage_board','newspaper'],['paper_drop','headline_pop'],'Sticker đập xuống và bật nhẹ.','paper sticker, shadow'),
  S('sticker_peel','Bóc sticker','Ảnh & Collage','Sticker Peel',['social','evidence'],['collage_board'],['paper_reveal'],'Sticker được bóc lên để lộ nội dung.','sticker paper'),
  S('evidence_reveal','Kéo bằng chứng ra','Điều tra & Bằng chứng','Evidence Reveal',['điều tra','hồ sơ','bí mật'],['document','collage_board'],['paper_slide_up','paper_reveal'],'Bằng chứng được kéo ra khỏi lớp dưới.','paper stack, clip'),
  S('layer_peel','Bóc từng lớp collage','Ảnh & Collage','Layer Peel',['collage','lịch sử'],['collage_board','photo_stack'],['paper_reveal','paper_slide_up'],'Từng lớp giấy được bóc để lộ lớp tiếp theo.','multi-layer paper'),
  S('camera_push','Camera tiến vào bàn','Điện ảnh & Tối giản','Desk Camera Push',['drama','evidence','opening'],['hero_archive','collage_board'],['slow_reveal'],'Camera tiến chậm vào bố cục bàn.','cinematic desk, depth'),
  S('camera_pull','Camera lùi khỏi bàn','Điện ảnh & Tối giản','Desk Camera Pull',['reveal','ending'],['collage_board','hero_archive'],['slow_reveal'],'Camera lùi để lộ toàn bộ bàn điều tra.','wide desk, layered depth'),
  S('stop_motion_shuffle','Xáo trộn stop-motion','Điện ảnh & Tối giản','Stop Motion Shuffle',['montage','creative','history'],['collage_board','photo_stack'],['paper_drop','paper_slide_left','paper_slide_right'],'Asset đổi vị trí theo nhịp stop-motion có chủ ý.','cut-paper, frame-by-frame feel'),
  S('investigation_board_build','Dựng bảng điều tra','Điều tra & Bằng chứng','Investigation Board Build',['điều tra','mạng lưới','crime'],['collage_board'],['paper_drop','stamp_in','string_draw','arrow_draw'],'Bảng điều tra được dựng từng lớp từ nền đến dây nối.','corkboard, evidence cards, red yarn'),
];

export const VOX_STYLE_CATEGORIES = [
  'Giấy & Tài liệu','Báo chí & Biên tập','Điều tra & Bằng chứng','Ảnh & Collage','Bản đồ & Địa lý','Dữ liệu & Công nghệ','Điện ảnh & Tối giản'
] as const;
