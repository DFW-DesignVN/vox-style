import { MotionID } from '../types.ts';

export interface MotionTransform {
  offsetX: number;
  offsetY: number;
  scale: number;
  rotation: number;
  opacity: number;
  progress: number; // 0 to 1
  revealedChars?: number;
}

// Stepped easing for stop-motion physical paper documentary cadence
export function steppedEase(t: number, steps: number = 12): number {
  return Math.floor(t * steps) / steps;
}

// Physical overshoot-and-settle curve
export function overshootSettle(t: number, overshoot: number = 1.08): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  // Cubic overshoot curve
  return 1 + Math.sin(t * Math.PI) * (overshoot - 1) * Math.exp(-t * 3);
}

/**
 * Calculates current motion state given an element's motion type, elapsed shot time, and start timestamp.
 */
export function calculateMotionTransform(
  motion: MotionID,
  shotTime: number,
  startTime: number,
  textLength: number = 0
): MotionTransform {
  const elapsed = shotTime - startTime;

  // Not yet started
  if (elapsed < 0) {
    return {
      offsetX: 0,
      offsetY: 0,
      scale: 0,
      rotation: 0,
      opacity: 0,
      progress: 0,
      revealedChars: 0,
    };
  }

  // Animation duration parameters
  const paperDropDuration = 0.45;
  const slideDuration = 0.5;
  const popDuration = 0.3;
  const drawDuration = 0.6;
  const typewriterSpeed = 22; // Chars per sec

  switch (motion) {
    case 'paper_drop': {
      const linearT = Math.min(1, elapsed / paperDropDuration);
      // Quantized stepped time for paper stop-motion feel
      const steppedT = steppedEase(linearT, 10);
      const settle = overshootSettle(steppedT, 1.05);

      const startOffsetY = -450;
      const currentOffsetY = startOffsetY * (1 - settle);
      const rotationJitter = Math.sin(linearT * Math.PI) * 2.5;

      return {
        offsetX: 0,
        offsetY: currentOffsetY,
        scale: 0.95 + 0.05 * settle,
        rotation: rotationJitter,
        opacity: Math.min(1, linearT * 4),
        progress: linearT,
      };
    }

    case 'paper_slide_left': {
      const linearT = Math.min(1, elapsed / slideDuration);
      const settle = overshootSettle(steppedEase(linearT, 12), 1.04);
      const startOffsetX = 550;
      return {
        offsetX: startOffsetX * (1 - settle),
        offsetY: 0,
        scale: 1,
        rotation: (1 - settle) * 2,
        opacity: Math.min(1, linearT * 5),
        progress: linearT,
      };
    }

    case 'paper_slide_right': {
      const linearT = Math.min(1, elapsed / slideDuration);
      const settle = overshootSettle(steppedEase(linearT, 12), 1.04);
      const startOffsetX = -550;
      return {
        offsetX: startOffsetX * (1 - settle),
        offsetY: 0,
        scale: 1,
        rotation: -(1 - settle) * 2,
        opacity: Math.min(1, linearT * 5),
        progress: linearT,
      };
    }

    case 'paper_slide_up': {
      const linearT = Math.min(1, elapsed / slideDuration);
      const settle = overshootSettle(steppedEase(linearT, 12), 1.03);
      const startOffsetY = 450;
      return {
        offsetX: 0,
        offsetY: startOffsetY * (1 - settle),
        scale: 1,
        rotation: 0,
        opacity: Math.min(1, linearT * 4),
        progress: linearT,
      };
    }

    case 'paper_slide_down': {
      const linearT = Math.min(1, elapsed / slideDuration);
      const settle = overshootSettle(steppedEase(linearT, 12), 1.03);
      const startOffsetY = -450;
      return {
        offsetX: 0,
        offsetY: startOffsetY * (1 - settle),
        scale: 1,
        rotation: 0,
        opacity: Math.min(1, linearT * 4),
        progress: linearT,
      };
    }

    case 'photo_stack': {
      const linearT = Math.min(1, elapsed / paperDropDuration);
      const settle = overshootSettle(steppedEase(linearT, 9), 1.07);
      return {
        offsetX: 0,
        offsetY: -300 * (1 - settle),
        scale: 0.92 + 0.08 * settle,
        rotation: (1 - settle) * 6,
        opacity: Math.min(1, linearT * 4),
        progress: linearT,
      };
    }

    case 'paper_reveal': {
      const linearT = Math.min(1, elapsed / 0.55);
      const t = steppedEase(linearT, 10);
      return {
        offsetX: 0,
        offsetY: (1 - t) * 60,
        scale: 0.95 + 0.05 * t,
        rotation: (1 - t) * -2,
        opacity: t,
        progress: linearT,
      };
    }

    case 'headline_pop': {
      const linearT = Math.min(1, elapsed / popDuration);
      const settle = overshootSettle(linearT, 1.15);
      return {
        offsetX: 0,
        offsetY: 0,
        scale: settle,
        rotation: 0,
        opacity: linearT > 0 ? 1 : 0,
        progress: linearT,
      };
    }

    case 'stamp_in': {
      const linearT = Math.min(1, elapsed / 0.28);
      const settle = overshootSettle(linearT, 1.25);
      return {
        offsetX: 0,
        offsetY: (1 - linearT) * -80,
        scale: 0.8 + 0.2 * settle,
        rotation: 0,
        opacity: Math.min(1, linearT * 6),
        progress: linearT,
      };
    }

    case 'typewriter': {
      const chars = Math.floor(elapsed * typewriterSpeed);
      const revealed = Math.min(textLength, chars);
      return {
        offsetX: 0,
        offsetY: 0,
        scale: 1,
        rotation: 0,
        opacity: 1,
        progress: textLength > 0 ? Math.min(1, revealed / textLength) : 1,
        revealedChars: revealed,
      };
    }

    case 'arrow_draw':
    case 'string_draw': {
      const linearT = Math.min(1, elapsed / drawDuration);
      const steppedT = steppedEase(linearT, 15);
      return {
        offsetX: 0,
        offsetY: 0,
        scale: 1,
        rotation: 0,
        opacity: linearT > 0 ? 1 : 0,
        progress: steppedT,
      };
    }

    default:
      return {
        offsetX: 0,
        offsetY: 0,
        scale: 1,
        rotation: 0,
        opacity: 1,
        progress: 1,
      };
  }
}
