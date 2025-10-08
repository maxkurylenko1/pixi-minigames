// базовые цветовые утилиты
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

// exact random colors (specifically by seed)
export function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hslToInt(h: number, s: number, l: number) {
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (h % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r1 = 0,
    g1 = 0,
    b1 = 0;
  if (hp < 1) [r1, g1, b1] = [c, x, 0];
  else if (hp < 2) [r1, g1, b1] = [x, c, 0];
  else if (hp < 3) [r1, g1, b1] = [0, c, x];
  else if (hp < 4) [r1, g1, b1] = [0, x, c];
  else if (hp < 5) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];
  const m = l - c / 2;
  const r = Math.round((r1 + m) * 255);
  const g = Math.round((g1 + m) * 255);
  const b = Math.round((b1 + m) * 255);
  return (r << 16) | (g << 8) | b;
}

export function niceColor(rand: () => number) {
  const h = Math.floor(rand() * 360);
  const s = 0.55 + rand() * 0.25; // 55–80%
  const l = 0.46 + rand() * 0.1; // 46–56%
  return hslToInt(h, s, l);
}

export function buildColors(count: number, seed = 12345) {
  const rnd = mulberry32(seed);
  return Array.from({ length: count }, () => niceColor(rnd));
}
