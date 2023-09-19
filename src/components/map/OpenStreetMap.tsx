import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import { FeatureGroup, MapContainer, TileLayer } from "react-leaflet";
import { LatLng, LatLngTuple, Polygon, Rectangle } from "leaflet";
import { EditControl } from "react-leaflet-draw";

export default function OpenStreetMap({ initialCoordinates, zoomLevel, onPolygonCreation }: MapProps) {
  return (
    <MapContainer center={initialCoordinates} zoom={zoomLevel} style={{ height: "50vh" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
      />
      <FeatureGroup>
        <EditControl
          draw={{ polyline: false, marker: false, circle: false, circlemarker: false }}
          position="topright"
          onCreated={event => {
            console.debug("onCreated event: ", event);

            const layer = event.layer as Polygon | Rectangle;
            const coordinates = layer.getLatLngs() as LatLng[][];
            console.debug("Polygon coordinates: ", coordinates);

            onPolygonCreation(coordinates[0]);
          }}
        />
      </FeatureGroup>
    </MapContainer>
  );
}

export interface MapProps {
  zoomLevel: number;
  initialCoordinates: LatLngTuple;
  onPolygonCreation: (polygonGeometry: LatLng[]) => void;
}
