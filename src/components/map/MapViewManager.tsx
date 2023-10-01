import { useMap } from "react-leaflet";
import { LatLngTuple } from "leaflet";

export default function MapViewManager({ center }: MapManagerState) {
  const map = useMap();
  map.setView(center);

  return null;
}

interface MapManagerState {
  center: LatLngTuple;
}
