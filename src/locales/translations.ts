export type Language = 'vi' | 'en';

export interface Translations {
  appName: string;
  appSubtitle: string;
  proBadge: string;
  tabCanvas: string;
  tabStoryboard: string;
  tabInspector: string;
  tabBrief: string;
  tabVoice: string;
  tabHelp: string;
  exportBtn: string;
  demoBtn: string;
  presetsBtn: string;
  ffmpegReady: string;
  ffmpegMissing: string;
  checking: string;

  // Player
  play: string;
  pause: string;
  replay: string;
  shotMode: string;
  sequenceMode: string;
  sheetMode: string;
  fitMode: string;
  expandMode: string;
  safeArea: string;
  perf: string;
  speed: string;
  mute: string;
  unmute: string;
  perfBudget: string;
  subtitles: string;

  // Quality modes
  qualityPerf: string;
  qualityBalanced: string;
  qualityNative: string;

  // Storyboard
  storyboardTitle: string;
  openInspector: string;
  editShot: string;
  regenerateLayout: string;
  regenerateMotion: string;
  narrationLabel: string;
  visualIdeaLabel: string;
  layoutLabel: string;
  backgroundLabel: string;
  assetsInShot: string;
  addAsset: string;
  uploadPhoto: string;
  aiGenerate: string;

  // Voice Studio
  voiceStudioTitle: string;
  voiceStudioDesc: string;
  generateVoiceBtn: string;
  generatingVoice: string;
  ttsEngineTitle: string;
  voiceChoiceLabel: string;
  previewVoiceTrack: string;
  audioDuration: string;
  beatsCount: string;
  audioMux: string;
  rhythmBeatsTitle: string;
  rhythmBeatsSubtitle: string;
  noAudioAlert: string;

  // Export Modal
  exportTitle: string;
  exportSubtitle: string;
  qualityGateTitle: string;
  startExport: string;
  exporting: string;
  downloadVideo: string;
  renderReady: string;
  renderBlocked: string;
  framerateLabel: string;

  // Quick Guide
  quickGuideTitle: string;
  quickGuideSubtitle: string;
  step1Title: string;
  step1Desc: string;
  step2Title: string;
  step2Desc: string;
  step3Title: string;
  step3Desc: string;
  step4Title: string;
  step4Desc: string;
  step5Title: string;
  step5Desc: string;
  gotItBtn: string;
}

export const translations: Record<Language, Translations> = {
  vi: {
    appName: 'VOX Studio Engine',
    appSubtitle: 'Tạo Video Tài Liệu Phong Cách Cắt Dán Báo Chí VOX',
    proBadge: 'PRO V0.2',
    tabCanvas: 'Xem Video',
    tabStoryboard: 'Kịch Bản Phân Cảnh',
    tabInspector: 'Quản Lý Tư Liệu',
    tabBrief: 'Tổng Quan Đề Tài',
    tabVoice: 'Thu Âm & Giọng Đọc',
    tabHelp: 'Hướng Dẫn',
    exportBtn: 'Xuất Video MP4',
    demoBtn: 'Dự Án Mẫu 1929',
    presetsBtn: 'Kho Mẫu VOX',
    ffmpegReady: 'FFmpeg Đã Sẵn Sàng',
    ffmpegMissing: 'Chưa có FFmpeg',
    checking: 'Đang kiểm tra...',

    // Player
    play: 'Phát',
    pause: 'Tạm Dừng',
    replay: 'Xem Lại',
    shotMode: 'Phân Cảnh',
    sequenceMode: 'Toàn Bộ Video',
    sheetMode: 'Bảng Kiểm Tra',
    fitMode: 'Vừa Màn Hình',
    expandMode: 'Mở Rộng',
    safeArea: 'Khung An Toàn',
    perf: 'Hiệu Năng',
    speed: 'Tốc Độ',
    mute: 'Tắt Tiếng',
    unmute: 'Bật Tiếng',
    perfBudget: 'Giám Sát FPS & Tải Bộ Nhớ',
    subtitles: 'Phụ Đề',

    qualityPerf: 'Tiết Kiệm (640x360 @ 15fps)',
    qualityBalanced: 'Cân Bằng (960x540 @ 30fps)',
    qualityNative: 'Gốc (1920x1080 @ 30fps)',

    // Storyboard
    storyboardTitle: 'Chuỗi Phân Cảnh Storyboard',
    openInspector: 'Mở Bảng Biên Tập Tư Liệu',
    editShot: 'Chỉnh Sửa',
    regenerateLayout: 'Đổi Bố Cục VOX',
    regenerateMotion: 'Đổi Hiệu Ứng Chuyển Động',
    narrationLabel: 'Lời Thuyết Minh',
    visualIdeaLabel: 'Ý Tưởng Thị Giác',
    layoutLabel: 'Bố Cục',
    backgroundLabel: 'Phông Nền Giấy',
    assetsInShot: 'Tư Liệu Trong Cảnh',
    addAsset: 'Thêm Tư Liệu',
    uploadPhoto: 'Tải Ảnh Lên',
    aiGenerate: 'Tạo Ảnh Bằng AI',

    // Voice Studio
    voiceStudioTitle: 'Phòng Thu Giọng Đọc & Đồng Bộ Nhịp',
    voiceStudioDesc:
      'Quy trình âm thanh làm chủ (Audio-First): Tạo giọng thuyết minh chuẩn phát thanh, phân tích nhịp chính xác đến từng mili-giây và đồng bộ hiệu ứng chuyển cảnh theo cụm 5-8 từ.',
    generateVoiceBtn: 'TẠO GIỌNG ĐỌC & ĐỒNG BỘ NHỊP',
    generatingVoice: 'ĐANG XỬ LÝ & ĐỒNG BỘ...',
    ttsEngineTitle: 'Chọn Bộ Máy Giọng Đọc Thuyết Minh (TTS)',
    voiceChoiceLabel: 'Chọn Giọng Đọc',
    previewVoiceTrack: 'Nghe Thử Giọng Thuyết Minh Master',
    audioDuration: 'Thời lượng âm thanh',
    beatsCount: 'Số nhịp được đồng bộ',
    audioMux: 'Định dạng xuất: AAC 192kbps',
    rhythmBeatsTitle: 'Nhịp Thị Giác Đã Đồng Bộ',
    rhythmBeatsSubtitle: 'Điểm kích hoạt hiệu ứng gõ chữ, rơi giấy và tem tài liệu',
    noAudioAlert: 'Chưa có giọng đọc. Bấm "Tạo Giọng Đọc & Đồng Bộ Nhịp" để bắt đầu.',

    // Export Modal
    exportTitle: 'Xuất Video MP4 Hoàn Chỉnh',
    exportSubtitle: 'Kết xuất khung hình Canvas 1080p và ghép nối âm thanh bằng FFmpeg',
    qualityGateTitle: 'Kiểm Tra Cổng Chất Lượng (Quality Gate)',
    startExport: 'BẮT ĐẦU XUẤT VIDEO 1080P',
    exporting: 'ĐANG XUẤT VIDEO...',
    downloadVideo: 'TẢI VIDEO MP4 VỀ MÁY',
    renderReady: 'Đã sẵn sàng xuất bản video tiêu chuẩn 1080p',
    renderBlocked: 'Cần khắc phục các cảnh báo trước khi xuất',
    framerateLabel: 'Tốc độ khung hình (FPS)',

    // Quick Guide
    quickGuideTitle: 'Hướng Dẫn Sử Dụng Nhanh VOX Video Engine',
    quickGuideSubtitle: 'Từng bước làm chủ công cụ tạo video tài liệu phong cách cắt dán báo chí VOX chuyên nghiệp',
    step1Title: '1. Điều Chỉnh Khung Video Vừa Màn Hình (Không Cần Cuộn)',
    step1Desc:
      'Nhấp vào nút "Vừa Màn Hình" (Fit) trên thanh điều khiển video. Khung video sẽ tự động co giãn vừa vặn với chiều cao trình duyệt của bạn, giúp bạn xem được toàn bộ video, thanh tua thời gian và storyboard mà không phải cuộn chuột mỏi tay.',
    step2Title: '2. Tạo Giọng Đọc Thuyết Minh & Tự Động Đồng Bộ Nhịp',
    step2Desc:
      'Vào tab "Thu Âm & Giọng Đọc" (Voice). Chọn bộ máy "Google Voice (Chuẩn Phát Thanh)" với giọng Tiếng Việt Nữ Truyền Cảm hoặc Nam Trầm Ấm Phim Tài Liệu. Bấm "TẠO GIỌNG ĐỌC & ĐỒNG BỘ NHỊP", hệ thống sẽ tự động ghép lời nói và tính toán chính xác thời gian từng phân cảnh mà không hề bị rè hay nhiễu sè sè.',
    step3Title: '3. Bố Cục VOX Cắt Dán Tinh Tế, Không Chồng Lấn',
    step3Desc:
      'Hệ thống tự động xếp ảnh tư liệu và tiêu đề ở các vị trí đối trọng (ví dụ: ảnh bên phải, tiêu đề tự động xuống dòng và dán nhãn vàng/đen ở bên trái). Bạn có thể bấm vào từng phân cảnh để đổi giữa 8 bố cục: Báo chí (Newspaper), Hero Lưu trữ (Hero Archive), Số liệu lớn (Big Number), Tài liệu mật (Document)...',
    step4Title: '4. Tải Ảnh Lên Hoặc Dùng Tư Liệu Có Sẵn',
    step4Desc:
      'Trong Storyboard, bạn có thể bấm "Tải Ảnh Lên" (Upload) để đưa ảnh lịch sử của riêng mình vào. Hệ thống sẽ tự động tạo viền cắt giấy thủ công (Paper Cutout), bóng đổ thật và hiệu ứng rơi giấy.',
    step5Title: '5. Xuất Video MP4 Chuẩn 1080p H.264 / AAC',
    step5Desc:
      'Bấm nút màu đỏ "Xuất Video MP4" ở góc trên bên phải. Cổng kiểm tra chất lượng sẽ rà soát an toàn. Bấm "Bắt Đầu Xuất Video" để hệ thống render từng khung hình mượt mà và ghép nối âm thanh. Khi hoàn tất, bạn chỉ cần bấm "Tải Video MP4 Về Máy" để nhận thành phẩm!',
    gotItBtn: 'Tôi Đã Hiểu, Bắt Đầu Sử Dụng',
  },
  en: {
    appName: 'VOX Studio Engine',
    appSubtitle: 'Journalistic Archival Paper-Collage Video Engine',
    proBadge: 'PRO V0.2',
    tabCanvas: 'Canvas Video',
    tabStoryboard: 'Storyboard',
    tabInspector: 'Asset Inspector',
    tabBrief: 'Project Brief',
    tabVoice: 'Voice & Timeline',
    tabHelp: 'User Guide',
    exportBtn: 'Export 1080p MP4',
    demoBtn: '1929 Demo',
    presetsBtn: 'VOX Presets',
    ffmpegReady: 'FFmpeg Ready',
    ffmpegMissing: 'No FFmpeg',
    checking: 'Checking...',

    // Player
    play: 'Play',
    pause: 'Pause',
    replay: 'Replay',
    shotMode: 'Shot',
    sequenceMode: 'Sequence',
    sheetMode: 'Sheet',
    fitMode: 'Fit View',
    expandMode: 'Expanded',
    safeArea: 'Safe Area',
    perf: 'Performance',
    speed: 'Speed',
    mute: 'Mute',
    unmute: 'Unmute',
    perfBudget: 'FPS & Memory Budget Monitor',
    subtitles: 'Subtitles',

    qualityPerf: 'Performance (640x360 @ 15fps)',
    qualityBalanced: 'Balanced (960x540 @ 30fps)',
    qualityNative: 'Native (1920x1080 @ 30fps)',

    // Storyboard
    storyboardTitle: 'Storyboard Sequences',
    openInspector: 'Open Asset Inspector',
    editShot: 'Edit',
    regenerateLayout: 'Change Layout',
    regenerateMotion: 'Change Motion',
    narrationLabel: 'Narration Script',
    visualIdeaLabel: 'Visual Idea',
    layoutLabel: 'Layout',
    backgroundLabel: 'Paper Background',
    assetsInShot: 'Assets In Shot',
    addAsset: 'Add Asset',
    uploadPhoto: 'Upload Photo',
    aiGenerate: 'AI Generate',

    // Voice Studio
    voiceStudioTitle: 'Voice TTS & Audio Beat Studio',
    voiceStudioDesc:
      'Audio-first documentary synchronization: generate authoritative voiceover, detect millisecond timestamps via FFprobe, and align 5-8 word stop-motion beats.',
    generateVoiceBtn: 'GENERATE MASTER VOICE & TIMELINE',
    generatingVoice: 'SYNTHESIZING & SYNCING...',
    ttsEngineTitle: 'TTS Narration Engine Selection',
    voiceChoiceLabel: 'Select Voice',
    previewVoiceTrack: 'Master Voice Track Preview',
    audioDuration: 'Audio Duration',
    beatsCount: 'Synchronized Beats',
    audioMux: 'Audio Mux: AAC 192kbps',
    rhythmBeatsTitle: 'Synchronized Rhythm Beats',
    rhythmBeatsSubtitle: 'Stop-motion trigger cue points',
    noAudioAlert: 'No audio generated. Click "Generate Master Voice & Timeline" to begin.',

    // Export Modal
    exportTitle: 'Export Final Video (MP4)',
    exportSubtitle: 'Render 1080p Canvas frames and mux high-fidelity AAC audio with FFmpeg',
    qualityGateTitle: 'Section 33 Quality Gate Verification',
    startExport: 'START 1080P EXPORT',
    exporting: 'RENDERING VIDEO...',
    downloadVideo: 'DOWNLOAD MP4 VIDEO',
    renderReady: 'Ready for high-quality 1080p render',
    renderBlocked: 'Please resolve warnings before rendering',
    framerateLabel: 'Frame Rate (FPS)',

    // Quick Guide
    quickGuideTitle: 'VOX Video Engine Quick Guide',
    quickGuideSubtitle: 'Master the journalistic paper-collage video creation workflow in 5 simple steps',
    step1Title: '1. Fit Video Player to Screen (No Annoying Scrolling)',
    step1Desc:
      'Click the "Fit View" button on the player header. The video canvas automatically scales to fit within your browser window so you can view the video, scrub bar, and storyboard thumbnails without endless scrolling.',
    step2Title: '2. Generate Voiceover & Synchronize Rhythm Beats',
    step2Desc:
      'Navigate to the "Voice & Timeline" tab. Select the recommended voice provider and choose your preferred voice. Click "Generate Master Voice & Timeline" to instantly synthesize crystal-clear narration and generate precision stop-motion cue points.',
    step3Title: '3. Elegant VOX Layouts with Zero Text Collision',
    step3Desc:
      'Headlines automatically wrap into punchy editorial blocks with yellow highlighter or black badges, positioned to never collide with hero photos. Switch between 8 layouts including Newspaper, Archival Hero, Big Numbers, and Classified Documents.',
    step4Title: '4. Upload Archival Photos or Generate Assets',
    step4Desc:
      'Upload real documentary photographs directly into any shot. The engine automatically applies torn scissor borders, realistic tape accents, and authentic paper shadows.',
    step5Title: '5. Export Broadcast-Ready 1080p MP4',
    step5Desc:
      'Click the red "Export 1080p MP4" button at the top right. Pass the automated quality gate check and download your finished video complete with synced voiceover and 60fps animations.',
    gotItBtn: 'Got It, Let’s Start',
  },
};
