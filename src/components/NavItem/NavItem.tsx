import { Link, useLocation } from "react-router-dom";
import styles from "./navItem.module.css";

interface ItemProps {
  to: string;
  children: React.ReactNode;
  name: string;
}

export const Item = ({ to, children, name }: ItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === `/${name}`;
  const activeClass = isActive ? styles.active : "";

  return (
    <Link className={`${styles.links} ${activeClass}`} to={to}>
      {children}
    </Link>
  );
};
