import {
  Application,
  Container,
  FederatedPointerEvent,
  Graphics,
  Rectangle,
  Sprite,
  Text,
  Texture,
  TilingSprite,
} from "pixi.js";
import { design, theme } from "@/pixi/styles";
import { Button } from "@/pixi/ui/Button";
import { tween, ease } from "@/pixi/utils/tween";
import { VIEW_W, VIEW_H, RADIUS, STEP, GRID_CELL, REVEAL_THRESHOLD } from "./constants";
import { makeFoilTexture, makeLinearGradientTexture } from "./helpers";

type TexMap = Record<string, Texture | undefined>;

export class ScratchScene {
  private app: Application;
  private root: Container;
  private ui: Container;

  private view!: Container;
  private reveal!: Container; // всё, что будет видно через маску
  private baseBg!: Sprite; // фон во время стирания (внутри reveal → под маской)
  private winBg!: Sprite; // победный фон; поначалу скрыт, появляется на Reveal
  private foil!: TilingSprite; // мерцающая «фольга» под маской
  private cover!: Graphics; // прямоугольник, на нём висит интеракция
  private frame!: Graphics;

  private maskG!: Graphics; // векторная маска (круги кисти)

  private label!: Text;
  private resetBtn!: Button;
  private revealBtn!: Button;

  private drawing = false;
  private lastLocal: { x: number; y: number } | null = null;

  private cols = Math.ceil(VIEW_W / GRID_CELL);
  private rows = Math.ceil(VIEW_H / GRID_CELL);
  private marked: Uint8Array = new Uint8Array(this.cols * this.rows);
  private markedCount = 0;

  private disposed = false;

  constructor(app: Application, root: Container, ui: Container) {
    this.app = app;
    this.root = root;
    this.ui = ui;
  }

  async init(textures: TexMap) {
    // 1) контейнер по центру
    this.view = new Container();
    this.view.position.set((design.width - VIEW_W) / 2, (design.height - VIEW_H) / 2 - 20);
    this.root.addChild(this.view);

    // 2) COVER снизу: прямоугольник (на нём интеракция + хит-область)
    this.cover = new Graphics()
      .roundRect(0, 0, VIEW_W, VIEW_H, 10)
      .fill({ color: 0x222733, alpha: 0.95 });
    this.view.addChild(this.cover);
    this.cover.eventMode = "static";
    this.cover.cursor = "crosshair";
    this.cover.hitArea = new Rectangle(0, 0, VIEW_W, VIEW_H); // ← ограничиваем инпут

    // 3) FOIL над cover (будет видна сквозь маску)
    const foilTex = makeFoilTexture(96);
    this.foil = new TilingSprite({ texture: foilTex, width: VIEW_W, height: VIEW_H });
    this.foil.alpha = 0.22;
    this.view.addChild(this.foil);

    const foilTick = () => {
      this.foil.tilePosition.x += 0.2;
      this.foil.tilePosition.y += 0.12;
    };
    this.app.ticker.add(foilTick);

    // 4) REVEAL: сюда кладём базовый фон, победный фон и (опционально) картинки
    this.reveal = new Container();
    this.view.addChild(this.reveal);

    // 4.1) базовый фон (виден во время стирания)
    this.baseBg = new Sprite({
      texture: makeLinearGradientTexture(VIEW_W, VIEW_H, [
        [0, 0x0ea5e9], // бирюзовый
        [1, 0x9333ea], // фиолет
      ]),
    });
    this.reveal.addChild(this.baseBg);

    // 4.2) победный фон (будет поверх baseBg, но с альфой 0 до Reveal)
    this.winBg = new Sprite({
      texture: makeLinearGradientTexture(VIEW_W, VIEW_H, [
        [0, 0x22c55e], // зелёный
        [1, 0xf59e0b], // янтарный
      ]),
    });
    this.winBg.alpha = 0; // появится на Reveal
    this.reveal.addChild(this.winBg);

    // 4.3) произвольный контент (плитка из ассетов) — поверх фонов
    const pics = [textures.p1, textures.p2, textures.p3, textures.p4, textures.p5].filter(
      Boolean
    ) as Texture[];
    if (pics.length) {
      const cols = 3,
        rows = 2;
      const cellW = Math.floor(VIEW_W / cols),
        cellH = Math.floor(VIEW_H / rows);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const t = pics[(r * cols + c) % pics.length];
          const spr = new Sprite({ texture: t });
          spr.width = cellW;
          spr.height = cellH;
          spr.x = c * cellW;
          spr.y = r * cellH;
          this.reveal.addChild(spr);
        }
      }
    }

    // 5) МАСКА: одна на foil и reveal → «дырки» видны везде
    this.maskG = new Graphics();
    this.view.addChild(this.maskG);
    this.reveal.mask = this.maskG;
    this.foil.mask = this.maskG;

    // 6) рамка
    this.frame = new Graphics()
      .roundRect(this.view.x - 2, this.view.y - 2, VIEW_W + 4, VIEW_H + 4, 12)
      .stroke({ width: 2, color: 0x2a2f3a });
    this.root.addChild(this.frame);

    // 7) лейбл
    this.label = new Text({
      text: "Scratch to reveal (0%)",
      style: { fill: theme.text, fontSize: 18 },
    });
    this.label.anchor.set(0.5);
    this.label.position.set(this.view.x + VIEW_W / 2, this.view.y - 18);
    this.label.resolution = Math.min(2, window.devicePixelRatio || 1);
    this.root.addChild(this.label);

    // 8) кнопки
    const btnTex = Button.makeBaseTexture(this.app.renderer, 64, 14);
    this.resetBtn = new Button({
      width: 120,
      height: 40,
      label: "Reset",
      texture: btnTex,
      slice: 12,
    });
    this.revealBtn = new Button({
      width: 120,
      height: 40,
      label: "Reveal",
      texture: btnTex,
      slice: 12,
    });
    this.resetBtn.position.set(this.view.x + VIEW_W / 2 - 140, this.view.y + VIEW_H + 16);
    this.revealBtn.position.set(this.view.x + VIEW_W / 2 + 20, this.view.y + VIEW_H + 16);
    this.ui.addChild(this.resetBtn, this.revealBtn);

    this.resetBtn.on("pointerup", () => this.reset());
    this.revealBtn.on("pointerup", () => this.revealAll());

    // 9) инпут — ТОЛЬКО в рамках cover (hitArea), плюс проверка границ
    this.cover.on("pointerdown", (e: FederatedPointerEvent) => this.beginDraw(e));
    this.cover.on("pointermove", (e: FederatedPointerEvent) => this.moveDraw(e));
    this.cover.on("pointerup", () => this.endDraw());
    this.cover.on("pointerupoutside", () => this.endDraw());

    // старт
    this.resetGrid();
    this.clearMask();
    this.updateLabel(0);

    // корректная отписка анимации фольги
    const baseDestroy = this.destroy.bind(this);
    this.destroy = () => {
      this.app.ticker.remove(foilTick);
      baseDestroy();
    };
  }

  // --- утиль ---
  private inside(x: number, y: number) {
    return x >= 0 && y >= 0 && x <= VIEW_W && y <= VIEW_H;
  }
  private clearMask() {
    this.maskG.clear(); // скрыли всё
  }

  // --- прогресс ---
  private resetGrid() {
    this.marked.fill(0);
    this.markedCount = 0;
  }
  private updateLabel(p: number) {
    if (!Number.isFinite(p) || Number.isNaN(p)) p = 0;
    const pct = Math.round(Math.max(0, Math.min(1, p)) * 100);
    this.label.text = p >= 1 ? "Revealed!" : `Scratch to reveal (${pct}%)`;
  }
  private gridProgress() {
    const total = this.cols * this.rows;
    return total > 0 ? this.markedCount / total : 0;
  }
  private markGridCircle(cx: number, cy: number, r: number) {
    const minC = Math.max(0, Math.floor((cx - r) / GRID_CELL));
    const maxC = Math.min(this.cols - 1, Math.floor((cx + r) / GRID_CELL));
    const minR = Math.max(0, Math.floor((cy - r) / GRID_CELL));
    const maxR = Math.min(this.rows - 1, Math.floor((cy + r) / GRID_CELL));
    const r2 = r * r;

    for (let gy = minR; gy <= maxR; gy++) {
      for (let gx = minC; gx <= maxC; gx++) {
        const idx = gy * this.cols + gx;
        if (this.marked[idx]) continue;
        const cxCell = gx * GRID_CELL + GRID_CELL * 0.5;
        const cyCell = gy * GRID_CELL + GRID_CELL * 0.5;
        const dx = cxCell - cx;
        const dy = cyCell - cy;
        if (dx * dx + dy * dy <= r2) {
          this.marked[idx] = 1;
          this.markedCount++;
        }
      }
    }
  }

  // --- рисование (только внутри поля) ---
  private stampAt(x: number, y: number) {
    if (!this.inside(x, y)) return;
    this.maskG.circle(x, y, RADIUS).fill({ color: 0xffffff }); // белым в маску

    this.markGridCircle(x, y, RADIUS);
    const p = this.gridProgress();
    this.updateLabel(p);
    if (p >= REVEAL_THRESHOLD) this.revealAll();
  }

  private beginDraw(e: FederatedPointerEvent) {
    if (this.disposed) return;
    const p = this.cover.toLocal(e.global);
    if (!this.inside(p.x, p.y)) return;
    this.drawing = true;
    this.lastLocal = p;
    this.stampAt(p.x, p.y);
  }

  private moveDraw(e: FederatedPointerEvent) {
    if (!this.drawing || this.disposed) return;
    const p = this.cover.toLocal(e.global);
    const last = this.lastLocal!;
    const dx = p.x - last.x,
      dy = p.y - last.y;
    const dist = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.floor(dist / STEP));
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const x = last.x + dx * t;
      const y = last.y + dy * t;
      if (this.inside(x, y)) this.stampAt(x, y);
    }
    this.lastLocal = p;
  }

  private endDraw() {
    this.drawing = false;
    this.lastLocal = null;
  }

  // --- действия ---
  private async revealAll() {
    if (this.disposed) return;

    this.maskG.clear();
    this.maskG.rect(0, 0, VIEW_W, VIEW_H).fill({ color: 0xffffff });

    // плавно показываем "победный" фон
    await tween({
      from: this.winBg.alpha,
      to: 1,
      duration: 420,
      ease: ease.cubicOut,
      onUpdate: (a) => {
        if (!this.disposed) this.winBg.alpha = a;
      },
    });

    // можно немного усилить foil
    await tween({
      from: this.foil.alpha,
      to: 0.3,
      duration: 260,
      ease: ease.cubicOut,
      onUpdate: (a) => {
        if (!this.disposed) this.foil.alpha = a;
      },
    });

    // финализируем прогресс
    this.marked.fill(1);
    this.markedCount = this.cols * this.rows;
    this.updateLabel(1);
  }

  private async reset() {
    if (this.disposed) return;
    this.clearMask();
    this.resetGrid();
    this.updateLabel(0);
    this.winBg.alpha = 0; // спрятать победный фон
    this.foil.alpha = 0.22;
  }

  destroy() {
    this.disposed = true;
    try {
      this.cover.removeAllListeners();
    } catch {
      // intentionally ignored
    }
  }
}
