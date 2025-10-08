import { Container, Graphics, Text, Texture, NineSliceSprite, Renderer } from "pixi.js";
import { theme } from "@/pixi/styles";

/**
 * Button UI component
 *
 * Small reusable button built from a nine-slice texture.
 * - Construct with width, height, label and a base texture.
 * - Provides pointer state tints and a helper makeBaseTexture(renderer) to generate a simple texture.
 *
 * Example:
 * const tex = Button.makeBaseTexture(app.renderer, 64, 14);
 * const b = new Button({ width: 160, height: 44, label: "Click", texture: tex });
 */
export type ButtonOpts = {
  width: number;
  height: number;
  label?: string;
  texture: Texture;
  slice?: number;
  slices?: { left: number; top: number; right: number; bottom: number };
};

export class Button extends Container {
  private bg: NineSliceSprite;
  private btnLabel?: Text;
  private _w: number;
  private _h: number;

  constructor(opts: ButtonOpts) {
    super();
    this._w = opts.width;
    this._h = opts.height;

    const l = opts.slices?.left ?? opts.slice ?? 12;
    const t = opts.slices?.top ?? opts.slice ?? 12;
    const r = opts.slices?.right ?? opts.slice ?? 12;
    const b = opts.slices?.bottom ?? opts.slice ?? 12;

    this.bg = new NineSliceSprite({
      texture: opts.texture,
      leftWidth: l,
      topHeight: t,
      rightWidth: r,
      bottomHeight: b,
      width: this._w,
      height: this._h,
    });
    this.bg.tint = theme.accent;
    this.addChild(this.bg);

    if (opts.label) {
      this.btnLabel = new Text({
        text: opts.label,
        style: { fill: 0x0b0c10, fontSize: 18, fontWeight: "600" },
      });
      this.btnLabel.anchor.set(0.5);
      this.btnLabel.position.set(this._w / 2, this._h / 2);
      this.addChild(this.btnLabel);
    }

    this.eventMode = "static";
    this.cursor = "pointer";
    this.on("pointerover", () => (this.bg.tint = theme.accentHover));
    this.on("pointerout", () => (this.bg.tint = theme.accent));
    this.on("pointerdown", () => (this.bg.tint = theme.accentDown));
    this.on("pointerup", () => (this.bg.tint = theme.accentHover));
  }

  setSize(w: number, h: number) {
    this._w = w;
    this._h = h;
    this.bg.width = w;
    this.bg.height = h;
    if (this.btnLabel) this.btnLabel.position.set(w / 2, h / 2);
  }

  static makeBaseTexture(renderer: Renderer, size = 64, radius = 14): Texture {
    const g = new Graphics();
    g.roundRect(0, 0, size, size, radius).fill(0xffffff);
    g.roundRect(2, 2, size - 4, (size - 4) / 2, Math.max(0, radius - 4)).fill({
      color: 0xf8f8f8,
      alpha: 0.9,
    });
    const tex = renderer.generateTexture({ target: g });
    g.destroy();
    return tex;
  }
}
