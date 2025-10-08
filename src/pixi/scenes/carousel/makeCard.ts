import { Container, Graphics, Sprite, Text, Texture } from "pixi.js";
import { ITEM_W, ITEM_H, ITEM_COUNT } from "./constants";
import { mix, shade } from "./colors";

export function makeCard(index: number, icon?: Texture, color: number = 0x4cc9f0) {
  const c = new Container();

  const bgCol = mix(0x1a1f2a, color, 0.18);
  const edgeCol = shade(bgCol, -0.15);
  const leftCol = mix(color, 0x10131a, 0.25);

  // Card background
  const bg = new Graphics()
    .roundRect(0, 0, ITEM_W, ITEM_H, 10)
    .fill(bgCol)
    .stroke({ width: 1, color: edgeCol, alignment: 1 });
  c.addChild(bg);

  // Thin bottom separator
  const sep = new Graphics().rect(10, ITEM_H - 1, ITEM_W - 20, 1).fill(shade(bgCol, -0.25));
  c.addChild(sep);

  // Left colored strip
  const left = new Graphics()
    .roundRect(0, 0, 64, ITEM_H, 10)
    .fill(leftCol)
    .stroke({ width: 1, color: shade(leftCol, -0.25) });
  c.addChild(left);

  // Small square in the left block
  const markerSize = 20;
  const marker = new Graphics()
    .rect(-markerSize / 2, -markerSize / 2, markerSize, markerSize)
    .fill(shade(color, 0.35))
    .stroke({ width: 1, color: shade(color, -0.25) });
  marker.position.set(32, ITEM_H / 2); // center of the left block (64px wide)
  c.addChild(marker);

  // Thin right accent
  const rightAccent = new Graphics()
    .roundRect(ITEM_W - 6, 8, 4, ITEM_H - 16, 2)
    .fill(shade(color, 0.15));
  c.addChild(rightAccent);

  // Icon
  if (icon) {
    const spr = new Sprite({ texture: icon });
    spr.anchor.set(0.5);
    spr.position.set(32, ITEM_H / 2);
    spr.scale.set(0.9);
    spr.tint = shade(color, 0.35);
    c.addChild(spr);
  }

  // Text
  const txt = new Text({
    text: `Item #${((index % ITEM_COUNT) + 1).toString().padStart(2, "0")}`,
    style: { fill: 0xffffff, fontSize: 16 },
  });
  txt.position.set(80, (ITEM_H - txt.height) / 2);
  c.addChild(txt);

  // Crisp edges
  const frame = new Graphics()
    .roundRect(0.2, 0.2, ITEM_W - 0.4, ITEM_H - 0.4, 10)
    .stroke({ width: 2, color: 0x3b4150, alpha: 0.9 });
  c.addChild(frame);

  return c;
}
