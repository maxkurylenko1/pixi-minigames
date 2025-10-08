import { useCallback } from "react";
import PixiStage from "@/components/PixiStage";
import { Preloader } from "@/pixi/ui/Preloader";
import { loadDemoBundle } from "@/pixi/core/loadDemo";
import { ScratchScene } from "@/pixi/scenes/scratch/ScratchScene";
import type { Application, Container, Texture } from "pixi.js";

/**
 * ScratchPage
 *
 * Mounts a PixiStage and runs the Scratch demo scene.
 * - Displays a preloader while assets load.
 * - Initializes ScratchScene with loaded textures.
 */
export default function ScratchPage() {
  const setup = useCallback(
    async ({ app, root, ui }: { app: Application; root: Container; ui: Container }) => {
      const preloader = new Preloader();
      root.addChild(preloader);

      const ac = new AbortController();
      const textures = (await loadDemoBundle(preloader, undefined, ac.signal)) as Record<
        string,
        Texture | undefined
      >;
      root.removeChild(preloader);
      preloader.destroy();

      const scene = new ScratchScene(app, root, ui);
      await scene.init(textures);
    },
    []
  );

  return <PixiStage setup={setup} />;
}
