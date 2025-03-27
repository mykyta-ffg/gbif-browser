import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import L from "leaflet";
import { FeatureGroup, MapContainer, Polygon, TileLayer } from "react-leaflet";
import { LatLng, LatLngExpression, LatLngLiteral, Polygon as LeafletPolygon, Rectangle } from "leaflet";
import { EditControl } from "react-leaflet-draw";
import { MapViewManager } from "./index";
import LocationMarker, { LocationMarkerProps } from "./LocationMarker";

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

export default function OpenStreetMap({
  center,
  isCentered,
  zoomLevel,
  polygonCoordinates,
  onPolygonCreation,
  onPolygonDelete,
  drawingEnabled,
  markerPosition,
  onMarkerPositionChange,
}: MapProps & LocationMarkerProps) {
  const drawOptions = {
    rectangle: drawingEnabled,
    polygon: drawingEnabled,
    polyline: false,
    marker: false,
    circle: false,
    circlemarker: false,
  };
  console.debug("Draw options:", drawOptions);

  return (
    <MapContainer center={center} zoom={zoomLevel} style={{ height: "50vh" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
      />
      {isCentered && <MapViewManager center={center} />}
      <FeatureGroup key={`feature-group-with-drawing-${drawingEnabled}`}>
        <EditControl
          draw={drawOptions}
          position="topright"
          onCreated={event => {
            console.debug("onCreated event: ", event);

            const layer = event.layer as LeafletPolygon | Rectangle;
            const coordinates = layer.getLatLngs() as LatLng[][];
            console.debug("Polygon coordinates: ", coordinates);

            onPolygonCreation(coordinates[0]);
          }}
          onDeleted={event => {
            console.debug("onDeleted event", event);

            onPolygonDelete();
          }}
        />
        {polygonCoordinates && <Polygon positions={polygonCoordinates} />}
        <LocationMarker markerPosition={markerPosition} onMarkerPositionChange={onMarkerPositionChange} />
      </FeatureGroup>
    </MapContainer>
  );
}

export interface MapProps {
  zoomLevel: number;
  center: LatLngLiteral;
  isCentered: boolean;
  polygonCoordinates?: LatLngExpression[];
  onPolygonCreation: (polygonGeometry: LatLng[]) => void;
  onPolygonDelete: () => void;
  drawingEnabled: boolean;
}
