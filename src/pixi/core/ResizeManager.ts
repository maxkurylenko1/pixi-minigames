import type { Application } from "pixi.js";
import { Container } from "pixi.js";

export class ResizeManager {
  private app: Application;
  private root: Container;
  private baseW: number;
  private baseH: number;

  constructor(app: Application, root: Container, baseW: number, baseH: number) {
    this.app = app;
    this.root = root;
    this.baseW = baseW;
    this.baseH = baseH;
    window.addEventListener("resize", this.handle);
    this.handle();
  }
  private handle = () => {
    const w = this.app.renderer.width;
    const h = this.app.renderer.height;
    const s = Math.min(w / this.baseW, h / this.baseH);
    this.root.scale.set(s);
    this.root.position.set((w - this.baseW * s) / 2, (h - this.baseH * s) / 2);
  };
  destroy() {
    window.removeEventListener("resize", this.handle);
  }
}
