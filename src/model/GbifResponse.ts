export interface GbifResponse<T> {
  offset: number;
  limit: number;
  endOfRecords: boolean;
  count: number;
  results: T[];
}
