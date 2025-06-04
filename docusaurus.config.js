// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require("prism-react-renderer").themes.github;
const darkCodeTheme = require("prism-react-renderer").themes.dracula;

const baseUrl = process.env.PREVIEW_PATH || "/";

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Search with DuckDB",
  url: "https://example.com",
  baseUrl,
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  favicon: "img/favicon.ico",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "route06", // Usually your GitHub org/user name.
  projectName: "docs", // Usually your repo name.
  trailingSlash: true,

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },
  markdown: {},
  /**
   * swcを使ってビルドする
   * @see {@link https://github.com/facebook/docusaurus/pull/6944}
   */
  webpack: {
    jsLoader: (isServer) => ({
      loader: require.resolve("swc-loader"),
      options: {
        jsc: {
          parser: {
            syntax: "typescript",
            tsx: true,
          },
          target: "es2022",
        },
        module: {
          type: isServer ? "commonjs" : "es6",
        },
      },
    }),
  },

  plugins: [
    [
      "./plugins/docusaurus-search-duckdb",
      {
        routeBasePath: "search",
        docsJsonPath: "docs.json",
        enableDebugMode: true,
      },
    ],
  ],

  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: "https://github.com/route06/docusaurus-search-with-duckdb-example/tree/main/",
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: "https://github.com/route06/docusaurus-search-with-duckdb-example/tree/main/",
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      }),
    ],
  ],

  themes: [],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: "Home",
        items: [
          {
            type: "doc",
            docId: "index",
            position: "left",
            label: "Sample Docs",
          },
        ],
      },
      footer: {
        style: "dark",
        copyright: `Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
