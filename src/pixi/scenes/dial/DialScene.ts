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
  VIVID_20,
} from "./constants";
import { mix, shade } from "@/pixi/utils/colors";
import { clamp, ensureAhead, mapRange, randInt } from "./helpers";

/**
 * DialScene
 *
 * Rotating wheel / dial demo:
 * - Builds a segmented wheel with labels and an indicator.
 * - Supports pointer drag to interactively rotate the wheel and a programmatic spin.
 * - spinRandom(direction, extraTurns) animates a spin and highlights the selected sector.
 *
 * Usage:
 *  const scene = new DialScene(app, root, ui);
 *  await scene.init();
 *  scene.destroy();
 */
export class DialScene {
  private app: Application;
  private root: Container;
  private ui: Container;

  private dial!: Container;
  private wheel!: Container;
  private indicator!: Graphics;
  private label!: Text;

  private colors = VIVID_20;
  private sectorAngle = (Math.PI * 2) / SECTORS;

  private dragging = false;
  private dragStartAngle = 0;
  private dragStartRotation = 0;
  private dragStartTime = 0;

  private spinning = false;

  constructor(app: Application, root: Container, ui: Container) {
    this.app = app;
    this.root = root;
    this.ui = ui;
  }

  async init() {
    this.dial = new Container();
    this.dial.position.set(design.width / 2, design.height / 2 + CENTER_Y_OFFSET);
    this.root.addChild(this.dial);

    this.wheel = new Container();
    this.dial.addChild(this.wheel);

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
      t.rotation = ac + Math.PI / 2; // текст остаётся вертикальным
      this.wheel.addChild(g, t);
    }

    const rim = new Graphics()
      .circle(0, 0, OUTER_R)
      .stroke({ width: 2, color: WHEEL_LINE, alpha: 0.9 });
    this.wheel.addChild(rim);

    const hub = new Graphics()
      .circle(0, 0, INNER_R - 14)
      .fill(0x151821)
      .stroke({ width: 1, color: 0x2f3545, alpha: 0.9 });
    this.wheel.addChild(hub);

    this.indicator = new Graphics()
      .poly([0, -OUTER_R - 8, -8, -OUTER_R + 10, 8, -OUTER_R + 10])
      .fill(INDICATOR_COLOR, INDICATOR_ALPHA);
    this.dial.addChild(this.indicator);

    const hit = new Graphics().circle(0, 0, OUTER_R + 16).fill(0x000000, 0.001);
    hit.eventMode = "static";
    hit.cursor = "grab";
    hit.on("pointerdown", (e) => this.onPointerDown(e));
    hit.on("pointermove", (e) => this.onPointerMove(e));
    hit.on("pointerup", () => this.onPointerUp());
    hit.on("pointerupoutside", () => this.onPointerUp());
    this.dial.addChild(hit);

    this.label = new Text({ text: "Selected: —", style: { fill: theme.text, fontSize: 20 } });
    this.label.anchor.set(0.5);
    this.label.position.set(design.width / 2, this.dial.y - OUTER_R - 30);
    this.root.addChild(this.label);

    const btnTex = Button.makeBaseTexture(this.app.renderer, 64, 14);
    const spin = new Button({ width: 160, height: 44, label: "Spin", texture: btnTex, slice: 12 });
    spin.position.set(this.dial.x - 80, this.dial.y + OUTER_R + 18);
    this.ui.addChild(spin);
    spin.on("pointerup", () => this.spinRandom());

    await this.snapToIndex(0, false);
  }

  private makeSlice(i: number, color: number) {
    const a0 = -Math.PI / 2 + i * this.sectorAngle;
    const a1 = a0 + this.sectorAngle;
    const g = new Graphics();

    const col = mix(0x1a1f2a, color, 0.6);
    const edge = shade(col, 0.2);

    g.moveTo(Math.cos(a0) * OUTER_R, Math.sin(a0) * OUTER_R)
      .arc(0, 0, OUTER_R, a0, a1)
      .lineTo(Math.cos(a1) * INNER_R, Math.sin(a1) * INNER_R)
      .arc(0, 0, INNER_R, a1, a0, true)
      .closePath()
      .fill(col)
      .stroke({ width: 2, color: edge, alignment: 0.5 });

    const mid = a0 + this.sectorAngle / 2;
    g.moveTo(Math.cos(mid) * INNER_R, Math.sin(mid) * INNER_R)
      .lineTo(Math.cos(mid) * (INNER_R + 12), Math.sin(mid) * (INNER_R + 12))
      .stroke({ width: 2, color: shade(edge, -0.1), alpha: 0.5 });

    return g;
  }

  private onPointerDown(e: import("pixi.js").FederatedPointerEvent) {
    if (this.spinning) return; // во время спина блокируем
    const p = this.dial.toLocal(e.global);
    this.dragStartAngle = Math.atan2(p.y, p.x);
    this.dragStartRotation = this.wheel.rotation;
    this.dragStartTime = performance.now();
    this.dragging = true;
    (e.currentTarget as { cursor: string }).cursor = "grabbing";
  }

  private onPointerMove(e: import("pixi.js").FederatedPointerEvent) {
    if (!this.dragging || this.spinning) return;
    const p = this.dial.toLocal(e.global);
    const ang = Math.atan2(p.y, p.x);
    const delta = ang - this.dragStartAngle;
    this.wheel.rotation = this.dragStartRotation + delta * 0.25;
  }

  private onPointerUp() {
    if (!this.dragging || this.spinning) return;
    this.dragging = false;

    const now = performance.now();
    const dt = Math.max(1, now - this.dragStartTime);
    const currentAngle = this.wheel.rotation;
    const dAngle = currentAngle - this.dragStartRotation;
    const velocity = dAngle / dt;
    const minFlick = 0.0001;
    if (Math.abs(velocity) < minFlick) {
      const dir: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
      this.spinRandom(dir);
    } else {
      const dir: 1 | -1 = velocity > 0 ? 1 : -1;
      const turns = clamp(Math.round(mapRange(Math.abs(velocity), minFlick, 0.02, 2, 6)), 2, 8);
      this.spinRandom(dir, turns);
    }
  }

  private rotationToIndex(rot: number) {
    const x = -rot / this.sectorAngle - 0.5;
    let idx = Math.round(x) % SECTORS;
    if (idx < 0) idx += SECTORS;
    return idx;
  }
  private indexToRotation(i: number) {
    return -(i + 0.5) * this.sectorAngle;
  }

  private async snapToIndex(i: number, animated: boolean) {
    const target = this.indexToRotation(i);
    if (animated) {
      const from = this.wheel.rotation;
      let d = target - from;
      d = ((d + Math.PI) % (Math.PI * 2)) - Math.PI;
      await tween({
        from: 0,
        to: 1,
        duration: 450,
        ease: ease.cubicOut,
        onUpdate: (t) => (this.wheel.rotation = from + d * t),
      });
    } else {
      this.wheel.rotation = target;
    }
    this.afterLanded(i);
  }

  private async spinRandom(dir?: 1 | -1, extraTurns?: number) {
    if (this.spinning) return;
    this.spinning = true;

    const targetIndex = Math.floor(Math.random() * SECTORS);
    const base = this.indexToRotation(targetIndex);

    const direction: 1 | -1 = dir ?? (Math.random() < 0.5 ? 1 : -1);
    const turns = extraTurns ?? randInt(2, 5);

    const destBase = ensureAhead(this.wheel.rotation, base, direction);
    const dest = destBase + direction * (Math.PI * 2) * turns;

    const distance = Math.abs(dest - this.wheel.rotation);
    const duration = clamp(900 + distance * 180, 1400, 3600);

    const from = this.wheel.rotation;
    await tween({
      from: 0,
      to: 1,
      duration,
      ease: ease.cubicInOut,
      onUpdate: (t) => (this.wheel.rotation = from + (dest - from) * t),
    });

    this.afterLanded(targetIndex);
    this.spinning = false;
  }

  private async afterLanded(index: number) {
    this.label.text = `Selected: S${String(index + 1).padStart(2, "0")}`;

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

  destroy() {}
}
