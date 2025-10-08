import { Application, Container, Sprite, Graphics, Texture, Ticker } from "pixi.js";
import { tween, ease } from "@/pixi/utils/tween";
import { rectTex, starTex, coinTex } from "./textures";

type P = Sprite & {
  vx: number;
  vy: number;
  ax: number;
  ay: number;
  life: number;
  maxLife: number;
  rot: number;
  rotSpeed: number;
  fade: boolean;
  scaleDecay?: number;
  fadeInOut?: boolean;
};

const PALETTE = [
  0xf43f5e, 0x22c55e, 0x3b82f6, 0xf59e0b, 0xa855f7, 0x06b6d4, 0xec4899, 0x84cc16, 0x38bdf8,
  0xfb923c,
];

export class FX {
  private app: Application;
  private layer: Container;
  private particles: P[] = [];
  private effects: Set<Container> = new Set();
  private tickerFn!: (t: Ticker) => void;

  private rectSmall: Texture;
  private sparkle: Texture;
  private coin: Texture;

  constructor(app: Application, layer?: Container) {
    this.app = app;
    this.layer = layer ?? app.stage;

    this.rectSmall = rectTex(10, 16, 0xffffff, 2);
    this.sparkle = starTex(22, 0xffffff, 6);
    this.coin = coinTex(28);

    this.tickerFn = (t) => this.update(t.deltaMS || 16.7);
    this.app.ticker.add(this.tickerFn);
  }

  destroy() {
    this.app.ticker.remove(this.tickerFn);
    for (const p of this.particles) p.destroy();
    this.particles.length = 0;
    for (const c of this.effects) c.destroy({ children: true });
    this.effects.clear();
  }

  // ---------- API ----------
  confettiBurst(x: number, y: number, opts?: { count?: number }) {
    const count = opts?.count ?? 48;
    for (let i = 0; i < count; i++) {
      const s = new Sprite({ texture: this.rectSmall }) as P;
      const col = PALETTE[i % PALETTE.length];
      s.tint = col;
      s.anchor.set(0.5);
      s.position.set(x, y);
      s.rotation = Math.random() * Math.PI * 2;
      s.scale.set(0.6 + Math.random() * 0.8);

      s.vx = (Math.random() * 2 - 1) * 6;
      s.vy = -(4 + Math.random() * 5);
      s.ax = 0;
      s.ay = 0.25;
      s.rot = s.rotation;
      s.rotSpeed = (Math.random() * 2 - 1) * 0.3;

      s.maxLife = 900 + Math.random() * 500;
      s.life = s.maxLife;
      s.fade = true;

      this.layer.addChild(s);
      this.particles.push(s);
    }
  }

  coinBurst(x: number, y: number, opts?: { count?: number }) {
    const count = opts?.count ?? 18;
    for (let i = 0; i < count; i++) {
      const s = new Sprite({ texture: this.coin }) as P;
      s.anchor.set(0.5);
      s.position.set(x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 6);
      s.scale.set(0.9 + Math.random() * 0.4);
      s.vx = (Math.random() * 2 - 1) * 4.5;
      s.vy = -(5 + Math.random() * 4.5);
      s.ax = 0;
      s.ay = 0.35;
      s.rot = Math.random() * Math.PI * 2;
      s.rotSpeed = (Math.random() * 2 - 1) * 0.25;
      s.maxLife = 1100 + Math.random() * 600;
      s.life = s.maxLife;
      s.fade = true;
      this.layer.addChild(s);
      this.particles.push(s);
    }
  }

  sparkles(x: number, y: number, radius = 48, count = 18) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * radius;
      const s = new Sprite({ texture: this.sparkle }) as P;
      s.anchor.set(0.5);
      s.position.set(x + Math.cos(a) * r, y + Math.sin(a) * r);
      s.scale.set(0.4 + Math.random() * 0.7);
      s.alpha = 0.0;
      s.vx = 0;
      s.vy = 0;
      s.ax = 0;
      s.ay = 0;
      s.rot = Math.random() * Math.PI * 2;
      s.rotSpeed = (Math.random() * 2 - 1) * 0.05;
      s.maxLife = 480 + Math.random() * 380;
      s.life = s.maxLife;
      s.fadeInOut = true;
      this.layer.addChild(s);
      this.particles.push(s);
    }
  }

  winRays(x: number, y: number, opts?: { rays?: number; color?: number; lifeMs?: number }) {
    const rays = opts?.rays ?? 16;
    const color = opts?.color ?? 0xf1f5f9;
    const life = opts?.lifeMs ?? 1200;

    const group = new Container();
    group.position.set(x, y);
    this.layer.addChild(group);
    this.effects.add(group);

    for (let i = 0; i < rays; i++) {
      const g = new Graphics();
      g.beginFill(color, 0.35);
      g.moveTo(0, 0);
      g.lineTo(6, 200);
      g.lineTo(-6, 200);
      g.endFill();

      g.rotation = (i / rays) * Math.PI * 2;
      group.addChild(g);
    }

    const fromRot = group.rotation;
    tween({
      from: 0,
      to: 1,
      duration: life,
      ease: ease.cubicOut,
      onUpdate: (t) => {
        group.rotation = fromRot + t * 0.8;
        group.alpha = 1 - t;
      },
      onComplete: () => {
        this.effects.delete(group);
        group.destroy({ children: true });
      },
    });
  }

  async flash(color = 0xffffff, alpha = 0.35, duration = 220) {
    const overlay = new Graphics()
      .rect(0, 0, this.app.renderer.width, this.app.renderer.height)
      .fill({ color, alpha: 0 });
    overlay.zIndex = 9999;
    this.layer.addChild(overlay);
    await tween({
      from: 0,
      to: alpha,
      duration: duration * 0.35,
      ease: ease.cubicOut,
      onUpdate: (a) => (overlay.alpha = a),
    });
    await tween({
      from: alpha,
      to: 0,
      duration: duration * 0.65,
      ease: ease.cubicInOut,
      onUpdate: (a) => (overlay.alpha = a),
    });
    overlay.destroy();
  }

  async shake(target: Container, intensity = 6, duration = 300) {
    const baseX = target.x,
      baseY = target.y;
    await tween({
      from: 0,
      to: 1,
      duration,
      ease: ease.linear,
      onUpdate: (t) => {
        const k = 1 - t;
        target.x = baseX + (Math.random() * 2 - 1) * intensity * k;
        target.y = baseY + (Math.random() * 2 - 1) * intensity * k;
      },
    });
    target.position.set(baseX, baseY);
  }

  private update(deltaMS: number) {
    const dt = Math.min(deltaMS, 50);
    const k = dt / 16.6667;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const s = this.particles[i];
      s.vx += s.ax * k;
      s.vy += s.ay * k;
      s.x += s.vx;
      s.y += s.vy;
      s.rot += s.rotSpeed * k;
      s.rotation = s.rot;

      if (s.fadeInOut) {
        const half = s.maxLife * 0.45;
        const age = s.maxLife - s.life;
        s.alpha = age < half ? age / half : s.life / half;
      } else if (s.fade) {
        s.alpha = Math.max(0, s.life / s.maxLife);
      }

      if (s.scaleDecay) s.scale.set(Math.max(0, s.scale.x - s.scaleDecay * k));

      s.life -= dt;
      if (s.life <= 0) {
        s.destroy();
        this.particles.splice(i, 1);
      }
    }
  }
}
