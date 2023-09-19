import React, { ChangeEventHandler, useState } from "react";
import { OpenStreetMap } from "./map";
import { Filter } from "./controls";
import { FilterState } from "./controls/Filter";
import { Button, Card, Col, Container, Row } from "react-bootstrap";
import { LatLng, LatLngTuple } from "leaflet";
import { GbifOccurrenceFilter } from "../model/GbifOccurrenceFilter";
import { GbifOccurrenceResponseResult } from "../model/GbifOccurrenceResponseResult";
import { OccurrenceTable } from "./table";
import { GbifOccurrenceResponse } from "../model/GbifOccurrenceResponse";
import { OccurrenceRecord } from "../model/OccurrenceRecord";

const MAP_INITIAL_COORDINATES: LatLngTuple = [50.07704, 14.47082];
const MAP_INITIAL_ZOOM_LEVEL = 7;
const GBIF_API_OCCURRENCE_RESULT_LIMIT = 100_000;

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [latestPolygonCoordinates, setLatestPolygonCoordinates] = useState<LatLng[] | null>(null);
  const [occurrences, setOccurrences] = useState<OccurrenceRecord[]>([]);

  const defaultFilterState: FilterState = {
    isEndangeredOnly: false,
    includePlants: true,
    includeFungi: true,
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

  const fetchGbifOccurrences = async (filter: GbifOccurrenceFilter) => {
    const url = "https://api.gbif.org/v1/occurrence/search?" + filter.toUrlSearchParams();
    console.debug("GBIF request URL: ", url);

    const response = await fetch(url);
    const responseJson = (await response.json()) as GbifOccurrenceResponse;
    console.debug("GBIF response: ", responseJson);

    return responseJson;
  };
  const onFetchRequest = async () => {
    const offset = 0;
    const filter = new GbifOccurrenceFilter(latestPolygonCoordinates, filterState, offset);
    setIsLoading(true);

    let page;
    let totalFetched = 0;
    const recordsByTaxonKey = new Map<number, GbifOccurrenceResponseResult[]>();
    do {
      page = await fetchGbifOccurrences(filter);
      for (const result of page.results) {
        const taxonKey = result.acceptedTaxonKey;
        const records = recordsByTaxonKey.get(taxonKey);
        if (records === undefined) {
          recordsByTaxonKey.set(taxonKey, [result]);
        } else {
          records.push(result);
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
      const occurrenceRecord: OccurrenceRecord = {
        numberOfOccurrences: records.length,
        ...records[0],
      };

      occurrenceRecords.push(occurrenceRecord);
    }
    occurrenceRecords.sort((a, b) => b.numberOfOccurrences - a.numberOfOccurrences);

    setOccurrences(occurrenceRecords);
    setIsLoading(false);
  };

  return (
    <>
      <OpenStreetMap
        initialCoordinates={MAP_INITIAL_COORDINATES}
        zoomLevel={MAP_INITIAL_ZOOM_LEVEL}
        onPolygonCreation={onPolygonCreation}
      />
      <Container fluid>
        <Row className="my-4 mx-1">
          <Col>
            <Card>
              <Card.Header style={{ background: "none" }}>Filters</Card.Header>
              <Card.Body>
                <Filter
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
        </Row>
        <Row className="m-4">
          <Col className="text-center">
            <Button disabled={!latestPolygonCoordinates} onClick={onFetchRequest}>
              Fetch data
            </Button>
          </Col>
        </Row>
        <Row>
          <OccurrenceTable isLoading={isLoading} records={occurrences} />
        </Row>
      </Container>
    </>
  );
}

export default App;
