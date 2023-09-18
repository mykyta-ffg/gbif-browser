import { LatLng } from "leaflet";

export class GbifOccurrenceFilter {
  constructor(geometry?: LatLng[]) {
    this.geometry = geometry;
  }

  geometry?: LatLng[];

  includePlants = true;

  includeFungi = true;

  toUrlSearchParams() {
    return new URLSearchParams([
      ["geometry", this.geometry ? `POLYGON((${this.geometry.map(p => `${p.lat} ${p.lng}`).join(",")}))` : ""],
      ["locale", "en"],
      ["occurrenceStatus", "present"],
      ["hasCoordinate", "true"],
      ["hasGeospatialIssue", "false"],
      // TODO: Define proper mapping
      ["taxonKey", this.includePlants ? "5" : ""],
      ["taxonKey", this.includeFungi ? "6" : ""],
    ]);
  }
}
