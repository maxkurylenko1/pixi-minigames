import { useCallback } from "react";
import PixiStage from "@/components/PixiStage";
import { Preloader } from "@/pixi/ui/Preloader";
import { loadDemoBundle } from "@/pixi/core/loadDemo";
import { CarouselScene } from "@/pixi/scenes/carousel/CarouselScene";
import type { Application, Container, Texture } from "pixi.js";

export default function CarouselPage() {
  const setup = useCallback(
    async ({ app, root, ui }: { app: Application; root: Container; ui: Container }) => {
      const preloader = new Preloader();
      root.addChild(preloader);
      const textures = (await loadDemoBundle(preloader)) as Record<string, Texture | undefined>;
      root.removeChild(preloader);
      preloader.destroy();

      const scene = new CarouselScene(app, root, ui);
      await scene.init(textures);
    },
    []
  );

  return <PixiStage setup={setup} />;
}
