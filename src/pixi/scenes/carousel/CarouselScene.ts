import { Application, BlurFilter, Container, Graphics, Text, Texture } from "pixi.js";
import { Button } from "@/pixi/ui/Button";
import { theme, design } from "@/pixi/styles";
import { tween, ease } from "@/pixi/utils/tween";

import {
  VIEW_W,
  VIEW_H,
  ITEM_H,
  CELL,
  ITEM_COUNT,
  MAX_SPEED,
  CENTER_LINE_ALPHA,
  VIVID_30,
} from "./constants";
import { makeCard } from "./makeCard";

type SpinState = "idle" | "spinning" | "stopping";

export class CarouselScene {
  private app: Application;
  private root: Container;
  private ui: Container;

  private view!: Container;
  private rail!: Container;
  private label!: Text;
  private blur!: BlurFilter;

  private startBtn!: Button;
  private stopBtn!: Button;

  private alignY = (VIEW_H - ITEM_H) / 2;
  private loopLen = ITEM_COUNT * CELL;
  private state: SpinState = "idle";
  private speed = 0;

  private logicalItems: Container[] = [];
  private colors = VIVID_30;

  constructor(app: Application, root: Container, ui: Container) {
    this.app = app;
    this.root = root;
    this.ui = ui;
  }

  async init(textures: Record<string, Texture | undefined>) {
    this.view = new Container();
    this.root.addChild(this.view);

    const maskG = new Graphics().roundRect(0, 0, VIEW_W, VIEW_H, 10).fill(0xffffff);
    this.view.addChild(maskG);

    this.view.position.set((design.width - VIEW_W) / 2, (design.height - VIEW_H) / 2 - 30);

    const frame = new Graphics()
      .roundRect(this.view.x - 4, this.view.y - 4, VIEW_W + 8, VIEW_H + 8, 12)
      .stroke({ width: 2, color: 0x2a2f3a });
    this.root.addChild(frame);

    this.view.sortableChildren = true;
    const centerY = VIEW_H / 2;
    const centerLine = new Graphics()
      .rect(5, centerY - 1, VIEW_W - 10, 2)
      .fill({ color: theme.accent, alpha: CENTER_LINE_ALPHA });
    centerLine.mask = maskG;
    centerLine.zIndex = 6;
    this.view.addChild(centerLine);

    this.rail = new Container();
    this.rail.mask = maskG;
    this.view.addChild(this.rail);

    const icons: Texture[] = [
      textures.p1,
      textures.p2,
      textures.p3,
      textures.p4,
      textures.p5,
    ].filter(Boolean) as Texture[];

    for (let i = 0; i < ITEM_COUNT; i++) {
      const it = makeCard(i, icons[i % Math.max(1, icons.length)], this.colors[i]);
      it.y = i * CELL;
      this.rail.addChild(it);
      this.logicalItems.push(it);
    }
    for (let i = 0; i < ITEM_COUNT; i++) {
      const it = makeCard(i + ITEM_COUNT, icons[i % Math.max(1, icons.length)], this.colors[i]);
      it.y = (i + ITEM_COUNT) * CELL;
      this.rail.addChild(it);
    }

    this.rail.y = this.alignY;
    this.blur = new BlurFilter({ strength: 0, quality: 2 });

    const btnTex = Button.makeBaseTexture(this.app.renderer, 64, 14);
    this.startBtn = new Button({
      width: 140,
      height: 40,
      label: "Start",
      texture: btnTex,
      slice: 12,
    });
    this.stopBtn = new Button({
      width: 140,
      height: 40,
      label: "Stop",
      texture: btnTex,
      slice: 12,
    });

    this.startBtn.position.set(this.view.x + (VIEW_W - 140) / 2 - 80, this.view.y + VIEW_H + 18);
    this.stopBtn.position.set(this.view.x + (VIEW_W - 140) / 2 + 80, this.view.y + VIEW_H + 18);

    this.ui.addChild(this.startBtn, this.stopBtn);

    this.label = new Text({ text: "Selected: —", style: { fill: theme.text, fontSize: 18 } });
    this.label.anchor.set(0.5);
    this.label.position.set(this.view.x + VIEW_W / 2, this.view.y - 24);
    this.ui.addChild(this.label);

    this.startBtn.on("pointerup", () => this.start());
    this.stopBtn.on("pointerup", () => this.stop());
  }

  private tick = () => {
    this.rail.y -= this.speed;
    if (this.rail.y <= this.alignY - this.loopLen) {
      this.rail.y += this.loopLen;
    }
  };

  private async start() {
    if (this.state !== "idle") return;
    this.state = "spinning";
    this.startBtn.eventMode = "none";
    this.stopBtn.eventMode = "none";
    this.rail.filters = [this.blur];

    await tween({
      from: 0,
      to: MAX_SPEED,
      duration: 320,
      ease: ease.cubicOut,
      onUpdate: (v) => {
        this.speed = v;
        this.blur.strength = 2 * (v / MAX_SPEED);
      },
    });

    this.app.ticker.add(this.tick);
    this.stopBtn.eventMode = "static";
  }

  private async stop() {
    if (this.state !== "spinning") return;
    this.state = "stopping";
    this.stopBtn.eventMode = "none";
    this.startBtn.eventMode = "none";

    const targetIndex = Math.floor(Math.random() * ITEM_COUNT);
    const dest = this.pickStopY(this.rail.y, this.alignY, this.loopLen, targetIndex, CELL, 0);

    this.app.ticker.remove(this.tick);

    const fromY = this.rail.y;
    await tween({
      from: 0,
      to: 1,
      duration: 1500,
      ease: ease.cubicInOut,
      onUpdate: (t) => {
        this.rail.y = fromY + (dest - fromY) * t;
        this.blur.strength = 1.5 * (1 - t);
      },
    });

    this.rail.y = dest;
    this.blur.strength = 0;

    const selected = this.logicalItems[targetIndex];
    await this.pulse(selected);

    this.label.text = `Selected: #${(targetIndex + 1).toString().padStart(2, "0")}`;

    this.speed = 0;
    this.state = "idle";
    this.startBtn.eventMode = "static";
    this.stopBtn.eventMode = "static";
  }

  private pickStopY(
    currentY: number,
    alignY: number,
    loopLen: number,
    targetIndex: number,
    cell: number,
    extraLoops = 0
  ) {
    const base = alignY - targetIndex * cell;
    let dest = base;
    while (dest >= currentY) dest -= loopLen;
    dest -= extraLoops * loopLen;
    return dest;
  }

  private async pulse(target: Container) {
    const from = target.scale.x || 1;
    await tween({
      from,
      to: from * 1.06,
      duration: 120,
      ease: ease.cubicOut,
      onUpdate: (s) => target.scale.set(s),
    });
    await tween({
      from: from * 1.06,
      to: from,
      duration: 160,
      ease: ease.cubicOut,
      onUpdate: (s) => target.scale.set(s),
    });
  }

  destroy() {
    try {
      this.app.ticker.remove(this.tick);
    } catch {
      // intentionally ignored
    }
  }
}
