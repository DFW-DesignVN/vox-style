import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { GoogleGenAI } from '@google/genai';

const execAsync = promisify(exec);

const OUTPUTS_DIR = path.join(process.cwd(), 'outputs');
const ASSETS_DIR = path.join(OUTPUTS_DIR, 'assets');
const TEMP_DIR = path.join(process.cwd(), 'temp_renders');

for (const dir of [OUTPUTS_DIR, ASSETS_DIR, TEMP_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export interface GenerateAssetParams {
  prompt: string;
  topic?: string;
  shotId?: string;
  assetId?: string;
  role?: 'hero' | 'secondary' | 'background' | 'detail';
  layout?: string;
  style?: 'archival_photo' | 'newspaper' | 'document' | 'map' | 'ticker' | 'portrait';
}

/**
 * Procedurally synthesizes high-resolution SVG artwork for vintage archival documents,
 * newspaper front pages, cartographic maps, and telegram dispatches.
 */
function createProceduralArchivalSvg(
  prompt: string,
  topic: string = 'Archival History',
  style: string = 'archival_photo',
  shotOrder: number = 1
): string {
  const safeTopic = (topic || 'HISTORICAL RECORD').toUpperCase().slice(0, 32);
  const safePrompt = (prompt || 'Archival document').slice(0, 60);
  const dateStr = 'OCTOBER 29, 1929';
  const docId = `VOX-ARCHIVE-${Math.floor(1000 + Math.random() * 9000)}`;

  if (style === 'newspaper') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="850" viewBox="0 0 1200 850">
      <defs>
        <filter id="paperNoise">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" result="noise"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0.9 0 0 0 0 0.86 0 0 0 0 0.74 0 0 0 0.15 0"/>
          <feBlend mode="multiply" in="SourceGraphic"/>
        </filter>
      </defs>
      <!-- Newsprint Paper Base -->
      <rect width="1200" height="850" fill="#E8DDB8" />
      <rect x="25" y="25" width="1150" height="800" fill="#F3ECDA" stroke="#121212" stroke-width="4" />
      
      <!-- Masthead -->
      <text x="600" y="90" font-family="'Georgia', serif" font-size="52" font-weight="900" fill="#121212" text-anchor="middle" letter-spacing="4">THE HISTORICAL CHRONICLE</text>
      <line x1="50" y1="115" x2="1150" y2="115" stroke="#121212" stroke-width="3" />
      <text x="60" y="135" font-family="'Courier New', monospace" font-size="16" font-weight="bold" fill="#333">VOL. LXXVIII NO. 26,894</text>
      <text x="600" y="135" font-family="'Courier New', monospace" font-size="16" font-weight="bold" fill="#333" text-anchor="middle">${dateStr}</text>
      <text x="1140" y="135" font-family="'Courier New', monospace" font-size="16" font-weight="bold" fill="#333" text-anchor="end">TWO CENTS</text>
      <line x1="50" y1="145" x2="1150" y2="145" stroke="#121212" stroke-width="2" />

      <!-- Main Headline -->
      <text x="600" y="225" font-family="'Arial Black', sans-serif" font-size="64" font-weight="900" fill="#121212" text-anchor="middle" letter-spacing="-1">${safeTopic}</text>
      <line x1="100" y1="245" x2="1100" y2="245" stroke="#121212" stroke-width="1.5" />

      <!-- Columns layout -->
      <!-- Left column text -->
      <rect x="65" y="270" width="310" height="520" fill="#EAE0C0" stroke="#C5B68A" stroke-width="1" />
      <text x="80" y="300" font-family="'Georgia', serif" font-size="18" font-weight="bold" fill="#121212">SPECIAL DISPATCH</text>
      <line x1="80" y1="310" x2="355" y2="310" stroke="#121212" stroke-width="1" />
      ${Array.from({ length: 22 })
        .map(
          (_, i) =>
            `<rect x="80" y="${330 + i * 18}" width="${275 - (i % 3) * 20}" height="7" fill="#2E2822" opacity="0.85" />`
        )
        .join('')}

      <!-- Center Archival Halftone Photo Frame -->
      <rect x="405" y="270" width="440" height="340" fill="#121212" stroke="#444" stroke-width="2" />
      <rect x="415" y="280" width="420" height="320" fill="#222" />
      <circle cx="625" cy="420" r="110" fill="#383838" />
      <circle cx="625" cy="380" r="45" fill="#555" />
      <path d="M540 500 C 560 440, 690 440, 710 500 Z" fill="#555" />
      <text x="625" y="580" font-family="'Courier New', monospace" font-size="14" font-weight="bold" fill="#EEE" text-anchor="middle">ARCHIVAL RECORD: ${safePrompt.slice(0, 30)}</text>
      
      <!-- Sub text under photo -->
      <text x="625" y="640" font-family="'Georgia', serif" font-size="20" font-weight="bold" fill="#121212" text-anchor="middle">COLLAPSE IN RECORD TRADING</text>
      ${Array.from({ length: 7 })
        .map(
          (_, i) =>
            `<rect x="420" y="${665 + i * 17}" width="${410 - (i % 4) * 15}" height="6" fill="#2E2822" opacity="0.8" />`
        )
        .join('')}

      <!-- Right Column -->
      <rect x="870" y="270" width="265" height="520" fill="#EAE0C0" stroke="#C5B68A" stroke-width="1" />
      <text x="885" y="300" font-family="'Georgia', serif" font-size="16" font-weight="bold" fill="#121212">FINANCIAL REPORT</text>
      <line x1="885" y1="310" x2="1115" y2="310" stroke="#121212" stroke-width="1" />
      ${Array.from({ length: 22 })
        .map(
          (_, i) =>
            `<rect x="885" y="${330 + i * 18}" width="${230 - (i % 3) * 18}" height="7" fill="#2E2822" opacity="0.85" />`
        )
        .join('')}

      <!-- Red Archival Rubber Stamp -->
      <g transform="translate(980, 720) rotate(-14)">
        <rect x="-100" y="-35" width="200" height="70" fill="none" stroke="#DC2626" stroke-width="5" rx="4" />
        <rect x="-93" y="-28" width="186" height="56" fill="none" stroke="#DC2626" stroke-width="1.5" />
        <text x="0" y="6" font-family="'Courier New', monospace" font-size="24" font-weight="900" fill="#DC2626" text-anchor="middle">OFFICIAL ARCHIVE</text>
      </g>
    </svg>`;
  }

  if (style === 'document') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="900" viewBox="0 0 1000 900">
      <rect width="1000" height="900" fill="#DFD3AF" />
      <!-- Manilla Folder Base -->
      <rect x="40" y="40" width="920" height="820" fill="#EADFBE" stroke="#8C7A53" stroke-width="3" rx="8" />
      
      <!-- Top Classification Bar -->
      <rect x="80" y="70" width="840" height="40" fill="#121212" />
      <text x="500" y="97" font-family="'Courier New', monospace" font-size="20" font-weight="900" fill="#F4EEDA" text-anchor="middle" letter-spacing="3">WAR DEPARTMENT / HISTORICAL ARCHIVES</text>

      <!-- Document Header -->
      <text x="100" y="160" font-family="'Courier New', monospace" font-size="18" font-weight="bold" fill="#121212">CLASSIFIED DOSSIER REF: ${docId}</text>
      <text x="100" y="190" font-family="'Courier New', monospace" font-size="18" font-weight="bold" fill="#121212">SUBJECT: ${safeTopic}</text>
      <line x1="90" y1="210" x2="910" y2="210" stroke="#121212" stroke-width="2" stroke-dasharray="8,4" />

      <!-- Main Document Body Lines (Typewriter Effect) -->
      ${Array.from({ length: 18 })
        .map(
          (_, i) =>
            `<rect x="100" y="${240 + i * 28}" width="${760 - (i % 4) * 45}" height="8" fill="#1A1815" opacity="0.9" />`
        )
        .join('')}

      <!-- Photo Clip Insert with paperclip -->
      <g transform="translate(620, 480) rotate(4)">
        <rect x="-160" y="-120" width="320" height="240" fill="#121212" stroke="#F5EFE0" stroke-width="12" />
        <rect x="-150" y="-110" width="300" height="220" fill="#2D2D2D" />
        <circle cx="0" cy="-20" r="50" fill="#4B4B4B" />
        <path d="M-80 80 C -60 20, 60 20, 80 80 Z" fill="#4B4B4B" />
        <text x="0" y="75" font-family="'Courier New', monospace" font-size="13" font-weight="bold" fill="#FFF" text-anchor="middle">EVIDENCE RECORD PHOTO</text>
        <!-- Paperclip wire -->
        <path d="M-130 -140 L-130 -90 C-130 -70 -105 -70 -105 -90 L-105 -130 C-105 -145 -120 -145 -120 -130 L-120 -95" fill="none" stroke="#A1A1AA" stroke-width="4" />
      </g>

      <!-- Red Stamp: DECLASSIFIED -->
      <g transform="translate(300, 720) rotate(-9)">
        <rect x="-130" y="-40" width="260" height="80" fill="none" stroke="#DC2626" stroke-width="5" rx="6" />
        <text x="0" y="-8" font-family="'Courier New', monospace" font-size="26" font-weight="900" fill="#DC2626" text-anchor="middle">TOP SECRET</text>
        <text x="0" y="22" font-family="'Courier New', monospace" font-size="20" font-weight="bold" fill="#DC2626" text-anchor="middle">DECLASSIFIED 1969</text>
      </g>
    </svg>`;
  }

  if (style === 'map') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="800" viewBox="0 0 1100 800">
      <!-- Antique Parchment Base -->
      <rect width="1100" height="800" fill="#E2D4AC" />
      <rect x="30" y="30" width="1040" height="740" fill="#ECE0BD" stroke="#3A2F22" stroke-width="3" />
      
      <!-- Coordinate Grid Lines -->
      ${Array.from({ length: 8 })
        .map((_, i) => `<line x1="${100 + i * 120}" y1="50" x2="${100 + i * 120}" y2="750" stroke="#78664B" stroke-width="1.2" stroke-dasharray="6,6" opacity="0.5" />`)
        .join('')}
      ${Array.from({ length: 6 })
        .map((_, i) => `<line x1="50" y1="${120 + i * 110}" x2="1050" y2="${120 + i * 110}" stroke="#78664B" stroke-width="1.2" stroke-dasharray="6,6" opacity="0.5" />`)
        .join('')}

      <!-- Cartographic Coastlines / Contour Curves -->
      <path d="M 120 220 C 250 180, 320 290, 450 240 C 580 190, 720 320, 850 260 C 940 220, 980 340, 1020 380" fill="none" stroke="#2B2217" stroke-width="4" />
      <path d="M 140 420 C 310 380, 480 500, 620 440 C 760 380, 890 520, 1000 480" fill="none" stroke="#2B2217" stroke-width="3" />

      <!-- Tactical Red Movement Arrow -->
      <path d="M 280 520 C 420 380, 560 320, 740 310" fill="none" stroke="#DC2626" stroke-width="6" stroke-dasharray="10,6" />
      <polygon points="740,300 765,310 740,325" fill="#DC2626" />

      <!-- Compass Rose -->
      <g transform="translate(930, 160)">
        <circle cx="0" cy="0" r="60" fill="none" stroke="#3A2F22" stroke-width="2" />
        <polygon points="0,-70 12,-15 0,0" fill="#121212" />
        <polygon points="0,-70 -12,-15 0,0" fill="#78664B" />
        <polygon points="0,70 12,15 0,0" fill="#78664B" />
        <polygon points="0,70 -12,15 0,0" fill="#121212" />
        <text x="0" y="-76" font-family="'Georgia', serif" font-size="18" font-weight="bold" fill="#121212" text-anchor="middle">N</text>
      </g>

      <!-- Cartouche / Map Title Banner -->
      <g transform="translate(100, 100)">
        <rect x="0" y="0" width="360" height="90" fill="#F4ECDB" stroke="#2B2217" stroke-width="2" />
        <text x="180" y="38" font-family="'Georgia', serif" font-size="22" font-weight="900" fill="#121212" text-anchor="middle" letter-spacing="2">${safeTopic}</text>
        <text x="180" y="68" font-family="'Courier New', monospace" font-size="14" font-weight="bold" fill="#555" text-anchor="middle">HISTORICAL THEATER OF OPERATIONS</text>
      </g>
    </svg>`;
  }

  // Default: High-Contrast Archival Portrait / Photographic Plate
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="800" viewBox="0 0 1000 800">
    <rect width="1000" height="800" fill="#EAE2C8" />
    <rect x="40" y="40" width="920" height="720" fill="#F4EEDA" stroke="#121212" stroke-width="4" />
    
    <!-- Archival Plate Border -->
    <rect x="70" y="70" width="860" height="600" fill="#121212" />
    <rect x="80" y="80" width="840" height="580" fill="#1E1E1E" />
    
    <!-- Stylized Halftone Historical Subject -->
    <circle cx="500" cy="330" r="140" fill="#404040" />
    <path d="M320 540 C 370 410, 630 410, 680 540 Z" fill="#4A4A4A" />
    <circle cx="500" cy="290" r="70" fill="#666" />
    <polygon points="490,300 510,300 500,340" fill="#333" />
    <ellipse cx="475" cy="275" rx="14" ry="8" fill="#FFF" />
    <ellipse cx="525" cy="275" rx="14" ry="8" fill="#FFF" />
    
    <!-- Halftone dots simulation -->
    ${Array.from({ length: 15 })
      .map((_, i) =>
        Array.from({ length: 20 })
          .map((_, j) => `<circle cx="${140 + j * 38}" cy="${120 + i * 36}" r="2.5" fill="#FFF" opacity="0.12" />`)
          .join('')
      )
      .join('')}

    <!-- Plate Caption Bar -->
    <rect x="70" y="675" width="860" height="70" fill="#F4EEDA" />
    <text x="500" y="710" font-family="'Courier New', monospace" font-size="19" font-weight="900" fill="#121212" text-anchor="middle" letter-spacing="2">FIGURE 0${shotOrder}: ${safeTopic}</text>
    <text x="500" y="735" font-family="'Georgia', serif" font-size="14" font-style="italic" fill="#555" text-anchor="middle">National Archives &amp; Records Administration • Archival Glass Plate Negative</text>

    <!-- Translucent Tape on corners -->
    <rect x="40" y="30" width="110" height="35" transform="rotate(-35, 95, 47)" fill="rgba(235, 220, 175, 0.85)" stroke="rgba(180, 160, 110, 0.5)" />
    <rect x="850" y="30" width="110" height="35" transform="rotate(35, 905, 47)" fill="rgba(235, 220, 175, 0.85)" stroke="rgba(180, 160, 110, 0.5)" />
  </svg>`;
}

/**
 * Main Asset Engine generation function
 */
export async function generateAsset(params: GenerateAssetParams): Promise<{
  success: boolean;
  url: string;
  provider: string;
  status: 'ready' | 'failed';
  error?: string;
}> {
  const { prompt, topic = 'Documentary Subject', shotId = 'shot', assetId = 'asset', role = 'hero', layout = 'newspaper' } = params;
  const timestamp = Date.now();
  const renderId = `${shotId}_${assetId}_${timestamp}`;

  // 1. Check if Gemini API can be used for Image Generation
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      const refinedPrompt = `${prompt}, archival historical photograph, 20th century editorial documentary, high contrast black and white, aged newsprint grain, isolated subject on plain background suitable for paper collage cutout`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image',
        contents: { parts: [{ text: refinedPrompt }] },
        config: { imageConfig: { aspectRatio: '4:3' } },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData && part.inlineData.data) {
          const rawBuffer = Buffer.from(part.inlineData.data, 'base64');
          const rawPath = path.join(TEMP_DIR, `${renderId}_raw.png`);
          fs.writeFileSync(rawPath, rawBuffer);

          const finalPath = path.join(ASSETS_DIR, `${renderId}.png`);
          // Process raw image through FFmpeg for authentic archival paper cutout treatment
          const ffmpegFilter = `ffmpeg -y -i "${rawPath}" -vf "eq=contrast=1.3:brightness=-0.04:saturation=0.1,format=yuv420p" "${finalPath}"`;
          await execAsync(ffmpegFilter).catch(() => {
            fs.copyFileSync(rawPath, finalPath);
          });

          try {
            fs.unlinkSync(rawPath);
          } catch (_) {}

          return {
            success: true,
            url: `/outputs/assets/${renderId}.png`,
            provider: 'gemini-image',
            status: 'ready',
          };
        }
      }
    } catch (geminiErr: any) {
      console.log('Gemini image generation unavailable (free-tier quota limit), activating Procedural Archival Engine:', geminiErr.message?.slice(0, 100));
    }
  }

  // 2. Procedural Archival Generator (High-resolution, instant, 100% reliable)
  try {
    let style = 'archival_photo';
    if (layout === 'newspaper') style = 'newspaper';
    else if (layout === 'map') style = 'map';
    else if (layout === 'document' || layout === 'hero_archive') style = 'document';

    const svgContent = createProceduralArchivalSvg(prompt, topic, style);
    const tempSvgPath = path.join(TEMP_DIR, `${renderId}.svg`);
    const finalPngPath = path.join(ASSETS_DIR, `${renderId}.png`);

    fs.writeFileSync(tempSvgPath, svgContent);

    // Convert SVG to high-res PNG using FFmpeg
    await execAsync(`ffmpeg -y -i "${tempSvgPath}" "${finalPngPath}"`);

    try {
      fs.unlinkSync(tempSvgPath);
    } catch (_) {}

    return {
      success: true,
      url: `/outputs/assets/${renderId}.png`,
      provider: 'procedural_archive_engine',
      status: 'ready',
    };
  } catch (err: any) {
    console.error('Procedural generation error:', err);
    return {
      success: false,
      url: '',
      provider: 'failed',
      status: 'failed',
      error: err.message,
    };
  }
}

/**
 * Handles custom user uploads and applies paper collage cutout treatment
 */
export async function processUploadedImage(
  base64Data: string,
  shotId: string = 'shot',
  assetId: string = 'hero'
): Promise<{ success: boolean; url: string }> {
  const timestamp = Date.now();
  const renderId = `${shotId}_${assetId}_upload_${timestamp}`;
  const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(cleanBase64, 'base64');

  const rawPath = path.join(TEMP_DIR, `${renderId}_raw.png`);
  const finalPath = path.join(ASSETS_DIR, `${renderId}.png`);
  fs.writeFileSync(rawPath, buffer);

  // Apply contrast enhancement & subtle paper tint
  try {
    await execAsync(
      `ffmpeg -y -i "${rawPath}" -vf "eq=contrast=1.2:saturation=0.3,scale=1280:-1" "${finalPath}"`
    );
    try {
      fs.unlinkSync(rawPath);
    } catch (_) {}
  } catch (_) {
    fs.copyFileSync(rawPath, finalPath);
  }

  return {
    success: true,
    url: `/outputs/assets/${renderId}.png`,
  };
}
