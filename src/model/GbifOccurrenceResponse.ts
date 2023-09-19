import { GbifOccurrenceResponseResult } from "./GbifOccurrenceResponseResult";

export interface GbifOccurrenceResponse {
  offset: number;
  limit: number;
  endOfRecords: boolean;
  count: number;
  results: GbifOccurrenceResponseResult[];
}
