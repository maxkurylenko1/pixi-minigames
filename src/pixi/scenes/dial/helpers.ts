/**
 * Dial scene helpers
 *
 * Utility math functions used by the dial (wheel) scene:
 * - randInt(a,b): random integer in [a,b]
 * - clamp(v,a,b): clamp value between a and b
 * - mapRange(x,inMin,inMax,outMin,outMax): linear mapping with clamp
 * - ensureAhead(current,target,dir): ensure `target` angle lies ahead of `current` in given direction
 */
export function randInt(a: number, b: number) {
  return Math.floor(a + Math.random() * (b - a + 1));
}
export function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}
export function mapRange(x: number, inMin: number, inMax: number, outMin: number, outMax: number) {
  const t = (x - inMin) / (inMax - inMin);
  return outMin + clamp(t, 0, 1) * (outMax - outMin);
}

export function ensureAhead(current: number, target: number, dir: 1 | -1) {
  let d = target;
  while ((d - current) * dir <= 0) d += dir * Math.PI * 2;
  return d;
}
