import { Application, Container, Graphics, Text } from "pixi.js";
import { design, theme } from "@/pixi/styles";
import { tween, ease } from "@/pixi/utils/tween";
import { Button } from "@/pixi/ui/Button";
import {
  SECTORS,
  OUTER_R,
  INNER_R,
  LABEL_R,
  CENTER_Y_OFFSET,
  INDICATOR_ALPHA,
  WHEEL_LINE,
  INDICATOR_COLOR,
  ROTATE_TWEEN_MS,
} from "./constants";
import { buildColors, mix, shade } from "@/pixi/scenes/carousel/colors";

// type SetupTextures = Record<string, Texture | undefined>;

export class DialScene {
  private app: Application;
  private root: Container;
  private ui: Container;

  private dial!: Container; // centered container (0,0 is dial center)
  private wheel!: Container; // rotating container (slices & labels)
  private indicator!: Graphics;
  private label!: Text;

  private colors = buildColors(SECTORS, 123456789);

  private dragging = false;
  private dragStartAngle = 0;
  private dragStartRotation = 0;

  private sectorAngle = (Math.PI * 2) / SECTORS;

  constructor(app: Application, root: Container, ui: Container) {
    this.app = app;
    this.root = root;
    this.ui = ui;
  }

  async init() {
    // 1) Centered dial container
    this.dial = new Container();
    this.dial.position.set(design.width / 2, design.height / 2 + CENTER_Y_OFFSET);
    this.root.addChild(this.dial);

    // 2) Rotating wheel
    this.wheel = new Container();
    this.dial.addChild(this.wheel);

    // 3) Build slices
    for (let i = 0; i < SECTORS; i++) {
      const color = this.colors[i];
      const g = this.makeSlice(i, color);
      const t = new Text({
        text: `S${String(i + 1).padStart(2, "0")}`,
        style: { fill: 0xffffff, fontSize: 16, fontWeight: "600" },
      });

      const a0 = -Math.PI / 2 + i * this.sectorAngle;
      const ac = a0 + this.sectorAngle / 2;
      t.anchor.set(0.5);
      t.position.set(Math.cos(ac) * LABEL_R, Math.sin(ac) * LABEL_R);
      t.rotation = ac + Math.PI / 2;
      this.wheel.addChild(g, t);
    }

    // 4) Rim (thin outline)
    const rim = new Graphics()
      .circle(0, 0, OUTER_R)
      .stroke({ width: 2, color: WHEEL_LINE, alpha: 0.9 });
    this.wheel.addChild(rim);

    // 5) Center hub
    const hub = new Graphics()
      .circle(0, 0, INNER_R - 14)
      .fill(0x151821)
      .stroke({ width: 1, color: 0x2f3545, alpha: 0.9 });
    this.wheel.addChild(hub);

    // 6) Fixed indicator at 12 o'clock (doesn't rotate)
    this.indicator = new Graphics()
      .poly([0, -OUTER_R - 8, -8, -OUTER_R + 10, 8, -OUTER_R + 10])
      .fill(INDICATOR_COLOR, INDICATOR_ALPHA);
    this.dial.addChild(this.indicator);

    // 7) Drag hit area
    const hit = new Graphics().circle(0, 0, OUTER_R + 16).fill(0x000000, 0.001);
    hit.eventMode = "static";
    hit.cursor = "grab";
    hit.on("pointerdown", (e) => this.onPointerDown(e));
    hit.on("pointermove", (e) => this.onPointerMove(e));
    hit.on("pointerup", () => this.onPointerUp());
    hit.on("pointerupoutside", () => this.onPointerUp());
    this.dial.addChild(hit);

    // 8) Selected label
    this.label = new Text({
      text: "Selected: —",
      style: { fill: theme.text, fontSize: 20 },
    });
    this.label.anchor.set(0.5);
    this.label.position.set(design.width / 2, this.dial.y - OUTER_R - 30);
    this.root.addChild(this.label);

    // 9) Controls
    const btnTex = Button.makeBaseTexture(this.app.renderer, 64, 14);
    const prev = new Button({ width: 120, height: 40, label: "Prev", texture: btnTex, slice: 12 });
    const next = new Button({ width: 120, height: 40, label: "Next", texture: btnTex, slice: 12 });

    prev.position.set(this.dial.x - 140, this.dial.y + OUTER_R + 18);
    next.position.set(this.dial.x + 20, this.dial.y + OUTER_R + 18);

    this.ui.addChild(prev, next);

    prev.on("pointerup", () => this.nudge(-1));
    next.on("pointerup", () => this.nudge(1));

    // Initial snap to sector 1
    await this.snapToIndex(0, false);
  }

  // Slice (donut sector)
  private makeSlice(i: number, color: number) {
    const a0 = -Math.PI / 2 + i * this.sectorAngle;
    const a1 = a0 + this.sectorAngle;
    const g = new Graphics();

    const col = mix(0x1a1f2a, color, 0.2);
    const edge = shade(col, -0.18);

    g.moveTo(Math.cos(a0) * OUTER_R, Math.sin(a0) * OUTER_R)
      .arc(0, 0, OUTER_R, a0, a1)
      .lineTo(Math.cos(a1) * INNER_R, Math.sin(a1) * INNER_R)
      .arc(0, 0, INNER_R, a1, a0, true)
      .closePath()
      .fill(col)
      .stroke({ width: 1, color: edge, alignment: 0.5 });

    // tiny divider line towards the center (for visual rhythm)
    const mid = a0 + this.sectorAngle / 2;
    g.moveTo(Math.cos(mid) * INNER_R, Math.sin(mid) * INNER_R)
      .lineTo(Math.cos(mid) * (INNER_R + 12), Math.sin(mid) * (INNER_R + 12))
      .stroke({ width: 1, color: shade(edge, -0.1), alpha: 0.5 });

    return g;
  }

  // Dragging
  private onPointerDown(e: import("pixi.js").FederatedPointerEvent) {
    const p = this.dial.toLocal(e.global);
    this.dragStartAngle = Math.atan2(p.y, p.x);
    this.dragStartRotation = this.wheel.rotation;
    this.dragging = true;
    (e.currentTarget as { cursor: string }).cursor = "grabbing";
  }
  private onPointerMove(e: import("pixi.js").FederatedPointerEvent) {
    if (!this.dragging) return;
    const p = this.dial.toLocal(e.global);
    const ang = Math.atan2(p.y, p.x);
    const delta = ang - this.dragStartAngle;
    this.wheel.rotation = this.dragStartRotation + delta;
  }
  private onPointerUp() {
    if (!this.dragging) return;
    this.dragging = false;
    this.snapToNearest();
  }

  // Compute nearest index from current rotation; 12 o'clock is selection
  private rotationToIndex(rot: number) {
    const x = -rot / this.sectorAngle - 0.5;
    let idx = Math.round(x) % SECTORS;
    if (idx < 0) idx += SECTORS;
    return idx;
  }
  private indexToRotation(i: number) {
    return -(i + 0.5) * this.sectorAngle;
  }

  private async snapToNearest() {
    const targetIndex = this.rotationToIndex(this.wheel.rotation);
    await this.snapToIndex(targetIndex, true);
  }

  private async snapToIndex(i: number, animated: boolean) {
    const target = this.indexToRotation(i);
    if (animated) {
      const from = this.wheel.rotation;
      await tween({
        from: 0,
        to: 1,
        duration: ROTATE_TWEEN_MS,
        ease: ease.cubicOut,
        onUpdate: (t) => {
          // shortest path
          let d = target - from;
          d = ((d + Math.PI) % (Math.PI * 2)) - Math.PI;
          this.wheel.rotation = from + d * t;
        },
      });
    } else {
      this.wheel.rotation = target;
    }
    this.label.text = `Selected: S${String(i + 1).padStart(2, "0")}`;
    // quick pulse on selection
    await tween({
      from: 1,
      to: 1.06,
      duration: 120,
      ease: ease.cubicOut,
      onUpdate: (s) => this.wheel.scale.set(s),
    });
    await tween({
      from: 1.06,
      to: 1,
      duration: 160,
      ease: ease.cubicOut,
      onUpdate: (s) => this.wheel.scale.set(s),
    });
  }

  private async nudge(dir: 1 | -1) {
    const i = this.rotationToIndex(this.wheel.rotation);
    const next = (i + (dir === 1 ? 1 : -1) + SECTORS) % SECTORS;
    await this.snapToIndex(next, true);
  }

  destroy() {
    // nothing special; wheel is removed with parent container in PixiStage cleanup
  }
}
