import type { PluginOptions } from "./index";

const DEFAULT_OPTIONS: Required<PluginOptions> = {
  id: "default",
  routeBasePath: "/search",
  docsJsonPath: "docs.json",
  enableDebugMode: true,
};

export function validateOptions({
  options,
}: {
  options: PluginOptions;
}): Required<PluginOptions> {
  return {
    ...DEFAULT_OPTIONS,
    ...options,
  };
}
