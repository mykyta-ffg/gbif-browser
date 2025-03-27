import React, { useState } from "react";
import { OpenStreetMap } from "./map";
import { MapControls } from "./controls";
import { FilterControlsState } from "./controls/FilterControls";
import { Button, Card, Col, Container, Form, InputGroup, Row } from "react-bootstrap";
import { LatLng, LatLngLiteral } from "leaflet";
import { GbifOccurrenceFilter } from "../model/GbifOccurrenceFilter";
import { GbifOccurrenceResponseResult } from "../model/GbifOccurrenceResponseResult";
import { Export, OccurrenceTable, Sources } from "./table";
import { GbifOccurrenceResponse } from "../model/GbifOccurrenceResponse";
import { OccurrenceRecord } from "../model/OccurrenceRecord";
import { parseFromString, round, wait } from "../util";
import { LoadingState } from "./table/OccurrenceTable";
import Popup from "./table/Popup";

const MAP_INITIAL_COORDINATES: LatLngLiteral = {
  lat: 50.077,
  lng: 14.471,
};
const MAP_INITIAL_ZOOM_LEVEL = 7;
const GBIF_API_OCCURRENCE_RESULT_LIMIT = 10_000; // 100_000 in docs, but rate limited after 10_000
const INITIAL_LOADING_STATE = { fetched: 0, total: 0 };
const COMPOSITE_COORDINATES_PATTERN = /\s+|\n|,\s*|;\s*/;

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
  const [showFullInfo, setShowFullInfo] = useState(true);
  const [filterString, setFilterString] = useState<string | undefined>(undefined);
  const [mapCenter, setMapCenter] = useState(MAP_INITIAL_COORDINATES);
  const [mapRadius, setMapRadius] = useState(10);
  const [polygonCoordinates, setPolygonCoordinates] = useState<LatLng[] | undefined>(undefined);
  const [occurrences, setOccurrences] = useState<OccurrenceRecord[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>(INITIAL_LOADING_STATE);
  const formattingSetMapCenter = (latLong: { lat: string | number; lng: string | number }) => {
    const lat = typeof latLong.lat === "string" ? parseFromString(latLong.lat, 3) : latLong.lat;
    const long = typeof latLong.lng === "string" ? parseFromString(latLong.lng, 3) : latLong.lng;

    setMapCenter({
      lat: isNaN(lat) ? 0 : round(lat, 3),
      lng: isNaN(long) ? 0 : round(long, 3),
    });
  };

  const defaultFilterState: FilterControlsState = {
    isEndangeredOnly: false,
    includePlants: true,
    includeFungi: false,
  };

  const onPolygonCreation = (polygonGeometry: LatLng[]) => {
    const firstPoint = polygonGeometry[0];
    polygonGeometry = [...polygonGeometry, firstPoint];
    console.debug("Coordinates after modification: ", polygonGeometry);

    setPolygonCoordinates(polygonGeometry);

    // TODO: Get center point
    formattingSetMapCenter(firstPoint);
  };

  const onPolygonDelete = () => {
    setPolygonCoordinates(undefined);
    formattingSetMapCenter(MAP_INITIAL_COORDINATES);
  };

  const onFetchRequest = async () => {
    setLoadingState(INITIAL_LOADING_STATE);

    const offset = 0;
    const filter = new GbifOccurrenceFilter(defaultFilterState, offset, polygonCoordinates);
    setOccurrences([]);
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

  const drawingEnabled = !polygonCoordinates;

  const focusCenter = () => {
    setIsCentered(true);

    // FIXME: Find a better way to toggle
    wait(1_000).then(() => setIsCentered(false));
  };
  return (
    <>
      <OpenStreetMap
        center={mapCenter}
        isCentered={isCentered}
        zoomLevel={MAP_INITIAL_ZOOM_LEVEL}
        onPolygonCreation={onPolygonCreation}
        onPolygonDelete={onPolygonDelete}
        polygonCoordinates={polygonCoordinates}
        drawingEnabled={drawingEnabled}
        markerPosition={mapCenter === MAP_INITIAL_COORDINATES || polygonCoordinates ? undefined : mapCenter}
        onMarkerPositionChange={latLong => formattingSetMapCenter(latLong)}
      />
      <Container fluid>
        <Row className="justify-content-md-center my-4 mx-1">
          <Col sm={4}>
            <Card>
              <Card.Header style={{ background: "none" }}>Map Controls</Card.Header>
              <Card.Body>
                <MapControls
                  latitude={mapCenter?.lat ?? MAP_INITIAL_COORDINATES.lat}
                  longitude={mapCenter?.lng ?? MAP_INITIAL_COORDINATES.lng}
                  onLatitudeChange={e => {
                    const value = e.target.value;
                    if (COMPOSITE_COORDINATES_PATTERN.test(value)) {
                      const latLong = value.split(COMPOSITE_COORDINATES_PATTERN);

                      formattingSetMapCenter({
                        lat: latLong[0],
                        lng: latLong[1],
                      });

                      focusCenter();
                    } else {
                      formattingSetMapCenter({
                        ...mapCenter,
                        lat: value,
                      });
                    }
                  }}
                  onLongitudeChange={e => {
                    const value = e.target.value;
                    if (COMPOSITE_COORDINATES_PATTERN.test(value)) {
                      const longLat = value.split(COMPOSITE_COORDINATES_PATTERN);

                      formattingSetMapCenter({
                        lat: longLat[1],
                        lng: longLat[0],
                      });

                      focusCenter();
                    } else {
                      formattingSetMapCenter({
                        ...mapCenter,
                        lng: e.target.value,
                      });
                    }
                  }}
                  onRadiusChange={e => {
                    setPolygonCoordinates(undefined);
                    setMapRadius(Number.parseFloat(e.target.value));
                  }}
                  onCenter={focusCenter}
                  onDrawRectangle={() => {
                    const boundingBox = getBoundingBox(mapCenter.lat, mapCenter.lng, mapRadius * 1000);

                    setPolygonCoordinates(boundingBox);
                    onPolygonCreation(boundingBox);
                  }}
                  drawingEnabled={drawingEnabled}
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <Row>
          <OccurrenceTable
            isLoading={isLoading}
            showFullInfo={showFullInfo}
            filterQuery={filterString}
            loadingState={loadingState}
            records={occurrences}
          />
        </Row>
        <Row className="fixed-bottom d-flex justify-content-between" style={{ backdropFilter: "blur(8px)" }}>
          <Col sm={2}>
            <div className="mx-2">
              <strong># of plants: {occurrences.length}</strong>
              <br />
              <strong># of occurrences: {loadingState.total}</strong>
            </div>
          </Col>
          <Col sm={3}>
            <InputGroup className="my-2">
              <Form.Control
                placeholder="Start typing to filter results"
                value={filterString}
                onChange={e => setFilterString(e.target.value)}
              />
            </InputGroup>
          </Col>
          <Col sm={2} className="text-center">
            <Button
              className="m-2"
              disabled={!polygonCoordinates}
              onClick={onFetchRequest}
              autoFocus={!polygonCoordinates}
            >
              Search
            </Button>
          </Col>
          <Col sm={2} className="d-flex justify-content-start my-2">
            <Form>
              <Form.Check
                type="switch"
                id="full-info-switch"
                label="Show images"
                checked={showFullInfo}
                onChange={e => setShowFullInfo(e.target.checked)}
              />
            </Form>
          </Col>
          <Col sm={3} className="text-end">
            <Popup label="Generate sources" disabled={!occurrences.length}>
              <Sources records={occurrences} />
            </Popup>
            <Popup label="Generate CSV" disabled={!occurrences.length}>
              <Export records={occurrences} />
            </Popup>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default App;
