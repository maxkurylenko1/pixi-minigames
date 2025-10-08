import { Texture } from "pixi.js";

/**
 * Scratch helpers
 *
 * Tiny canvas-based texture generators used by the scratch scene:
 * - makeFoilTexture(size): creates a repeating foil texture for the scratched surface.
 * - makeLinearGradientTexture(w, h, stops): creates a linear gradient texture.
 *
 * These helpers return PIXI.Texture objects created from an offscreen canvas.
 */
export function makeFoilTexture(size = 96): Texture {
  const cvs = document.createElement("canvas");
  cvs.width = size;
  cvs.height = size;
  const ctx = cvs.getContext("2d")!;

  ctx.fillStyle = "#1b1f2a";
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = "rgba(255,255,255,0.09)";
  ctx.lineWidth = 2;
  for (let x = -size; x < size * 2; x += 8) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + size, size);
    ctx.stroke();
  }

  const circle = (cx: number, cy: number, r: number, a: number) => {
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  };
  circle(size * 0.3, size * 0.25, size * 0.18, 0.06);
  circle(size * 0.75, size * 0.7, size * 0.22, 0.05);

  return Texture.from(cvs);
}

export function makeLinearGradientTexture(w: number, h: number, stops: Array<[number, number]>) {
  const cvs = document.createElement("canvas");
  cvs.width = w;
  cvs.height = h;
  const ctx = cvs.getContext("2d")!;
  const grd = ctx.createLinearGradient(0, 0, w, h);
  for (const [off, col] of stops) grd.addColorStop(off, toCss(col));
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, w, h);
  return Texture.from(cvs);
}

export function toCss(c: number) {
  return "#" + c.toString(16).padStart(6, "0");
}
