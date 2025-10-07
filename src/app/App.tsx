import { Outlet } from "react-router-dom";
import { Item } from "../components/NavItem/NavItem";
import styles from "./App.module.css";
import "./reset.css";

export default function App() {
  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <Item to="/carousel">Carousel</Item>
        <Item to="/dial">Dial</Item>
        <Item to="/scratch">Scratch</Item>
        <Item to="/fx">FX Pack</Item>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
