/**
 * Color utilities
 *
 * Small helpers for color blending and shading.
 * - mix(a,b,t): linear blend between two hex colors
 * - shade(color,t): blend toward black (t<0) or white (t>0)
 *
 * Usage:
 * const blended = mix(0xff0000, 0x0000ff, 0.5);
 */
export function mix(a: number, b: number, t: number) {
  const ar = (a >> 16) & 255,
    ag = (a >> 8) & 255,
    ab = a & 255;
  const br = (b >> 16) & 255,
    bg = (b >> 8) & 255,
    bb = b & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const b2 = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | b2;
}
export function shade(color: number, t: number) {
  return t < 0 ? mix(color, 0x000000, -t) : mix(color, 0xffffff, t);
}
