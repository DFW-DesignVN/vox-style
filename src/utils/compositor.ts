import { Shot } from '../types.ts';
import { calculateMotionTransform } from './motionEngine.ts';
import {
  drawAgedPaperBackground,
  drawScissorCutBorder,
  drawMaskingTape,
  drawArchivalStamp,
  drawRedString,
  drawRedMarkerArrow,
} from './paperAssets.ts';
import { getCachedImage, getOrLoadDecodedImage, getHalftonePatternCanvas } from './assetCache.ts';

export { getCachedImage };

/**
 * Preload all image assets for a given shot or project using decode()
 */
export async function preloadShotImages(shot: Shot): Promise<void> {
  const promises: Promise<any>[] = [];
  for (const asset of shot.assets) {
    if (asset.source) {
      promises.push(getOrLoadDecodedImage(asset.source));
    }
  }
  await Promise.all(promises);
}

/**
 * Render a single frame of a VOX documentary shot onto a 1920x1080 canvas
 */
export function renderShotFrame(
  ctx: CanvasRenderingContext2D,
  shot: Shot,
  shotTime: number,
  width: number = 1920,
  height: number = 1080
) {
  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // 1. LAYER 1: Background aged paper texture
  drawAgedPaperBackground(ctx, width, height, shot.background.type);

  // 2. LAYER 2: Visual Assets (Archival Cutouts, Photos, Documents)
  for (const asset of shot.assets) {
    if (shotTime < asset.start) continue;

    const transform = calculateMotionTransform(asset.motion, shotTime, asset.start);
    if (transform.opacity <= 0) continue;

    ctx.save();
    ctx.globalAlpha = transform.opacity;

    // Calculate position
    const posX = (asset.position.x / 100) * width + transform.offsetX;
    const posY = (asset.position.y / 100) * height + transform.offsetY;

    ctx.translate(posX, posY);
    ctx.rotate(((asset.rotation + transform.rotation) * Math.PI) / 180);
    ctx.scale(asset.scale * transform.scale, asset.scale * transform.scale);

    // Standard archival photo sizing
    const isHero = asset.role === 'hero';
    const itemW = isHero ? 620 : 420;
    const itemH = isHero ? 440 : 310;
    const halfW = itemW / 2;
    const halfH = itemH / 2;

    // A. Physical Paper Drop Shadow
    if (asset.shadow?.enabled !== false) {
      ctx.save();
      ctx.shadowColor = 'rgba(20, 16, 12, 0.45)';
      ctx.shadowBlur = isHero ? 28 : 18;
      ctx.shadowOffsetX = 12;
      ctx.shadowOffsetY = 16;
      ctx.fillStyle = '#E8DFCC';
      ctx.fillRect(-halfW, -halfH, itemW, itemH);
      ctx.restore();
    }

    // B. Scissor Cut Paper Backing Border
    drawScissorCutBorder(ctx, -halfW, -halfH, itemW, itemH, 12);

    // C. Photo content
    const img = getCachedImage(asset.source);
    const photoPad = 14;
    const photoW = itemW - photoPad * 2;
    const photoH = itemH - photoPad * 2;

    if (img && img.complete && img.naturalWidth > 0) {
      ctx.save();
      // Clipping to inner photo area
      ctx.beginPath();
      ctx.rect(-halfW + photoPad, -halfH + photoPad, photoW, photoH);
      ctx.clip();

      if (asset.filter === 'grayscale' || !asset.filter) {
        ctx.filter = 'grayscale(100%) contrast(125%) brightness(95%)';
      } else if (asset.filter === 'high_contrast') {
        ctx.filter = 'grayscale(100%) contrast(160%) brightness(90%)';
      }

      // Draw image centered and cover
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const boxAspect = photoW / photoH;
      let drawW = photoW;
      let drawH = photoH;
      let offX = -halfW + photoPad;
      let offY = -halfH + photoPad;

      if (imgAspect > boxAspect) {
        drawW = photoH * imgAspect;
        offX -= (drawW - photoW) / 2;
      } else {
        drawH = photoW / imgAspect;
        offY -= (drawH - photoH) / 2;
      }

      ctx.drawImage(img, offX, offY, drawW, drawH);

      // Pre-baked Halftone dot simulation overlay (fast single draw call)
      const halftoneCanvas = getHalftonePatternCanvas(photoW, photoH);
      ctx.drawImage(halftoneCanvas, -halfW + photoPad, -halfH + photoPad);

      ctx.restore();
    } else {
      // Procedural archival draft card for pending / generating assets
      ctx.save();
      const isGenerating = asset.status === 'generating';
      ctx.fillStyle = isGenerating ? '#1A1815' : '#221F1A';
      ctx.fillRect(-halfW + photoPad, -halfH + photoPad, photoW, photoH);

      // Scissor dashed cutting boundary inside
      ctx.strokeStyle = isGenerating ? '#3B82F6' : '#D97706';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 6]);
      ctx.strokeRect(-halfW + photoPad + 8, -halfH + photoPad + 8, photoW - 16, photoH - 16);
      ctx.setLineDash([]);

      // Scissor cut icon & label
      ctx.fillStyle = isGenerating ? '#60A5FA' : '#FBBF24';
      ctx.font = 'bold 15px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        isGenerating
          ? '⚡ GENERATING PAPER CUTOUT...'
          : '✂ [ PLANNED ASSET CUTOUT ]',
        0,
        -40
      );

      // Prompt snippet
      ctx.font = '13px "Courier New", monospace';
      ctx.fillStyle = '#D4D4D8';
      const promptText = asset.assetPrompt || 'Archival historical photograph';
      const truncated = promptText.length > 55 ? promptText.slice(0, 52) + '...' : promptText;
      ctx.fillText(`"${truncated}"`, 0, -10);

      // Status badge pill
      ctx.fillStyle = isGenerating ? 'rgba(59, 130, 246, 0.25)' : 'rgba(217, 119, 6, 0.25)';
      ctx.fillRect(-100, 15, 200, 28);
      ctx.strokeStyle = isGenerating ? '#3B82F6' : '#D97706';
      ctx.lineWidth = 1;
      ctx.strokeRect(-100, 15, 200, 28);

      ctx.fillStyle = isGenerating ? '#93C5FD' : '#FDE68A';
      ctx.font = 'bold 12px "Courier New", monospace';
      ctx.fillText(
        isGenerating ? 'AI RENDERING IN PROGRESS' : 'STATUS: PENDING GENERATION',
        0,
        34
      );

      ctx.restore();
    }

    ctx.restore();
  }

  // 3. LAYER 3: Graphics (Tape, Arrows, Strings, Stamps)
  for (const g of shot.graphics) {
    if (shotTime < g.start) continue;

    const transform = calculateMotionTransform(g.motion, shotTime, g.start);
    if (transform.opacity <= 0) continue;

    const gX = g.position ? (g.position.x / 100) * width : width / 2;
    const gY = g.position ? (g.position.y / 100) * height : height / 2;

    if (g.type === 'tape') {
      drawMaskingTape(ctx, gX, gY, g.scale ? g.scale * 140 : 140, g.rotation || -12);
    } else if (g.type === 'stamp') {
      if (transform.scale > 0) {
        drawArchivalStamp(ctx, 'CONFIDENTIAL', gX, gY, g.rotation || -8, g.color || '#C62828');
      }
    } else if (g.type === 'arrow') {
      const p1 = g.points?.[0] || [30, 70];
      const p2 = g.points?.[1] || [50, 45];
      const startX = (p1[0] / 100) * width;
      const startY = (p1[1] / 100) * height;
      const endX = (p2[0] / 100) * width;
      const endY = (p2[1] / 100) * height;
      drawRedMarkerArrow(ctx, startX, startY, endX, endY, transform.progress, g.color);
    } else if (g.type === 'red_string') {
      const p1 = g.points?.[0] || [25, 30];
      const p2 = g.points?.[1] || [75, 60];
      const startX = (p1[0] / 100) * width;
      const startY = (p1[1] / 100) * height;
      const endX = (p2[0] / 100) * width;
      const endY = (p2[1] / 100) * height;
      drawRedString(ctx, startX, startY, endX, endY, transform.progress);
    } else if (g.type === 'circle') {
      ctx.save();
      ctx.strokeStyle = g.color || '#C62828';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      const radius = (g.scale || 1) * 70;
      const endAngle = Math.PI * 2 * transform.progress;
      ctx.arc(gX, gY, radius, -Math.PI / 2, -Math.PI / 2 + endAngle);
      ctx.stroke();
      ctx.restore();
    } else if (g.type === 'underline') {
      ctx.save();
      ctx.strokeStyle = g.color || '#DC2626';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      const len = 260 * transform.progress;
      ctx.beginPath();
      ctx.moveTo(gX - len / 2, gY);
      ctx.lineTo(gX + len / 2, gY + 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  // 4. LAYER 4: Typography (Headlines, Dates, Big Metric Numbers)
  for (const t of shot.text) {
    if (shotTime < t.start) continue;

    const transform = calculateMotionTransform(t.motion, shotTime, t.start, t.content.length);
    if (transform.opacity <= 0) continue;

    ctx.save();
    const tX = (t.position.x / 100) * width + transform.offsetX;
    const tY = (t.position.y / 100) * height + transform.offsetY;

    ctx.translate(tX, tY);
    ctx.rotate(((t.rotation || 0) * Math.PI) / 180);
    ctx.scale(transform.scale, transform.scale);

    let displayContent = t.content;
    if (t.motion === 'typewriter') {
      const chars = transform.revealedChars ?? t.content.length;
      displayContent = t.content.substring(0, chars);
      // Blinking cursor if actively typing
      if (chars < t.content.length && Math.floor(shotTime * 5) % 2 === 0) {
        displayContent += '█';
      }
    }

    if (t.role === 'big_number') {
      // Giant editorial metric
      ctx.font = `900 ${t.fontSize || 130}px "Oswald", sans-serif`;
      ctx.fillStyle = t.color || '#111111';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Slight paper shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 6;
      ctx.fillText(displayContent, 0, 0);
    } else if (t.role === 'headline') {
      // Bold condensed editorial headline with intelligent multi-line stacking
      const fontSize = t.fontSize || 64;
      ctx.font = `700 ${fontSize}px "Oswald", "Playfair Display", serif`;

      const words = displayContent.split(' ');
      const lines: string[] = [];
      let currentLine = '';

      for (const w of words) {
        const testLine = currentLine ? `${currentLine} ${w}` : w;
        if (ctx.measureText(testLine).width > 520 && currentLine) {
          lines.push(currentLine);
          currentLine = w;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);

      const lineHeight = fontSize * 1.14;
      const isCentered = Math.abs(t.position.x - 50) < 5;

      lines.forEach((line, idx) => {
        const lineMetrics = ctx.measureText(line);
        const yOffset = idx * lineHeight;
        const xOffset = isCentered ? -lineMetrics.width / 2 : 0;

        // Yellow highlighter or dark paper backing block
        if (t.highlightColor) {
          ctx.fillStyle = t.highlightColor;
          ctx.fillRect(xOffset - 12, yOffset - fontSize * 0.85, lineMetrics.width + 24, fontSize * 1.05);
        } else {
          ctx.fillStyle = '#111111';
          ctx.fillRect(xOffset - 16, yOffset - fontSize * 0.85, lineMetrics.width + 32, fontSize * 1.08);
        }

        ctx.fillStyle = t.highlightColor ? '#111111' : '#F4EEDA';
        ctx.textAlign = isCentered ? 'center' : 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(line, isCentered ? 0 : xOffset, yOffset);
      });
    } else if (t.role === 'date' || t.role === 'label') {
      // Vintage typewriter date / classification badge
      ctx.font = `bold ${t.fontSize || 32}px "Courier Prime", monospace`;
      const metrics = ctx.measureText(displayContent);

      // Archival tape or paper strip background
      ctx.fillStyle = '#EFE7D2';
      ctx.fillRect(-10, -t.fontSize * 0.9, metrics.width + 20, t.fontSize * 1.15);
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 1;
      ctx.strokeRect(-10, -t.fontSize * 0.9, metrics.width + 20, t.fontSize * 1.15);

      ctx.fillStyle = t.color || '#1A1A1A';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(displayContent, 0, 0);
    } else {
      // General body text
      ctx.font = `600 ${t.fontSize || 36}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = t.color || '#18181B';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(displayContent, 0, 0);
    }

    ctx.restore();
  }

  // 5. LAYER 5: Global TV/Editorial Frame & Paper Vignette
  ctx.save();
  const vignette = ctx.createRadialGradient(
    width / 2,
    height / 2,
    width * 0.45,
    width / 2,
    height / 2,
    width * 0.72
  );
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, 'rgba(30, 20, 10, 0.18)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  // Subtle clean editorial border rule
  ctx.strokeStyle = 'rgba(20, 15, 10, 0.12)';
  ctx.lineWidth = 2;
  ctx.strokeRect(30, 30, width - 60, height - 60);

  ctx.restore();
}
