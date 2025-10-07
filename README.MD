# Pixi React Showcase

A compact collection of Pixi.js micro‑demos built with **React + TypeScript + Vite**.  
Each page mounts its own Pixi `Application` and shares a small UI kit (button, preloader), resize manager, and tween helper.

## 🧭 Routes / Demos

- `/carousel` — Vertical content carousel (masked viewport, seamless scroll, snap).
- `/dial` — Segment dial picker (eased rotation, selection highlight).
- `/scratch` — Scratch & reveal (render texture erase, progress).
- `/fx` — Celebration FX pack (confetti, star burst, glow pulse, screen shake).

## 🚀 Quick Start

```bash
git clone https://github.com/your-username/pixi-react-showcase.git
cd pixi-react-showcase
npm install
npm run dev
```

Then open:

- http://localhost:5173/carousel (or use the top nav)

> Put 3–5 small PNGs into `/public/assets/` (e.g., p1.png..p5.png) for the preloader demo.

## 🛠 Tech Stack

- **Pixi.js v8** (WebGL renderer)
- **React + React Router + Vite**
- **TypeScript**

## 📁 Minimal Structure

```
src/
  app/ (App, router)
  components/PixiStage.tsx
  pages/ (CarouselPage, DialPickerPage, ScratchPage, FxPackPage)
  pixi/
    styles.ts
    core/ (ResizeManager, loadDemo)
    ui/ (Preloader, Button)
    utils/ (tween)
public/assets/ (p1.png ... p5.png)
```

## 📜 Notes

- Reusable Pixi utilities and consistent UI across pages.
- Designed to keep 60 FPS on desktop and mobile.
- Ideal as a neutral, professional showcase for interactive game/UI work.
