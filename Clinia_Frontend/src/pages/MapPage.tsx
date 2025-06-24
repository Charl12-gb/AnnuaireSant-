import React from 'react';
import { useSearchParams } from 'react-router-dom'; // Changed from useLocation
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L, { LatLngExpression, LatLngBoundsExpression } from 'leaflet';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

// Leaflet Icon Fix
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Define structure for individual items (used in both single and multiple)
interface StructureData {
  id_structure: number;
  latitude: number;
  longitude: number;
  nom_structure: string;
  adresse: string;
  ville?: string;
}

// Component to adjust map bounds
const FitBounds: React.FC<{ bounds: LatLngBoundsExpression | undefined }> = ({ bounds }) => {
  const map = useMap();
  React.useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, bounds]);
  return null;
};

const MapPage: React.FC = () => {
  const [searchParams] = useSearchParams();

  const defaultCenter: LatLngExpression = [9.3077, 2.3158]; // Center of Benin
  const defaultZoom = 7;

  let mapContent = null;
  let boundsToFit: LatLngBoundsExpression | undefined = undefined;
  let errorLoadingData = false;
  let errorMessage = "Aucune donnée de localisation n'a été fournie ou les données sont invalides.";

  // Attempt to parse single structure params
  const singleLatParam = searchParams.get('lat');
  const singleLngParam = searchParams.get('lng');
  const singleIdParam = searchParams.get('id');
  const singleNameParam = searchParams.get('name');
  const singleAddressParam = searchParams.get('address');
  const singleVilleParam = searchParams.get('ville');

  // Attempt to parse multiple structures param
  const structuresJsonParam = searchParams.get('structures');
  const userLatParam = searchParams.get('userLat');
  const userLngParam = searchParams.get('userLng');

  if (singleLatParam && singleLngParam) {
    try {
      const lat = parseFloat(singleLatParam);
      const lng = parseFloat(singleLngParam);
      const id = singleIdParam ? parseInt(singleIdParam, 10) : Date.now(); // Use timestamp if ID missing for key
      const name = singleNameParam || 'Structure';
      const address = singleAddressParam || 'Adresse non disponible';
      const ville = singleVilleParam || undefined;

      if (isNaN(lat) || isNaN(lng)) throw new Error("Coordonnées invalides.");

      const position: LatLngExpression = [lat, lng];
      mapContent = (
        <>
          <Marker position={position}>
            <Popup>
              <b>{name}</b><br />
              {address}
              {ville && `, ${ville}`}
            </Popup>
          </Marker>
        </>
      );
      boundsToFit = L.latLngBounds([position, position]);
    } catch (e: any) {
      console.error("Error parsing single structure params:", e);
      errorLoadingData = true;
      errorMessage = `Erreur lors de la lecture des données de la structure: ${e.message}`;
    }
  } else if (structuresJsonParam) {
    try {
      const structuresArray: StructureData[] = JSON.parse(structuresJsonParam);
      const validStructures = structuresArray.filter(
        s => s.latitude != null && s.longitude != null && typeof s.latitude === 'number' && typeof s.longitude === 'number'
      );

      if (validStructures.length === 0) {
        errorLoadingData = true;
        errorMessage = "Aucune structure avec des coordonnées valides n'a été fournie dans la liste.";
      } else {
        const points: LatLngExpression[] = validStructures.map(s => [s.latitude, s.longitude] as LatLngExpression);

        let userPosition: LatLngExpression | null = null;
        if (userLatParam && userLngParam) {
          const uLat = parseFloat(userLatParam);
          const uLng = parseFloat(userLngParam);
          if (!isNaN(uLat) && !isNaN(uLng)) {
            userPosition = [uLat, uLng];
            points.push(userPosition);
          }
        }

        if (points.length > 0) {
          boundsToFit = L.latLngBounds(points);
        }

        mapContent = (
          <>
            {validStructures.map(structure => (
              <Marker key={structure.id_structure} position={[structure.latitude, structure.longitude]}>
                <Popup>
                  <b>{structure.nom_structure}</b><br />
                  {structure.adresse}
                  {structure.ville && `, ${structure.ville}`}
                </Popup>
              </Marker>
            ))}
            {userPosition && (
              <Marker position={userPosition}>
                <Popup>Votre position</Popup>
              </Marker>
            )}
            {boundsToFit && <FitBounds bounds={boundsToFit} />}
          </>
        );
      }
    } catch (e: any) {
      console.error("Error parsing multiple structures param:", e);
      errorLoadingData = true;
      errorMessage = `Erreur lors de la lecture de la liste des structures: ${e.message}`;
    }
  } else {
    errorLoadingData = true; // No relevant params found
  }

  if (errorLoadingData) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Erreur de localisation</h1>
        <p>{errorMessage}</p>
      </div>
    );
  }

  const initialCenter = boundsToFit ? boundsToFit.getCenter() : defaultCenter;

  return (
    <MapContainer
        center={initialCenter}
        zoom={defaultZoom}
        scrollWheelZoom={true}
        style={{ height: '100vh', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {mapContent}
    </MapContainer>
  );
};

export default MapPage;
