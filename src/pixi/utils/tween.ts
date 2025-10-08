/**
 * Tween utilities
 *
 * Lightweight timing helper that interpolates a numeric value over time.
 * - ease: common easing functions
 * - tween(opts): returns a Promise and calls onUpdate/onComplete; supports AbortSignal.
 *
 * Usage:
 * await tween({ from: 0, to: 1, duration: 200, onUpdate: v => ..., signal });
 */

export type Ease = (t: number) => number;

export const ease = {
  linear: (t: number) => t,
  cubicOut: (t: number) => 1 - Math.pow(1 - t, 3),
  cubicInOut: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
};

type TweenOpts = {
  from: number;
  to: number;
  duration: number;
  ease?: Ease;
  onUpdate?: (v: number) => void;
  onComplete?: () => void;
  signal?: AbortSignal;
};

export function tween(opts: TweenOpts): Promise<void> {
  const { from, to, duration, ease: ez = ease.linear, onUpdate, onComplete, signal } = opts;
  return new Promise((resolve, reject) => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      if (signal?.aborted) {
        cancelAnimationFrame(raf);
        reject(new DOMException("Aborted", "AbortError"));
        return;
      }
      const t = Math.min(1, (now - start) / duration);
      const v = from + (to - from) * ez(t);
      onUpdate?.(v);
      if (t < 1) raf = requestAnimationFrame(tick);
      else {
        onComplete?.();
        resolve();
      }
    };
    raf = requestAnimationFrame(tick);
  });
}
