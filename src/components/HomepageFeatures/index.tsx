import Link from "@docusaurus/Link";
import React from "react";

import styles from "./styles.module.css";

export const HomePageFeatures = () => (
  <section className={styles.features}>
    <div className="container">
        <Link to="/search/">検索する</Link>
    </div>
  </section>
);
