import { useEffect, useRef } from "react";
import { Application, Container } from "pixi.js";
import { design, theme } from "@/pixi/styles";
import { ResizeManager } from "@/pixi/core/ResizeManager";

type SetupCtx = { app: Application; root: Container; ui: Container };
type Props = { setup: (ctx: SetupCtx) => Promise<void> | void };

export default function PixiStage({ setup }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const resizerRef = useRef<ResizeManager | null>(null);
  const cleanedRef = useRef(false);

  useEffect(() => {
    cleanedRef.current = false;

    let cancelled = false;

    const boot = async () => {
      let app: Application | null = null;
      try {
        app = new Application();
        const hostSize = hostRef.current;
        if (!hostSize) {
          console.warn("[PixiStage] host div missing");
          return;
        }

        await app.init({
          backgroundColor: theme.bg,
          resizeTo: hostSize,
          antialias: false,
          autoDensity: true,
          resolution: Math.min(window.devicePixelRatio, 2),
        });

        if (cancelled) {
          try {
            app.destroy(true);
          } catch (err) {
            console.warn("[PixiStage] destroy after cancel:", err);
          }
          return;
        }

        appRef.current = app;

        const host = hostRef.current;
        if (!host) {
          console.warn("[PixiStage] host div missing");
          return;
        }

        host.innerHTML = "";
        host.appendChild(app.canvas);

        const root = new Container();
        root.sortableChildren = true;
        const ui = new Container();
        ui.zIndex = 1000;

        app.stage.addChild(root);
        root.addChild(ui);

        const resizer = new ResizeManager(app, root, design.width, design.height);
        resizerRef.current = resizer;

        try {
          await setup({ app, root, ui });
        } catch (err) {
          console.error("[PixiStage] setup() error:", err);
        }
      } catch (err) {
        console.error("[PixiStage] boot error:", err);
        try {
          app?.destroy(true);
        } catch (e) {
          console.warn("[PixiStage] cleanup after boot error:", e);
        }
      }
    };

    boot();

    return () => {
      cancelled = true;

      if (cleanedRef.current) return;
      cleanedRef.current = true;

      try {
        resizerRef.current?.destroy();
      } catch (err) {
        console.warn("[PixiStage] resizer destroy error:", err);
      } finally {
        resizerRef.current = null;
      }

      try {
        appRef.current?.destroy(true, { children: true });
      } catch (err) {
        console.warn("[PixiStage] app destroy error:", err);
      } finally {
        appRef.current = null;
      }
    };
  }, [setup]);

  return <div ref={hostRef} className="container-full" />;
}
