import { Container, Graphics, Sprite, Text, Texture } from "pixi.js";
import { ITEM_W, ITEM_H, ITEM_COUNT } from "./constants";
import { mix, shade } from "../../utils/colors";

export function makeCard(index: number, icon?: Texture, color: number = 0x4cc9f0) {
  const c = new Container();

  const bgCol = mix(0x1a1f2a, color, 0.4);
  const edgeCol = shade(bgCol, 0.15);
  const leftCol = mix(color, 0x10131a, 0.1);

  const bg = new Graphics()
    .roundRect(0, 0, ITEM_W, ITEM_H, 10)
    .fill(bgCol)
    .stroke({ width: 1, color: edgeCol, alignment: 1 });
  c.addChild(bg);

  const sep = new Graphics().rect(10, ITEM_H - 1, ITEM_W - 20, 1).fill(shade(bgCol, -0.25));
  c.addChild(sep);

  const left = new Graphics()
    .roundRect(0, 0, 64, ITEM_H, 10)
    .fill(leftCol)
    .stroke({ width: 1, color: shade(leftCol, -0.25) });
  c.addChild(left);

  const markerSize = 20;
  const marker = new Graphics()
    .rect(-markerSize / 2, -markerSize / 2, markerSize, markerSize)
    .fill(shade(color, 0.7))
    .stroke({ width: 1, color: shade(color, -0.25) });
  marker.position.set(32, ITEM_H / 2);
  c.addChild(marker);

  const rightAccent = new Graphics()
    .roundRect(ITEM_W - 6, 8, 4, ITEM_H - 16, 2)
    .fill(shade(color, 0.15));
  c.addChild(rightAccent);

  if (icon) {
    const spr = new Sprite({ texture: icon });
    spr.anchor.set(0.5);
    spr.position.set(32, ITEM_H / 2);
    spr.scale.set(0.9);
    spr.tint = shade(color, 0.35);
    c.addChild(spr);
  }

  const dpr = Math.min(2, window.devicePixelRatio || 1);

  const txt = new Text({
    text: `Item #${((index % ITEM_COUNT) + 1).toString().padStart(2, "0")}`,
    style: { fill: 0xffffff, fontSize: 16 },
  });

  txt.resolution = dpr;
  txt.roundPixels = true;

  txt.x = 80 | 0;
  txt.y = Math.round((ITEM_H - txt.height) / 2);
  c.addChild(txt);

  const frame = new Graphics()
    .roundRect(0.2, 0.2, ITEM_W - 0.4, ITEM_H - 0.4, 10)
    .stroke({ width: 2, color: 0x3b4150, alpha: 0.9 });
  c.addChild(frame);

  return c;
}
