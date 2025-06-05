const path = require("path");

function pluginDuckDBSearch(context, options = {}) {
  const {
    routeBasePath = "/search",
    docsJsonPath = "docs.json",
    enableDebugMode = true,
  } = options;

  return {
    name: "docusaurus-search-duckdb",

    getThemePath() {
      return path.resolve(__dirname, "./src/theme");
    },

    async contentLoaded({ actions }) {
      const { addRoute } = actions;

      addRoute({
        path: routeBasePath,
        component: path.resolve(__dirname, "./src/theme/SearchPage/index.tsx"),
        exact: true,
      });
    },

    configureWebpack() {
      return {
        resolve: {
          alias: {
            "@site/plugins/docusaurus-search-duckdb": path.resolve(__dirname),
          },
        },
      };
    },
  };
}

module.exports = pluginDuckDBSearch;
