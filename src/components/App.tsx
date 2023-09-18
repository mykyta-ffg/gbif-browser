import React, { useState } from "react";
import { Map } from "./map";
import { Filter } from "./controls";
import { FilterState } from "./controls/Filter";
import { Button, Card, Col, Container, Row } from "react-bootstrap";
import { LatLng } from "leaflet";
import { GbifOccurrenceFilter } from "../model/GbifOccurrenceFilter";
import { GbifOccurrenceResponse } from "../model/GbifOccurrenceResponse";
import { OccurrenceTable } from "./table";

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [latestPolygonCoordinates, setLatestPolygonCoordinates] = useState<LatLng[] | undefined>(undefined);
  const [occurrences, setOccurrences] = useState<GbifOccurrenceResponse[]>([]);

  const defaultFilterState: FilterState = {
    isEndangeredOnly: false,
    includePlants: true,
    includeFungi: true,
  };
  const [filterState, setFilterState] = useState(defaultFilterState);

  return (
    <>
      <Map
        initialCoordinates={[50.07704, 14.47082]}
        zoomLevel={7}
        onPolygonCreation={polygonGeometry => {
          polygonGeometry = [...polygonGeometry, polygonGeometry[0]];
          console.debug("Coordinates after modification: ", polygonGeometry);

          setLatestPolygonCoordinates(polygonGeometry);
        }}
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
                  onEndangeredOnlyChange={event =>
                    setFilterState({
                      ...filterState,
                      isEndangeredOnly: event.target.checked,
                    })
                  }
                  onIncludePlantsChange={event =>
                    setFilterState({
                      ...filterState,
                      includePlants: event.target.checked,
                    })
                  }
                  onIncludeFungiChange={event =>
                    setFilterState({
                      ...filterState,
                      includeFungi: event.target.checked,
                    })
                  }
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <Row className="m-4">
          <Col className="text-center">
            <Button
              disabled={!latestPolygonCoordinates}
              onClick={() => {
                const url =
                  "https://api.gbif.org/v1/occurrence/search?" +
                  new GbifOccurrenceFilter(latestPolygonCoordinates).toUrlSearchParams();
                console.debug("URL: ", url);

                setIsLoading(true);

                fetch(url).then(p =>
                  p.json().then(j => {
                    console.info("GBIF response: ", j);

                    setOccurrences(j.results as GbifOccurrenceResponse[]);
                    setIsLoading(false);
                  }),
                );
              }}
            >
              Fetch data
            </Button>
          </Col>
        </Row>
        <Row>
          <OccurrenceTable isLoading={isLoading} values={occurrences} />
        </Row>
      </Container>
    </>
  );
}

export default App;
