export interface SearchResult {
  path: string;
  title: string;
  content: string;
  score: number;
  snippet?: string;
}

export interface SearchPageContext {
  docsJsonPath: string;
  enableDebugMode: boolean;
}
