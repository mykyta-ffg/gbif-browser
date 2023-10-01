import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import { FeatureGroup, MapContainer, Polygon, TileLayer } from "react-leaflet";
import { LatLng, LatLngExpression, LatLngTuple, Polygon as LeafletPolygon, Rectangle } from "leaflet";
import { EditControl } from "react-leaflet-draw";
import { MapViewManager } from "./index";

export default function OpenStreetMap({
  center,
  isCentered,
  zoomLevel,
  polygonCoordinates,
  onPolygonCreation,
}: MapProps) {
  return (
    <MapContainer center={center} zoom={zoomLevel} style={{ height: "50vh" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
      />
      {isCentered && <MapViewManager center={center} />}
      <FeatureGroup>
        <EditControl
          draw={{ polyline: false, marker: false, circle: false, circlemarker: false }}
          position="topright"
          onCreated={event => {
            console.debug("onCreated event: ", event);

            const layer = event.layer as LeafletPolygon | Rectangle;
            const coordinates = layer.getLatLngs() as LatLng[][];
            console.debug("Polygon coordinates: ", coordinates);

            onPolygonCreation(coordinates[0]);
          }}
        />
        {polygonCoordinates && <Polygon positions={polygonCoordinates} />}
      </FeatureGroup>
    </MapContainer>
  );
}

export interface MapProps {
  zoomLevel: number;
  center: LatLngTuple;
  isCentered: boolean;
  polygonCoordinates?: LatLngExpression[];
  onPolygonCreation: (polygonGeometry: LatLng[]) => void;
}
