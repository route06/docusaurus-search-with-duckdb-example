import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import clsx from "clsx";
import React from "react";

import styles from "./index.module.css";

import { HomePageFeatures } from "@site/src/components/HomepageFeatures/index";

const HomePageHeader = () => {
  const {
    siteConfig: { title, tagline },
  } = useDocusaurusContext();
  return (
    <header className={clsx("hero hero--primary", styles.heroBanner)}>
      <div className="container">
        <h1 className="hero__title">{title}</h1>
        <p className="hero__subtitle">{tagline}</p>
      </div>
    </header>
  );
};

const Home = () => {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`Hello from ${siteConfig.title}`}
      description="Description will go into a meta tag in <head />"
    >
      <HomePageHeader />
      <main>
        <HomePageFeatures />
      </main>
    </Layout>
  );
};

export default Home;
