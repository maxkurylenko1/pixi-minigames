import { Outlet } from "react-router-dom";
import { Item } from "../components/NavItem/NavItem";
import styles from "./App.module.css";
import "./reset.css";

/**
 * App (root)
 *
 * Renders top navigation and an Outlet for nested routes.
 * Routes used by the app:
 *  - /carousel
 *  - /dial
 *  - /scratch
 *  - /fx
 */
export default function App() {
  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <Item to="/carousel" name="carousel">
          Carousel
        </Item>
        <Item to="/dial" name="dial">
          Dial
        </Item>
        <Item to="/scratch" name="scratch">
          Scratch
        </Item>
        <Item to="/fx" name="fx">
          FX Pack
        </Item>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
