// Canvas → Texture генераторы. Без renderer/g.render().
import { Texture } from "pixi.js";

function toCss(c: number) {
  return "#" + c.toString(16).padStart(6, "0");
}

export function rectTex(w: number, h: number, color: number, radius = 0) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = toCss(color);
  if (radius > 0) {
    const r = radius;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.arcTo(w, 0, w, h, r);
    ctx.arcTo(w, h, 0, h, r);
    ctx.arcTo(0, h, 0, 0, r);
    ctx.arcTo(0, 0, w, 0, r);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillRect(0, 0, w, h);
  }
  return Texture.from(c);
}

export function circleTex(diam: number, color: number, alpha = 1) {
  const r = diam / 2;
  const c = document.createElement("canvas");
  c.width = c.height = diam;
  const ctx = c.getContext("2d")!;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = toCss(color);
  ctx.beginPath();
  ctx.arc(r, r, r, 0, Math.PI * 2);
  ctx.fill();
  return Texture.from(c);
}

export function starTex(size: number, color: number, points = 5) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const r1 = size * 0.5;
  const r2 = size * 0.22;
  ctx.fillStyle = toCss(color);
  ctx.translate(size / 2, size / 2);
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 ? r2 : r1;
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
  return Texture.from(c);
}

export function coinTex(size: number) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const r = size / 2;
  // обод
  const g = ctx.createRadialGradient(r, r, r * 0.2, r, r, r);
  g.addColorStop(0, "#ffe27a");
  g.addColorStop(1, "#e0a300");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(r, r, r, 0, Math.PI * 2);
  ctx.fill();

  // блик
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.beginPath();
  ctx.ellipse(r * 0.7, r * 0.6, r * 0.5, r * 0.25, -0.5, 0, Math.PI * 2);
  ctx.fill();

  return Texture.from(c);
}
