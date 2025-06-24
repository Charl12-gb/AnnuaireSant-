import React from 'react';
import { useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L, { LatLngExpression, LatLngBoundsExpression } from 'leaflet';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

// Leaflet Icon Fix (as seen in TestMap.tsx)
// Ensure this runs only once, or is idempotent, if MapPage could re-render significantly.
// For a typical page component, this is fine here.
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Define expected state structures
interface SingleStructureState {
  latitude?: number;
  longitude?: number;
  name?: string;
  address?: string;
  id_structure?: number; // Keep other relevant info if needed for popups etc.
  ville?: string;
}

interface MultipleStructuresState {
  structures?: Array<{
    id_structure: number;
    latitude: number;
    longitude: number;
    nom_structure: string;
    adresse: string;
    ville?: string;
  }>;
  userLocation?: {
    latitude: number;
    longitude: number;
  };
}

type MapPageState = SingleStructureState & MultipleStructuresState;


// Component to adjust map bounds for multiple markers
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
  const location = useLocation();
  const state = location.state as MapPageState | null;

  const defaultCenter: LatLngExpression = [9.3077, 2.3158]; // Center of Benin, approx.
  const defaultZoom = 7;

  if (!state || (!state.latitude && !state.structures)) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Erreur de localisation</h1>
        <p>Aucune donnée de localisation n'a été fournie pour afficher la carte.</p>
        {/* TODO: Add a link to go back or to homepage */}
      </div>
    );
  }

  let mapContent = null;
  let boundsToFit: LatLngBoundsExpression | undefined = undefined;

  // Case 1: Single Structure
  if (state.latitude && state.longitude && typeof state.latitude === 'number' && typeof state.longitude === 'number') {
    const position: LatLngExpression = [state.latitude, state.longitude];
    mapContent = (
      <>
        <Marker position={position}>
          <Popup>
            <b>{state.name || 'Structure'}</b><br />
            {state.address || 'Adresse non disponible'}
            {state.ville && `, ${state.ville}`}
          </Popup>
        </Marker>
      </>
    );
    // For single marker, we can also use bounds to set initial view with padding
    boundsToFit = L.latLngBounds([position, position]);
  }
  // Case 2: Multiple Structures
  else if (state.structures && state.structures.length > 0) {
    const validStructures = state.structures.filter(
      s => s.latitude != null && s.longitude != null && typeof s.latitude === 'number' && typeof s.longitude === 'number'
    );

    if (validStructures.length === 0) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <h1>Erreur de localisation</h1>
              <p>Aucune structure avec des coordonnées valides n'a été fournie.</p>
            </div>
          );
    }

    const points: LatLngExpression[] = validStructures.map(s => [s.latitude, s.longitude] as LatLngExpression);

    if (state.userLocation && state.userLocation.latitude != null && state.userLocation.longitude != null) {
      points.push([state.userLocation.latitude, state.userLocation.longitude] as LatLngExpression);
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
        {state.userLocation && state.userLocation.latitude != null && state.userLocation.longitude != null && (
          <Marker
            position={[state.userLocation.latitude, state.userLocation.longitude]}
            // Optional: use a different icon for user location
            // icon={L.icon({ iconUrl: 'path/to/user-marker.png', ... })}
          >
            <Popup>Votre position</Popup>
          </Marker>
        )}
        {boundsToFit && <FitBounds bounds={boundsToFit} />}
      </>
    );
  } else {
     // Fallback if state is somehow invalid or empty after initial check
     return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h1>Données invalides</h1>
          <p>Les données de localisation fournies sont invalides ou incomplètes.</p>
        </div>
      );
  }

  // Determine initial center for MapContainer before FitBounds takes over
  // If boundsToFit is defined, use its center. Otherwise, default.
  const initialCenter = boundsToFit ? boundsToFit.getCenter() : defaultCenter;

  return (
    <MapContainer
        center={initialCenter}
        zoom={defaultZoom} // Initial zoom, FitBounds will adjust it
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
