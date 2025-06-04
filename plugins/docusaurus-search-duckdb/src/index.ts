import type { LoadContext, Plugin } from "@docusaurus/types";
import path from "path";

export interface PluginOptions {
  id?: string;
  routeBasePath?: string;
  docsJsonPath?: string;
  enableDebugMode?: boolean;
}

export default function pluginDuckDBSearch(
  context: LoadContext,
  options: PluginOptions,
): Plugin<void> {
  const {
    routeBasePath = "search",
    docsJsonPath = "docs.json",
    enableDebugMode = true,
  } = options;

  return {
    name: "docusaurus-search-duckdb",

    getThemePath() {
      return path.resolve(__dirname, "./theme");
    },

    getTypeScriptThemePath() {
      return path.resolve(__dirname, "..", "src", "theme");
    },

    async contentLoaded({ actions }) {
      const { addRoute } = actions;

      addRoute({
        path: `/${routeBasePath}`,
        component: "@theme/SearchPage",
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

export { validateOptions } from "./validateOptions";
