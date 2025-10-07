import { useCallback } from "react";
import PixiStage from "../components/PixiStage";
import { Preloader } from "@/pixi/ui/Preloader";
import { Button } from "@/pixi/ui/Button";
import { design, theme } from "@/pixi/styles";
import { loadDemoBundle } from "@/pixi/core/loadDemo";
import { tween, ease } from "@/pixi/utils/tween";
import { Container, Text, Graphics } from "pixi.js";

export default function CarouselPage() {
  interface SetupParams {
    app: import("pixi.js").Application;
    root: import("pixi.js").Container;
    ui: import("pixi.js").Container;
  }
  const setup = useCallback(async ({ app, root, ui }: SetupParams) => {
    const preloader = new Preloader();
    root.addChild(preloader);

    await loadDemoBundle(preloader);
    root.removeChild(preloader);
    preloader.destroy();

    const btnTex = Button.makeBaseTexture(app.renderer, 64, 14);
    const btn = new Button({ width: 220, height: 48, label: "Start", texture: btnTex, slice: 12 });
    btn.position.set((design.width - 220) / 2, (design.height - 48) / 2);
    ui.addChild(btn);

    const info = new Text({ text: "Ready", style: { fill: theme.text, fontSize: 18 } });
    info.anchor.set(0.5);
    info.position.set(design.width / 2, btn.y - 28);
    ui.addChild(info);

    btn.on("pointerup", async () => {
      await tween({
        from: 1,
        to: 1.06,
        duration: 110,
        ease: ease.cubicOut,
        onUpdate: (s: number) => btn.scale.set(s),
      });
      await tween({
        from: 1.06,
        to: 1,
        duration: 160,
        ease: ease.cubicOut,
        onUpdate: (s) => btn.scale.set(s),
      });

      info.text = "Clicked!";
      info.alpha = 0;
      await Promise.all([
        tween({
          from: 0,
          to: 1,
          duration: 140,
          ease: ease.cubicOut,
          onUpdate: (v: number) => (info.alpha = v),
        }),
        tween({
          from: info.y,
          to: info.y - 6,
          duration: 140,
          ease: ease.cubicOut,
          onUpdate: (v: number) => (info.y = v),
        }),
      ]);
      await tween({
        from: 1,
        to: 0,
        duration: 260,
        ease: ease.cubicInOut,
        onUpdate: (v) => (info.alpha = v),
      });

      ripple(ui, btn.x + btn.width / 2, btn.y + btn.height / 2);
    });

    function ripple(layer: Container, x: number, y: number) {
      const ring = new Graphics().circle(0, 0, 18).stroke({ width: 2, color: theme.accent });
      ring.position.set(x, y);
      ring.alpha = 0.7;
      layer.addChild(ring);
      const grow = tween({
        from: 1,
        to: 2.2,
        duration: 380,
        ease: ease.cubicOut,
        onUpdate: (s: number) => ring.scale.set(s),
      });
      const fade = tween({
        from: 0.7,
        to: 0,
        duration: 380,
        ease: ease.cubicInOut,
        onUpdate: (a: number) => (ring.alpha = a),
      });
      Promise.all([grow, fade]).finally(() => ring.destroy());
    }
  }, []);

  return <PixiStage setup={setup} />;
}
