import { DbStatus } from "@/components/DbStatus";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <main className={styles.main}>
      <section className={styles.card}>
        <p className={styles.logo} aria-hidden="true">
          کیسه
        </p>
        <h1 className={styles.title}>Kiseh</h1>
        <p className={styles.subtitle}>Personal home &amp; living expense manager</p>
        <DbStatus />
      </section>
    </main>
  );
}
