import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import {FeatureGroup, MapContainer, TileLayer} from "react-leaflet";
import {LatLng, LatLngTuple} from "leaflet";
import {EditControl} from "react-leaflet-draw";
import 'leaflet-draw';

const initialCoordinates: LatLngTuple = [50.07704, 14.47082];
export default function Map() {
  const onCreated = (e: any) => {
    console.debug("onCreated event: ", e);

    const layer = e.layer;
    let coordinates: LatLng[][] = layer.getLatLngs();
    console.debug("Polygon coordinates: ", coordinates);

    coordinates[0] = [...coordinates[0], coordinates[0][0]];
    console.debug("Coordinates after modification: ", coordinates);
    let url = "https://api.gbif.org/v1/occurrence/search?" + new URLSearchParams({
      advanced: "false",
      geometry: `POLYGON((${coordinates[0].map(p => `${p.lat} ${p.lng}`).join(",")}))`,
      locale: "en",
      occurrenceStatus: "present"
    });
    console.debug("URL: ", url);

    fetch(url).then(p => p.json().then(j => console.info("GBIF response: ", j)));
  };

  return (
      <MapContainer center={initialCoordinates} zoom={13} style={{height: '100vh'}}>
        <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
        />
        <FeatureGroup>
          <EditControl draw={{polyline: false, marker: false, circle: false, circlemarker: false}}
                       position="topright" onCreated={onCreated}/>
        </FeatureGroup>
      </MapContainer>
  );
}
