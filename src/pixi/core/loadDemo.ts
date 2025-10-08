import { Assets, Texture } from "pixi.js";
import { Preloader } from "@/pixi/ui/Preloader";

let assetsInitPromise: Promise<void> | null = null;
async function ensureAssetsInitialized() {
  if (!assetsInitPromise) {
    assetsInitPromise = Assets.init({
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
    })
      .catch((e) => {
        console.warn("[Assets] init:", e?.message ?? e);
      })
      .then(() => void 0);
  }
  return assetsInitPromise;
}

export async function loadDemoBundle(
  preloader: Preloader,
  opts?: { minShowMs?: number; capRealAt?: number },
  signal?: AbortSignal
): Promise<Record<string, Texture>> {
  const minShowMs = opts?.minShowMs ?? 900;
  const capRealAt = opts?.capRealAt ?? 0.92;

  await ensureAssetsInitialized();

  let display = 0;
  let target = 0;
  let raf = 0;
  let aborted = false;

  const startedAt = performance.now();

  const onAbort = () => {
    aborted = true;
    cancelAnimationFrame(raf);
  };
  signal?.addEventListener("abort", onAbort, { once: true });

  const safeSetProgress = (v: number) => {
    if (aborted || !preloader || preloader.destroyed) return;
    preloader.setProgress(v);
  };

  const tick = () => {
    if (aborted) return;
    const dt = 16;
    const catchUp = Math.max((target - display) * 0.18, 0);
    const minStep = 0.0015 * (dt / 16);

    display = Math.min(target, display + catchUp + minStep);
    safeSetProgress(display);

    if (display < 1 - 1e-3) {
      raf = requestAnimationFrame(tick);
    } else {
      safeSetProgress(1);
      cancelAnimationFrame(raf);
    }
  };
  raf = requestAnimationFrame(tick);

  let loaded: Record<string, Texture> = {};
  try {
    loaded = (await Assets.loadBundle(["demo"], (p) => {
      if (aborted) return;
      const capped = Math.min(capRealAt, p);
      if (capped > target) target = capped;
    })) as Record<string, Texture>;
  } catch (err) {
    console.error("[Assets] loadBundle error:", err);
  }

  const elapsed = performance.now() - startedAt;
  if (!aborted && elapsed < minShowMs) {
    await new Promise((r) => setTimeout(r, minShowMs - elapsed));
  }

  target = 1;
  await new Promise<void>((resolve) => {
    const check = () => {
      if (aborted || display >= 1 - 1e-3) resolve();
      else requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  });

  if (signal) signal.removeEventListener("abort", onAbort);
  return loaded;
}
