import { Assets, Texture } from "pixi.js";
import { Preloader } from "../ui/Preloader";

export async function loadDemoBundle(preloader: Preloader): Promise<Record<string, Texture>> {
  await Assets.init({
    manifest: {
      bundles: [
        {
          name: "demo",
          assets: [
            { alias: "p1", src: `/assets/p1.png?cb=${Date.now()}` },
            { alias: "p2", src: `/assets/p2.png?cb=${Date.now()}` },
            { alias: "p3", src: `/assets/p3.png?cb=${Date.now()}` },
            { alias: "p4", src: `/assets/p4.png?cb=${Date.now()}` },
            { alias: "p5", src: `/assets/p5.png?cb=${Date.now()}` },
          ],
        },
      ],
    },
  });

  try {
    const loaded = await Assets.loadBundle(["demo"], (p) => preloader.setProgress(p));
    preloader.setProgress(1);
    return loaded as Record<string, Texture>;
  } catch (e) {
    console.error("[Assets] load error", e);
    preloader.setProgress(1);
    return {};
  }
}
