/**
 * Procedural paper collage textures, halftone rasterization, and archival assets
 * for the VOX Documentary Video Engine.
 */

// Offscreen cache for paper backgrounds to prevent thousands of draw calls per frame
const backgroundCache = new Map<string, HTMLCanvasElement>();

export function drawAgedPaperBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  type: 'newsprint' | 'archival' | 'map' | 'corkboard' | 'cream_aged' = 'newsprint'
) {
  const cacheKey = `${type}_${width}_${height}`;
  let cachedCanvas = backgroundCache.get(cacheKey);

  if (!cachedCanvas) {
    cachedCanvas = document.createElement('canvas');
    cachedCanvas.width = width;
    cachedCanvas.height = height;
    const bCtx = cachedCanvas.getContext('2d');
    if (bCtx) {
      renderProceduralPaper(bCtx, width, height, type);
    }
    backgroundCache.set(cacheKey, cachedCanvas);
  }

  ctx.drawImage(cachedCanvas, 0, 0);
}

function renderProceduralPaper(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  type: 'newsprint' | 'archival' | 'map' | 'corkboard' | 'cream_aged'
) {
  ctx.save();

  // Base paper tones
  let baseColor = '#E7DCB9';
  let edgeColor = '#C8BA93';

  if (type === 'cream_aged') {
    baseColor = '#F2EBD9';
    edgeColor = '#D4C7A8';
  } else if (type === 'corkboard') {
    baseColor = '#D2B085';
    edgeColor = '#B88F61';
  } else if (type === 'map') {
    baseColor = '#E3D7B5';
    edgeColor = '#C1AF87';
  }

  // Radial paper gradient with aged edge vignette
  const grad = ctx.createRadialGradient(
    width * 0.5,
    height * 0.5,
    width * 0.1,
    width * 0.5,
    height * 0.5,
    width * 0.75
  );
  grad.addColorStop(0, baseColor);
  grad.addColorStop(0.7, baseColor);
  grad.addColorStop(1, edgeColor);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // If newsprint: draw faint historical newspaper columns in the background
  if (type === 'newsprint') {
    ctx.save();
    ctx.fillStyle = 'rgba(30, 24, 18, 0.04)';
    const cols = 5;
    const colWidth = (width - 160) / cols;
    for (let c = 0; c < cols; c++) {
      const x = 80 + c * colWidth;
      for (let y = 100; y < height - 100; y += 18) {
        const lineLen = colWidth - 25 - (Math.sin(c * 17 + y) * 20);
        ctx.fillRect(x, y, Math.max(20, lineLen), 7);
      }
    }
    // Faint vintage banner
    ctx.fillStyle = 'rgba(25, 20, 15, 0.07)';
    ctx.fillRect(80, 50, width - 160, 26);
    ctx.restore();
  }

  // If map: draw faint vintage cartographic coordinates and contour curves
  if (type === 'map') {
    ctx.save();
    ctx.strokeStyle = 'rgba(80, 65, 45, 0.12)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 8]);
    for (let x = 120; x < width; x += 180) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 100; y < height; y += 150) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();
  }

  // Paper fiber & grain overlay
  ctx.fillStyle = 'rgba(40, 30, 20, 0.015)';
  const step = 4;
  for (let y = 0; y < height; y += step * 3) {
    for (let x = 0; x < width; x += step * 3) {
      if ((x ^ y) % 7 === 0) {
        ctx.fillRect(x, y, step, step);
      }
    }
  }

  // Subtle paper creases / fold shadows
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width * 0.33, 0);
  ctx.lineTo(width * 0.335, height);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, height * 0.5);
  ctx.lineTo(width, height * 0.505);
  ctx.stroke();

  ctx.restore();
}

// Draw physical paper cutout border with scissor-cut irregularities
export function drawScissorCutBorder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  borderWidth: number = 14
) {
  ctx.save();
  // White/cream paper backing
  ctx.fillStyle = '#F5EFE0';
  ctx.beginPath();
  // Irregular rectangle simulating scissor cuts
  const segments = 12;
  const dx = w / segments;
  const dy = h / segments;

  ctx.moveTo(x, y);
  // Top edge
  for (let i = 1; i <= segments; i++) {
    const jitter = ((i % 2 === 0 ? 1 : -1) * 1.5);
    ctx.lineTo(x + i * dx, y + jitter);
  }
  // Right edge
  for (let i = 1; i <= segments; i++) {
    const jitter = ((i % 2 === 0 ? 1 : -1) * 1.5);
    ctx.lineTo(x + w + jitter, y + i * dy);
  }
  // Bottom edge
  for (let i = segments - 1; i >= 0; i--) {
    const jitter = ((i % 2 === 0 ? 1 : -1) * 1.5);
    ctx.lineTo(x + i * dx, y + h + jitter);
  }
  // Left edge
  for (let i = segments - 1; i >= 0; i--) {
    const jitter = ((i % 2 === 0 ? 1 : -1) * 1.5);
    ctx.lineTo(x + jitter, y + i * dy);
  }
  ctx.closePath();
  ctx.fill();

  // Subtle paper edge inner shadow
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

// Draw realistic translucent masking tape strip
export function drawMaskingTape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  length: number = 140,
  angle: number = -12
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((angle * Math.PI) / 180);

  const h = 34;
  const halfL = length / 2;

  // Tape shadow
  ctx.fillStyle = 'rgba(20, 16, 12, 0.18)';
  ctx.fillRect(-halfL + 2, -h / 2 + 3, length, h);

  // Translucent amber tape
  ctx.fillStyle = 'rgba(235, 220, 175, 0.78)';
  ctx.fillRect(-halfL, -h / 2, length, h);

  // Serrated tape edge ends
  ctx.fillStyle = 'rgba(215, 195, 145, 0.9)';
  for (let i = 0; i < 6; i++) {
    const toothY = -h / 2 + (i * h) / 6;
    ctx.fillRect(-halfL - 2, toothY, 3, h / 12);
    ctx.fillRect(halfL - 1, toothY + 2, 3, h / 12);
  }

  // Subtle gloss reflection stripe
  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.fillRect(-halfL, -h / 4, length, h / 3);

  ctx.restore();
}

// Draw archival rubber ink stamp
export function drawArchivalStamp(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  angle: number = -7,
  color: string = '#C62828'
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((angle * Math.PI) / 180);

  ctx.font = 'bold 28px "Courier Prime", monospace';
  const textMetrics = ctx.measureText(text);
  const padX = 22;
  const padY = 14;
  const stampW = textMetrics.width + padX * 2;
  const stampH = 46;

  // Stamp border (weathered ink look with slight dash or texture)
  ctx.strokeStyle = color;
  ctx.lineWidth = 3.5;
  ctx.strokeRect(-stampW / 2, -stampH / 2, stampW, stampH);

  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.strokeRect(-stampW / 2 + 4, -stampH / 2 + 4, stampW - 8, stampH - 8);

  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 1);

  // Ink imperfection specks
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fillRect(-stampW / 4, -stampH / 3, 4, 3);
  ctx.fillRect(stampW / 5, stampH / 4, 3, 4);

  ctx.restore();
}

// Draw red yarn string connecting two points with slight physical sag
export function drawRedString(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  progress: number = 1.0
) {
  ctx.save();
  const currentX2 = x1 + (x2 - x1) * progress;
  const currentY2 = y1 + (y2 - y1) * progress;

  // String shadow
  ctx.strokeStyle = 'rgba(20, 15, 10, 0.25)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  const midX = (x1 + currentX2) / 2;
  const midY = (y1 + currentY2) / 2 + 14 * progress; // Sag curve
  ctx.quadraticCurveTo(midX + 4, midY + 4, currentX2 + 4, currentY2 + 4);
  ctx.stroke();

  // Red string line
  ctx.strokeStyle = '#D32F2F';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(midX, midY, currentX2, currentY2);
  ctx.stroke();

  // Pin heads at start and end
  ctx.fillStyle = '#B71C1C';
  ctx.beginPath();
  ctx.arc(x1, y1, 5, 0, Math.PI * 2);
  ctx.fill();

  if (progress > 0.95) {
    ctx.beginPath();
    ctx.arc(x2, y2, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// Draw hand-drawn red marker arrow along bezier curve
export function drawRedMarkerArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  progress: number = 1.0,
  color: string = '#DC2626'
) {
  ctx.save();
  const targetX = x1 + (x2 - x1) * progress;
  const targetY = y1 + (y2 - y1) * progress;

  // Slight hand-drawn curve control point
  const ctrlX = (x1 + x2) / 2 - (y2 - y1) * 0.15;
  const ctrlY = (y1 + y2) / 2 + (x2 - x1) * 0.15;

  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(ctrlX, ctrlY, targetX, targetY);
  ctx.stroke();

  // Draw arrowhead if progress near end
  if (progress > 0.7) {
    const headLen = 22;
    const angle = Math.atan2(targetY - ctrlY, targetX - ctrlX);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(targetX, targetY);
    ctx.lineTo(
      targetX - headLen * Math.cos(angle - Math.PI / 7),
      targetY - headLen * Math.sin(angle - Math.PI / 7)
    );
    ctx.lineTo(
      targetX - headLen * Math.cos(angle + Math.PI / 7),
      targetY - headLen * Math.sin(angle + Math.PI / 7)
    );
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}
