import { useCallback } from "react";
import PixiStage from "@/components/PixiStage";
import { Preloader } from "@/pixi/ui/Preloader";
import { DialScene } from "@/pixi/scenes/dial/DialScene";
import type { Application, Container } from "pixi.js";
import { loadDemoBundle } from "@/pixi/core/loadDemo";

export default function DialPickerPage() {
  const setup = useCallback(
    async ({ app, root, ui }: { app: Application; root: Container; ui: Container }) => {
      const preloader = new Preloader();
      root.addChild(preloader);
      await loadDemoBundle(preloader);
      root.removeChild(preloader);
      preloader.destroy();

      const scene = new DialScene(app, root, ui);
      await scene.init();
    },
    []
  );

  return <PixiStage setup={setup} />;
}
