import { Container, Graphics, Text } from "pixi.js";
import { design, theme } from "@/pixi/styles";

export class Preloader extends Container {
  private barBg: Graphics;
  private barFill: Graphics;
  private loadingLabel: Text;

  constructor() {
    super();
    const barW = 520;
    const barH = 10;

    this.barBg = new Graphics().roundRect(0, 0, barW, barH, 5).fill(0x2a2f3a);
    this.barFill = new Graphics().roundRect(0, 0, 1, barH, 5).fill(theme.accent);
    this.loadingLabel = new Text({ text: "Loading 0%", style: { fill: theme.text, fontSize: 16 } });

    this.barBg.position.set((design.width - barW) / 2, design.height / 2);
    this.barFill.position.copyFrom(this.barBg.position);
    this.loadingLabel.position.set(
      design.width / 2 - this.loadingLabel.width / 2,
      this.barBg.y - 28
    );

    this.addChild(this.barBg, this.barFill, this.loadingLabel);
  }

  setProgress(p: number) {
    const barW = 520;
    const w = Math.max(1, Math.floor(barW * p));
    this.barFill.clear().roundRect(0, 0, w, 10, 5).fill(0x4cc9f0);
    this.loadingLabel.text = `Loading ${Math.round(p * 100)}%`;
    this.loadingLabel.position.x = (design.width - this.loadingLabel.width) / 2;
  }
}
