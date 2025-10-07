import { createBrowserRouter } from "react-router-dom";
import App from "./App";
// import CarouselPage from "../pages/CarouselPage";
// import DialPickerPage from "../pages/DialPickerPage";
// import ScratchPage from "../pages/ScratchPage";
// import FxPackPage from "../pages/FxPackPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <div style={{ padding: 24, color: "#fff" }}>Choose demo</div>,
      },
      // { path: "carousel", element: <CarouselPage /> },
      // { path: "dial", element: <DialPickerPage /> },
      //   { path: "scratch", element: <ScratchPage /> },
      //   { path: "fx", element: <FxPackPage /> },
      { path: "carousel", element: <>Coming soon...</> },
      { path: "dial", element: <>Coming soon...</> },
      { path: "scratch", element: <>Coming soon...</> },
      { path: "fx", element: <>Coming soon...</> },
    ],
  },
]);
