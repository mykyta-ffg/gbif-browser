export interface WikipediaSearchResponse {
  query: {
    search: Array<{
      title: string;
      pageId: number;
    }>;
  };
}
