import { Link } from "react-router-dom";
import styles from "./navItem.module.css";

interface ItemProps {
  to: string;
  children: React.ReactNode;
}

export const Item = ({ to, children }: ItemProps) => {
  return (
    <Link className={styles.links} to={to}>
      {children}
    </Link>
  );
};
