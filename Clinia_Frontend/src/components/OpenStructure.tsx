import React, { useState, useEffect } from 'react';
import { Star, MapPin, Phone, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// import { Button } from "react-day-picker"; // Button from react-day-picker seems unused, Button from shadcn/ui might be intended if needed later
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Interface for the structure data expected from the API
// This should align with the StructureSante model and what the search endpoint returns
interface ApiStructureSante {
  id_structure: number;
  nom_structure: string;
  type_structure: string; // e.g., "pharmacie", "hopital"
  adresse: string;
  quartier?: string;
  ville?: string;
  telephone_principal: string;
  horaires_ouverture?: any; // JSON field, structure can be complex e.g., {"lundi": {"ouvert": true, "heure_ouverture": "09:00", "heure_fermeture": "17:00"}}
  // Add other fields if they are returned and needed, e.g., latitude, longitude, evaluations
  // For now, we'll focus on what the static data used.
  // Evaluations (for rating/reviews) and image are not directly on the model from what we've seen.
}

// Interface for the data structure used by the component's rendering logic
interface DisplayStructure {
  id: number;
  name: string;
  category: string; // User-friendly category name
  location: string;
  phone: string;
  hours: string; // User-friendly hours string
  image: string; // URL to an image
  // rating and reviews omitted as per plan
}

// Helper to format raw type_structure to a displayable name
// This could be expanded or made more robust, e.g., by fetching types from API as in FeaturedCategories
const formatCategoryName = (type: string): string => {
  if (!type) return "Inconnu";
  return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// Helper to get today's hours string
const getTodayHours = (horaires: any): string => {
  if (!horaires || typeof horaires !== 'object') return "Horaires non disponibles";
  try {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(); // e.g., "monday"
    const dayInfo = horaires[today];
    if (dayInfo && dayInfo.ouvert === true) {
      return `${dayInfo.heure_ouverture} - ${dayInfo.heure_fermeture}`;
    }
    return "Fermé aujourd'hui"; // Or specific message if open_now was the only filter
  } catch (e) {
    console.error("Error parsing horaires_ouverture:", e);
    return "Horaires difficiles à lire";
  }
};

// Placeholder image logic (very basic)
const getPlaceholderImage = (type: string): string => {
  // In a real app, these would be actual URLs to placeholder images
  // For now, using a generic Unsplash URL related to healthcare
  const typeToImageKeyword: { [key: string]: string } = {
    pharmacie: "pharmacy",
    hopital: "hospital building",
    clinique: "clinic",
    laboratoire: "laboratory",
    cabinet_imagerie: "mri scan",
    centre_reeducation: "rehabilitation center",
    ambulance: "ambulance vehicle",
    cabinet_dentaire: "dental clinic",
    default: "healthcare"
  };
  const keyword = typeToImageKeyword[type] || typeToImageKeyword.default;
  return `https://source.unsplash.com/400x300/?${keyword}`;
};


const OpenStructure = () => {
  const navigate = useNavigate();
  const [openStructures, setOpenStructures] = useState<DisplayStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOpenStructures = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/structures/search?open_now=true&limit=6`); // Added limit for "À la une"
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        const data = await response.json();

        // The search endpoint returns { structures: [...] }
        if (!data.structures || !Array.isArray(data.structures)) {
            console.warn("API response for open structures is not in the expected format or is empty:", data);
            // Set to empty array if structures are missing or not an array, to avoid map error
            setOpenStructures([]);
            if (!data.structures) throw new Error("Format de données des structures ouvertes inattendu: 'structures' manquant.");
            // If data.structures is not an array but exists, it's still an issue.
            if (!Array.isArray(data.structures)) throw new Error("Format de données des structures ouvertes inattendu: 'structures' n'est pas un tableau.");
        }

        const apiStructures: ApiStructureSante[] = data.structures;

        const mappedStructures: DisplayStructure[] = apiStructures.map(s => ({
          id: s.id_structure,
          name: s.nom_structure,
          category: formatCategoryName(s.type_structure),
          location: `${s.adresse}${s.quartier ? ', ' + s.quartier : ''}${s.ville ? ', ' + s.ville : ''}`,
          phone: s.telephone_principal,
          hours: getTodayHours(s.horaires_ouverture),
          image: getPlaceholderImage(s.type_structure),
        }));
        setOpenStructures(mappedStructures);

      } catch (err: any) {
        console.error("Erreur lors du chargement des structures ouvertes:", err);
        setError(err.message || "Impossible de charger les structures ouvertes.");
        setOpenStructures([]); // Clear structures on error
      } finally {
        setLoading(false);
      }
    };

    fetchOpenStructures();
  }, []);

  const handleViewMore = (structureId: number) => {
    navigate(`/structures/${structureId}`); // Navigate to the detailed structure page
  };

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Les structures de santé actuellement ouvertes !
          </h2>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-green-500 mb-2"></div>
            <p className="text-gray-600">Chargement des structures ouvertes...</p>
          </div>
        )}

        {error && (
          <div className="text-center text-red-600 py-10">
            <p>{error}</p>
            <p className="text-sm text-gray-500">Veuillez vérifier le serveur ou réessayer plus tard.</p>
          </div>
        )}

        {!loading && !error && openStructures.length === 0 && (
          <div className="text-center text-gray-500 py-10">
            <p>Aucune structure de santé n'est signalée comme ouverte actuellement.</p>
            <p className="text-sm">Revenez plus tard ou essayez une recherche plus large.</p>
          </div>
        )}

        {!loading && !error && openStructures.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {openStructures.map((structure) => (
              <Card key={structure.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="relative">
                  <img
                    src={structure.image}
                    alt={structure.name}
                    className="w-full h-48 object-cover"
                  />
                  <Badge className="absolute top-4 left-4 bg-green-600 text-white">
                    Ouvert maintenant
                  </Badge>
                </div>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg text-foreground">{structure.name}</h3>
                    <Badge variant="outline">{structure.category}</Badge>
                  </div>

                  {/* Rating and reviews omitted as per plan */}
                  {/* <div className="flex items-center mb-3">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium ml-1">{structure.rating}</span>
                    <span className="text-sm text-muted-foreground ml-1">({structure.reviews} avis)</span>
                  </div> */}

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      {structure.location}
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      {structure.phone}
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="h-4 w-4 mr-2" />
                        {structure.hours}
                      </div>
                      <a
                        className="cursor-pointer rounded-lg hover:border-transparent hover:bg-green-700 text-green-600 p-1 hover:text-white text-sm font-medium"
                        onClick={() => handleViewMore(structure.id)}
                    >
                      Voir plus
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default OpenStructure;
