import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "./App";
import CarouselPage from "../pages/CarouselPage";
import DialPickerPage from "../pages/DialPickerPage";
import ScratchPage from "../pages/ScratchPage";
import FxPackPage from "../pages/FxPackPage";

/**
 * router
 *
 * Application route map used by react-router:
 * - /            -> App (root)
 *   - index      -> simple chooser
 *   - /carousel  -> Carousel demo
 *   - /dial      -> Dial demo
 *   - /scratch   -> Scratch demo
 *   - /fx        -> FX Pack demo
 */

export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <App />,
      children: [
        { index: true, element: <Navigate to="/carousel" /> },
        { path: "carousel", element: <CarouselPage /> },
        { path: "dial", element: <DialPickerPage /> },
        { path: "scratch", element: <ScratchPage /> },
        { path: "fx", element: <FxPackPage /> },
      ],
    },
  ],
  { basename: "/pixi-minigames" }
);
