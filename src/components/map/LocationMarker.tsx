import { Marker, Popup, useMapEvents } from "react-leaflet";
import { LatLng, LatLngLiteral } from "leaflet";

export default function LocationMarker({ markerPosition, onMarkerPositionChange }: LocationMarkerProps) {
  useMapEvents({
    click(e) {
      onMarkerPositionChange(e.latlng);
    },
  });

  return markerPosition === undefined ? null : (
    <Marker position={markerPosition}>
      <Popup>Hey, Paul!</Popup>
    </Marker>
  );
}

export interface LocationMarkerProps {
  markerPosition?: LatLngLiteral;
  onMarkerPositionChange: (latLong: LatLng) => void;
}
