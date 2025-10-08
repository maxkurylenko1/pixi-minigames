import { useCallback } from "react";
import PixiStage from "@/components/PixiStage";
import { Application, Container, Rectangle, Graphics } from "pixi.js";
import { design } from "@/pixi/styles";
import { Button } from "@/pixi/ui/Button";
import { FX } from "@/pixi/fx/FX";
import { loadDemoBundle } from "@/pixi/core/loadDemo";
import { Preloader } from "@/pixi/ui/Preloader";

export default function FxPage() {
  const setup = useCallback(
    async ({ app, root, ui }: { app: Application; root: Container; ui: Container }) => {
      const preloader = new Preloader();
      root.addChild(preloader);
      await loadDemoBundle(preloader);
      root.removeChild(preloader);
      preloader.destroy();

      const fxLayer = new Container();
      fxLayer.zIndex = 500;
      root.addChild(fxLayer);

      const fx = new FX(app, fxLayer);
      // (для отладки удобно)  (window as any).fx = fx;

      const cx = design.width / 2;
      const cy = design.height / 2;

      const backdrop = new Graphics()
        .rect(0, 0, design.width, design.height)
        .fill({ color: 0x000000, alpha: 0 }); // прозрачный
      backdrop.eventMode = "static";
      root.addChildAt(backdrop, 0);

      // --- режим клика мышью
      type Mode = "confetti" | "coins" | "sparkles" | "rays" | "flashshake" | "none";
      let clickMode = "none" as Mode;

      // хелпер подсветки активной кнопки
      const allBtns: { mode: Mode; b: Button }[] = [];
      const highlight = () => {
        for (const { mode, b } of allBtns) {
          b.alpha = clickMode === mode ? 1 : 0.65; // простая подсветка
          b.scale.set(clickMode === mode ? 1.04 : 1);
        }
      };

      // --- обработчик клика по фону
      interface ClickEvent {
        global: { x: number; y: number };
      }

      backdrop.on("pointerdown", (e: ClickEvent) => {
        const p = root.toLocal(e.global);
        switch (clickMode) {
          case "confetti":
            fx.confettiBurst(p.x, p.y, { count: 28 });
            break;
          case "coins":
            fx.coinBurst(p.x, p.y);
            break;
          case "sparkles":
            fx.sparkles(p.x, p.y, 70, 24);
            break;
          case "rays":
            fx.winRays(p.x, p.y);
            break;
          case "flashshake":
            // здесь позиция не нужна — эффект экранный
            (async () => {
              await fx.flash(0xffffff, 0.35, 240);
              await fx.shake(root, 7, 320);
            })();
            break;
          case "none":
            break; // ничего не делаем
        }
      });

      // 1) UI не пропускает события вверх
      ui.eventMode = "static";
      ui.on("pointerdown", (e) => e.stopPropagation());
      ui.on("pointerup", (e) => e.stopPropagation());

      // кнопки
      const btnTex = Button.makeBaseTexture(app.renderer, 64, 14);
      const mk = (label: string, x: number, mode: Mode, preview?: () => void) => {
        const b = new Button({ width: 160, height: 44, label, texture: btnTex, slice: 12 });
        b.position.set(x, cy + 220);
        b.eventMode = "static";
        b.on("pointerdown", (e) => e.stopPropagation());
        b.on("pointerup", (e) => {
          e.stopPropagation();
          clickMode = mode; // переключили режим
          highlight();
          preview?.(); // опционально: показать в центре
        });
        ui.addChild(b);
        allBtns.push({ mode, b });
        return b;
      };

      // 2) Кнопки — только центр
      mk("Confetti", cx - 470, "confetti", () => fx.confettiBurst(cx, cy));
      mk("Coins", cx - 280, "coins", () => fx.coinBurst(cx, cy));
      mk("Sparkles", cx - 90, "sparkles", () => fx.sparkles(cx, cy, 70, 24));
      mk("Win Rays", cx + 100, "rays", () => fx.winRays(cx, cy));
      mk("Flash+Shake", cx + 290, "flashshake", async () => {
        await fx.flash(0xffffff, 0.35, 240);
        await fx.shake(root, 7, 320);
      });

      root.eventMode = "static";
      root.hitArea = new Rectangle(0, 0, design.width, design.height);
    },
    []
  );

  return <PixiStage setup={setup} />;
}
