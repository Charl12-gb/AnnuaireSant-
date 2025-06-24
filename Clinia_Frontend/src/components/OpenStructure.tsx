import React, { useState, useEffect } from 'react';
import { Star, MapPin, Phone, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Interface pour les données de structure retournées par l'API
interface ApiStructureSante {
  id_structure: number;
  nom_structure: string;
  type_structure: string;
  adresse: string;
  quartier?: string;
  ville?: string;
  telephone_principal: string;
  horaires_ouverture?: Record<string, {
    ouvert: boolean;
    heure_ouverture: string;
    heure_fermeture: string;
  }>;
  latitude?: number;
  longitude?: number;
}

// Interface pour l'affichage des données dans le composant
interface DisplayStructure {
  id: number;
  name: string;
  category: string;
  location: string;
  phone: string;
  hours: string;
  image: string;
}

// Mappage des jours de la semaine français vers anglais
const dayMapping: Record<string, string> = {
  'sunday': 'dimanche',
  'monday': 'lundi',
  'tuesday': 'mardi',
  'wednesday': 'mercredi',
  'thursday': 'jeudi',
  'friday': 'vendredi',
  'saturday': 'samedi'
};

// Formatage du nom de catégorie
const formatCategoryName = (type: string): string => {
  if (!type) return "Inconnu";
  
  const categoryMap: Record<string, string> = {
    'pharmacie': 'Pharmacie',
    'hopital': 'Hôpital',
    'clinique': 'Clinique',
    'laboratoire': 'Laboratoire',
    'cabinet_imagerie': 'Cabinet d\'imagerie',
    'centre_reeducation': 'Centre de rééducation',
    'ambulance': 'Service d\'ambulance',
    'cabinet_dentaire': 'Cabinet dentaire'
  };
  
  return categoryMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// Obtenir les horaires d'aujourd'hui
const getTodayHours = (horaires: ApiStructureSante['horaires_ouverture']): string => {
  if (!horaires || typeof horaires !== 'object') {
    return "Horaires non disponibles";
  }
  
  try {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const frenchDay = dayMapping[today];
    
    if (!frenchDay) return "Horaires non disponibles";
    
    const dayInfo = horaires[frenchDay];
    if (dayInfo?.ouvert === true && dayInfo.heure_ouverture && dayInfo.heure_fermeture) {
      return `${dayInfo.heure_ouverture} - ${dayInfo.heure_fermeture}`;
    }
    
    return "Fermé aujourd'hui";
  } catch (error) {
    console.error("Erreur lors du parsing des horaires:", error);
    return "Horaires indisponibles";
  }
};

// Génération d'image placeholder
const getPlaceholderImage = (type: string): string => {
  const typeToImageKeyword: Record<string, string> = {
    pharmacie: "pharmacy",
    hopital: "hospital",
    clinique: "clinic",
    laboratoire: "laboratory",
    cabinet_imagerie: "medical-imaging",
    centre_reeducation: "rehabilitation",
    ambulance: "ambulance",
    cabinet_dentaire: "dental",
  };
  
  const keyword = typeToImageKeyword[type] || "healthcare";
  return `https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=300&fit=crop&crop=center`;
};

const OpenStructure: React.FC = () => {
  const navigate = useNavigate();
  const [openStructures, setOpenStructures] = useState<DisplayStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOpenStructures = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`${API_BASE_URL}/structures/search?open_now=true&limit=6`);
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();

        // Vérification de la structure des données
        if (!data || typeof data !== 'object') {
          throw new Error("Réponse API invalide");
        }

        if (!Array.isArray(data.structures)) {
          console.warn("Aucune structure trouvée ou format incorrect:", data);
          setOpenStructures([]);
          return;
        }

        const apiStructures: ApiStructureSante[] = data.structures;

        const mappedStructures: DisplayStructure[] = apiStructures.map(structure => {
          // Construction de l'adresse complète
          const addressParts = [
            structure.adresse,
            structure.quartier,
            structure.ville
          ].filter(Boolean);

          return {
            id: structure.id_structure,
            name: structure.nom_structure || "Nom non disponible",
            category: formatCategoryName(structure.type_structure),
            location: addressParts.join(', ') || "Adresse non disponible",
            phone: structure.telephone_principal || "Téléphone non disponible",
            hours: getTodayHours(structure.horaires_ouverture),
            image: getPlaceholderImage(structure.type_structure),
          };
        });

        setOpenStructures(mappedStructures);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
        console.error("Erreur lors du chargement des structures ouvertes:", err);
        setError(`Impossible de charger les structures ouvertes: ${errorMessage}`);
        setOpenStructures([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOpenStructures();
  }, []);

  const handleViewMore = (structureId: number) => {
    if (structureId && !isNaN(structureId)) {
      navigate(`/structures/${structureId}`);
    } else {
      console.error("ID de structure invalide:", structureId);
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Les structures de santé actuellement ouvertes !
            </h2>
          </div>
          <div className="flex flex-col items-center justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-green-500 mb-4"></div>
            <p className="text-muted-foreground">Chargement des structures ouvertes...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Les structures de santé actuellement ouvertes !
            </h2>
          </div>
          <div className="text-center py-10">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-red-800 font-medium mb-2">Erreur de chargement</p>
              <p className="text-red-600 text-sm mb-4">{error}</p>
              <Button onClick={handleRetry} variant="outline" size="sm">
                Réessayer
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Les structures de santé actuellement ouvertes !
          </h2>
          <p className="text-muted-foreground">
            Trouvez rapidement les structures de santé ouvertes près de chez vous
          </p>
        </div>

        {openStructures.length === 0 ? (
          <div className="text-center py-10">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-yellow-800 font-medium mb-2">Aucune structure ouverte</p>
              <p className="text-yellow-600 text-sm">
                Aucune structure de santé n'est actuellement signalée comme ouverte.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {openStructures.map((structure) => (
              <Card 
                key={structure.id} 
                className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                <div className="relative">
                  <img
                    src={structure.image}
                    alt={`${structure.name} - ${structure.category}`}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=300&fit=crop&crop=center';
                    }}
                  />
                  <Badge className="absolute top-4 left-4 bg-green-600 hover:bg-green-700 text-white border-0">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      Ouvert maintenant
                    </div>
                  </Badge>
                </div>
                
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-lg text-foreground line-clamp-2">
                      {structure.name}
                    </h3>
                    <Badge variant="outline" className="ml-2 flex-shrink-0">
                      {structure.category}
                    </Badge>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-start text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{structure.location}</span>
                    </div>
                    
                    <div className="flex items-center text-muted-foreground">
                      <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{structure.phone}</span>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>{structure.hours}</span>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewMore(structure.id)}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50 font-medium"
                      >
                        Voir plus
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default OpenStructure;