// src/pixi/core/loadDemo.ts
import { Assets, Texture } from "pixi.js";
import { Preloader } from "@/pixi/ui/Preloader";

/**
 * Инициализация manifest и плавная загрузка demo-бандла c прогрессом.
 * Возвращает загруженные текстуры по alias.
 */
export async function loadDemoBundle(
  preloader: Preloader,
  opts?: {
    /** минимальная длительность показа прелоадера, мс */
    minShowMs?: number;
    /** максимум «реального» прогресса (остальное — плавное добивание) */
    capRealAt?: number; // 0..1
  }
): Promise<Record<string, Texture>> {
  const minShowMs = opts?.minShowMs ?? 900;
  const capRealAt = opts?.capRealAt ?? 0.92; // оставим 8% на «финиш»

  await Assets.init({
    manifest: {
      bundles: [
        {
          name: "demo",
          assets: [
            // можно любые PNG в /public/assets
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

  // Плавный прогресс: display → target (реальный прогресс обрезаем capRealAt)
  let display = 0; // то, что показываем на полоске
  let target = 0; // реальный прогресс (с потолком capRealAt)
  let raf = 0;
  const startedAt = performance.now();

  const tick = () => {
    // скорость «подтягивания» + минимальный шаг, чтобы полоса не залипала
    const dt = 16; // усреднение
    const catchUp = Math.max((target - display) * 0.18, 0); // ease к цели
    const minStep = 0.0015 * (dt / 16); // базовый шаг ~0.15% на кадр

    display = Math.min(target, display + catchUp + minStep);
    preloader.setProgress(display);

    if (display < 1 - 1e-3) {
      raf = requestAnimationFrame(tick);
    } else {
      preloader.setProgress(1);
      cancelAnimationFrame(raf);
    }
  };
  raf = requestAnimationFrame(tick);

  let loaded: Record<string, Texture> = {};

  try {
    loaded = (await Assets.loadBundle(["demo"], (p) => {
      // реальный прогресс ограничим capRealAt (например, 0.92)
      const capped = Math.min(capRealAt, p);
      if (capped > target) target = capped;
    })) as Record<string, Texture>;
  } catch (err) {
    console.error("[Assets] loadBundle error:", err);
    // В ошибке тоже «добьём» анимацию
  }

  // Гарантируем минимальную длительность показа
  const elapsed = performance.now() - startedAt;
  if (elapsed < minShowMs) {
    await new Promise((r) => setTimeout(r, minShowMs - elapsed));
  }

  // Финальный рывок  (target = 1, дождёмся пока display догонит)
  target = 1;
  await new Promise<void>((resolve) => {
    const check = () => {
      if (display >= 1 - 1e-3) resolve();
      else requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  });

  return loaded;
}
