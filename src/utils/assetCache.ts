// High-performance asset cache with HTMLImageElement.decode() and offscreen texture caching
const imageCache = new Map<string, HTMLImageElement>();
const loadingPromises = new Map<string, Promise<HTMLImageElement | null>>();
const halftoneCache = new Map<string, HTMLCanvasElement>();

/**
 * Get or load a cached HTMLImageElement with proper async decode()
 */
export async function getOrLoadDecodedImage(src: string): Promise<HTMLImageElement | null> {
  if (!src) return null;
  if (imageCache.has(src)) {
    const img = imageCache.get(src)!;
    if (img.complete && img.naturalWidth > 0) return img;
  }
  if (loadingPromises.has(src)) {
    return loadingPromises.get(src)!;
  }

  // Use proxy for remote URLs to avoid CORS tainting of canvas during export
  const effectiveSrc =
    src.startsWith('http://') || src.startsWith('https://')
      ? `/api/proxy-image?url=${encodeURIComponent(src)}`
      : src;

  const p = new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      try {
        if ('decode' in img) {
          await img.decode();
        }
      } catch {
        // Fallback if decode() is unsupported or fails non-critically
      }
      imageCache.set(src, img);
      loadingPromises.delete(src);
      resolve(img);
    };
    img.onerror = () => {
      // If proxy failed, retry directly once
      if (effectiveSrc !== src) {
        const retryImg = new Image();
        retryImg.onload = () => {
          imageCache.set(src, retryImg);
          loadingPromises.delete(src);
          resolve(retryImg);
        };
        retryImg.onerror = () => {
          loadingPromises.delete(src);
          resolve(null);
        };
        retryImg.src = src;
        return;
      }
      loadingPromises.delete(src);
      resolve(null);
    };
    img.src = effectiveSrc;
  });

  loadingPromises.set(src, p);
  return p;
}

/**
 * Synchronous read from cache for tight 60fps render loops
 */
export function getCachedImage(src: string): HTMLImageElement | null {
  if (!src) return null;
  const img = imageCache.get(src);
  if (img && img.complete && img.naturalWidth > 0) {
    return img;
  }
  if (!loadingPromises.has(src) && !img) {
    getOrLoadDecodedImage(src);
  }
  return null;
}

/**
 * Generate or retrieve pre-baked halftone pattern canvas (avoids 10,000 fillRect calls per frame)
 */
export function getHalftonePatternCanvas(width: number, height: number): HTMLCanvasElement {
  const key = `${Math.round(width)}_${Math.round(height)}`;
  if (halftoneCache.has(key)) {
    return halftoneCache.get(key)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
    for (let y = 0; y < canvas.height; y += 4) {
      for (let x = 0; x < canvas.width; x += 4) {
        if ((x + y) % 6 === 0) {
          ctx.fillRect(x, y, 2, 2);
        }
      }
    }
  }
  halftoneCache.set(key, canvas);
  return canvas;
}

/**
 * Cache statistics for performance monitor
 */
export function getAssetCacheStats() {
  let loaded = 0;
  for (const img of imageCache.values()) {
    if (img.complete && img.naturalWidth > 0) loaded++;
  }
  return {
    totalTracked: imageCache.size,
    readyCount: loaded,
    loadingCount: loadingPromises.size,
    halftonePatterns: halftoneCache.size,
  };
}
