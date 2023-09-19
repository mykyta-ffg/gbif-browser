import { GbifOccurrenceResponseResult } from "./GbifOccurrenceResponseResult";

export interface OccurrenceRecord extends GbifOccurrenceResponseResult {
  numberOfOccurrences: number;
}
