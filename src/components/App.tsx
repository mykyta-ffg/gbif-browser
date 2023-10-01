import React, { ChangeEventHandler, useState } from "react";
import { OpenStreetMap } from "./map";
import { FilterControls, MapControls } from "./controls";
import { FilterControlsState } from "./controls/FilterControls";
import { Button, Card, Col, Container, Row } from "react-bootstrap";
import { LatLng, LatLngTuple } from "leaflet";
import { GbifOccurrenceFilter } from "../model/GbifOccurrenceFilter";
import { GbifOccurrenceResponseResult } from "../model/GbifOccurrenceResponseResult";
import { OccurrenceTable } from "./table";
import { GbifOccurrenceResponse } from "../model/GbifOccurrenceResponse";
import { OccurrenceRecord } from "../model/OccurrenceRecord";
import { wait } from "../util";
import { LoadingState } from "./table/OccurrenceTable";

const MAP_INITIAL_COORDINATES: LatLngTuple = [50.077, 14.471];
const MAP_INITIAL_ZOOM_LEVEL = 7;
const GBIF_API_OCCURRENCE_RESULT_LIMIT = 10_000; // 100_000 in docs, but rate limited after 10_000
const INITIAL_LOADING_STATE = { fetched: 0, total: 0 };

function getBoundingBox(pLatitude: number, pLongitude: number, pDistanceInMeters: number): LatLng[] {
  const latRadian = (pLatitude * Math.PI) / 180;

  const degLatKm = 110.574235;
  const degLongKm = 110.572833 * Math.cos(latRadian);
  const deltaLat = pDistanceInMeters / 1000.0 / degLatKm;
  const deltaLong = pDistanceInMeters / 1000.0 / degLongKm;

  const topLat = pLatitude + deltaLat;
  const bottomLat = pLatitude - deltaLat;
  const leftLng = pLongitude - deltaLong;
  const rightLng = pLongitude + deltaLong;

  return [
    new LatLng(topLat, leftLng),
    new LatLng(topLat, rightLng),
    new LatLng(bottomLat, rightLng),
    new LatLng(bottomLat, leftLng),
  ];
}

async function fetchGbifOccurrences(filter: GbifOccurrenceFilter) {
  const url = "https://api.gbif.org/v1/occurrence/search?" + filter.toUrlSearchParams();
  console.debug("GBIF request URL: ", url);

  const response = await fetch(url);
  const responseJson = (await response.json()) as GbifOccurrenceResponse;
  console.debug("GBIF response: ", responseJson);

  return responseJson;
}

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [isCentered, setIsCentered] = useState(false);
  const [mapCenter, setMapCenter] = useState(MAP_INITIAL_COORDINATES);
  const [mapLatitude, setMapLatitude] = useState(MAP_INITIAL_COORDINATES[0]);
  const [mapLongitude, setMapLongitude] = useState(MAP_INITIAL_COORDINATES[1]);
  const [mapRadius, setMapRadius] = useState(10);
  const [manualPolygonCoordinates, setManualPolygonCoordinates] = useState<LatLng[] | undefined>(undefined);
  const [latestPolygonCoordinates, setLatestPolygonCoordinates] = useState<LatLng[] | null>(null);
  const [occurrences, setOccurrences] = useState<OccurrenceRecord[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>(INITIAL_LOADING_STATE);

  const defaultFilterState: FilterControlsState = {
    isEndangeredOnly: false,
    includePlants: true,
    includeFungi: false,
  };
  const [filterState, setFilterState] = useState(defaultFilterState);

  const onPolygonCreation = (polygonGeometry: LatLng[]) => {
    polygonGeometry = [...polygonGeometry, polygonGeometry[0]];
    console.debug("Coordinates after modification: ", polygonGeometry);

    setLatestPolygonCoordinates(polygonGeometry);
  };
  const onEndangeredOnlyChange: ChangeEventHandler<HTMLInputElement> = event =>
    setFilterState({
      ...filterState,
      isEndangeredOnly: event.target.checked,
    });
  const onIncludePlantsChange: ChangeEventHandler<HTMLInputElement> = event =>
    setFilterState({
      ...filterState,
      includePlants: event.target.checked,
    });
  const onIncludeFungiChange: ChangeEventHandler<HTMLInputElement> = event =>
    setFilterState({
      ...filterState,
      includeFungi: event.target.checked,
    });

  const onFetchRequest = async () => {
    setLoadingState(INITIAL_LOADING_STATE);

    const offset = 0;
    const filter = new GbifOccurrenceFilter(latestPolygonCoordinates, filterState, offset);
    setIsLoading(true);

    let page;
    let totalFetched = 0;
    const recordsByTaxonKey = new Map<number, GbifOccurrenceResponseResult[]>();
    do {
      page = await fetchGbifOccurrences(filter);
      setLoadingState({ fetched: totalFetched, total: page.count });

      for (const result of page.results) {
        if (result.species) {
          const taxonKey = result.acceptedTaxonKey;
          const records = recordsByTaxonKey.get(taxonKey);
          if (records === undefined) {
            recordsByTaxonKey.set(taxonKey, [result]);
          } else {
            records.push(result);
          }
        }

        ++totalFetched;
      }

      const remaining = page.count - totalFetched;
      filter.offset +=
        remaining < GbifOccurrenceFilter.MAXIMUM_RESULT_LIMIT ? remaining : GbifOccurrenceFilter.MAXIMUM_RESULT_LIMIT;
    } while (
      !page.endOfRecords &&
      page.count > totalFetched &&
      page.offset + page.limit < GBIF_API_OCCURRENCE_RESULT_LIMIT
    );
    console.debug("GBIF records by taxon key: ", recordsByTaxonKey);

    const occurrenceRecords = [];
    for (const records of recordsByTaxonKey.values()) {
      const firstRecord = records[0];
      const occurrenceRecord: OccurrenceRecord = {
        numberOfOccurrences: records.length,
        ...firstRecord,
      };

      occurrenceRecords.push(occurrenceRecord);
    }
    occurrenceRecords.sort((a, b) => b.numberOfOccurrences - a.numberOfOccurrences);
    console.debug("Occurrence records: ", occurrenceRecords);

    setOccurrences(occurrenceRecords);
    setIsLoading(false);
  };

  return (
    <>
      <OpenStreetMap
        center={mapCenter}
        isCentered={isCentered}
        zoomLevel={MAP_INITIAL_ZOOM_LEVEL}
        onPolygonCreation={onPolygonCreation}
        polygonCoordinates={manualPolygonCoordinates}
      />
      <Container fluid>
        <Row className="my-4 mx-1">
          <Col>
            <Card>
              <Card.Header style={{ background: "none" }}>Filters</Card.Header>
              <Card.Body>
                <FilterControls
                  isEndangeredOnly={filterState.isEndangeredOnly}
                  includePlants={filterState.includePlants}
                  includeFungi={filterState.includeFungi}
                  onEndangeredOnlyChange={onEndangeredOnlyChange}
                  onIncludePlantsChange={onIncludePlantsChange}
                  onIncludeFungiChange={onIncludeFungiChange}
                />
              </Card.Body>
            </Card>
          </Col>
          <Col>
            <Card>
              <Card.Header style={{ background: "none" }}>Map Controls</Card.Header>
              <Card.Body>
                <MapControls
                  defaultLatitude={MAP_INITIAL_COORDINATES[0]}
                  defaultLongitude={MAP_INITIAL_COORDINATES[1]}
                  onLatitudeChange={e => setMapLatitude(Number.parseFloat(e.target.value))}
                  onLongitudeChange={e => setMapLongitude(Number.parseFloat(e.target.value))}
                  onRadiusChange={e => setMapRadius(Number.parseFloat(e.target.value))}
                  onCenter={() => {
                    setMapCenter([mapLatitude, mapLongitude]);
                    setIsCentered(true);

                    // FIXME: Find a better way to toggle
                    wait(1_000).then(() => setIsCentered(false));
                  }}
                  onDrawRectangle={() => {
                    const boundingBox = getBoundingBox(mapLatitude, mapLongitude, mapRadius * 1000);

                    setManualPolygonCoordinates(boundingBox);
                    onPolygonCreation(boundingBox);
                  }}
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <Row className="m-4">
          <Col className="text-center">
            <Button disabled={!latestPolygonCoordinates} onClick={onFetchRequest}>
              Search
            </Button>
          </Col>
        </Row>
        <Row>
          <OccurrenceTable isLoading={isLoading} loadingState={loadingState} records={occurrences} />
        </Row>
        {!isLoading && occurrences.length > 0 && (
          <div className="fixed-bottom bg-white d-flex align-items-center justify-content-between">
            <div>
              <strong># of plants: {occurrences.length}</strong>
              <br />
              <strong># of occurrences: {loadingState.total}</strong>
            </div>
            <Button
              className="m-2"
              variant="secondary"
              disabled={!occurrences.length}
              onClick={() => {
                const header = "# of occurrences,Scientific name,Generic name,Phylum,Class,Order,Family,Genus,Species";
                const csv =
                  header +
                  "\r\n" +
                  occurrences.reduce(
                    (acc, o) =>
                      (acc += `${o.numberOfOccurrences},${o.scientificName},${o.genericName},${o.phylum},${o.class},${o.order},${o.family},${o.genus},${o.species}\r\n`),
                    "",
                  );

                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                const link = document.createElement("a");
                link.href = window.URL.createObjectURL(blob);
                link.setAttribute(
                  "download",
                  `gbif_search_results_at_${mapLatitude}_${mapLongitude}_on_${new Date()
                    .toISOString()
                    .substring(0)}`.replace(/\./g, "_") + ".csv",
                );
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            >
              Export as CSV
            </Button>
          </div>
        )}
      </Container>
    </>
  );
}

export default App;
