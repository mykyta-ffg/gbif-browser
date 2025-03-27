import { LatLng } from "leaflet";
import { FilterControlsState } from "../components/controls/FilterControls";

export class GbifOccurrenceFilter {
  public static MAXIMUM_RESULT_LIMIT = 300;

  constructor(
    { isEndangeredOnly, includePlants, includeFungi }: FilterControlsState,
    offset: number,
    geometry?: LatLng[],
  ) {
    this.geometry = geometry ?? null;
    this.offset = offset;
    this.endangeredOnly = isEndangeredOnly;
    this.includePlants = includePlants;
    this.includeFungi = includeFungi;
  }

  geometry: LatLng[] | null;

  endangeredOnly: boolean;

  includePlants: boolean;

  includeFungi: boolean;

  offset: number;

  limit = GbifOccurrenceFilter.MAXIMUM_RESULT_LIMIT;

  toUrlSearchParams() {
    const now = new Date();

    return new URLSearchParams([
      ["limit", `${this.limit}`],
      ["offset", `${this.offset}`],
      ["geometry", this.geometry ? `POLYGON((${this.geometry.map(p => `${p.lng} ${p.lat}`).join(",")}))` : ""],
      ["locale", "en"],
      ["occurrence_status", "present"],
      ["has_coordinate", "true"],
      ["has_geospatial_issue", "false"],
      // TODO: Define proper mapping
      ["taxon_key", this.includePlants ? "6" : ""],
      ["taxon_key", this.includeFungi ? "5" : ""],
      ["license", "CC0_1_0"],
      ["license", "CC_BY_4_0"],
      ["year", `${now.getUTCFullYear() - 50},${now.getUTCFullYear()}`],
      ...(this.endangeredOnly ? ["NT", "VU", "EN", "CR"].map(c => ["iucn_red_list_category", c]) : []),
    ]);
  }
}
