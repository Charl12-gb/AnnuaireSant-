import React, { useState, useEffect } from 'react';
import {
  Hospital,
  Stethoscope,
  Microscope,
  Pill,
  ScanLine,
  PersonStanding,
  Ambulance,
  Syringe,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom"; // Assurez-vous que useNavigate est importé

const API_BASE_URL = 'http://localhost:8000/api'; // Assurez-vous que c'est correct

// Définir un type pour la structure des comptes API
interface StructureCounts {
    [key: string]: number;
}

// Définir un type pour les types de structure de l'API
interface ApiStructureType {
    value: string;
    label: string;
}

// Définir un type pour notre configuration de catégorie fusionnée
interface CategoryConfig {
    icon: React.ElementType;
    name: string;
    type: string;
    color: string;
    bgColor: string;
    count: number;
}

// Configuration statique pour les icônes et les couleurs par type
const staticCategoryDetails: { [key: string]: { icon: React.ElementType, color: string, bgColor: string, defaultName: string } } = {
    hopital: { icon: Hospital, color: "text-red-600", bgColor: "bg-red-100", defaultName: "Hôpitaux" },
    clinique: { icon: Stethoscope, color: "text-blue-600", bgColor: "bg-blue-100", defaultName: "Cliniques" },
    laboratoire: { icon: Microscope, color: "text-green-600", bgColor: "bg-green-100", defaultName: "Laboratoires" },
    pharmacie: { icon: Pill, color: "text-teal-600", bgColor: "bg-teal-100", defaultName: "Pharmacies" },
    cabinet_imagerie: { icon: ScanLine, color: "text-purple-600", bgColor: "bg-purple-100", defaultName: "Cabinets d'imagerie" },
    centre_reeducation: { icon: PersonStanding, color: "text-yellow-600", bgColor: "bg-yellow-100", defaultName: "Centres de rééducation" },
    ambulance: { icon: Ambulance, color: "text-orange-600", bgColor: "bg-orange-100", defaultName: "Ambulances & Urgences" },
    cabinet_dentaire: { icon: Syringe, color: "text-pink-600", bgColor: "bg-pink-100", defaultName: "Cabinets dentaires" },
    // Ajoutez d'autres types ici si nécessaire avec une icône par défaut
    default: { icon: Hospital, color: "text-gray-600", bgColor: "bg-gray-100", defaultName: "Catégorie" }
};


const FeaturedCategories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<CategoryConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllCategoryData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch structure types
        const typesResponse = await fetch(`${API_BASE_URL}/structure-types`);
        if (!typesResponse.ok) {
          throw new Error(`Erreur HTTP (types): ${typesResponse.status}`);
        }
        const typesData = await typesResponse.json();
        if (!typesData.status || !Array.isArray(typesData.data)) {
          throw new Error("Format de données des types inattendu.");
        }
        const apiTypes: ApiStructureType[] = typesData.data;

        // 2. Fetch structure counts
        const countsResponse = await fetch(`${API_BASE_URL}/structures-counts`);
        if (!countsResponse.ok) {
          throw new Error(`Erreur HTTP (counts): ${countsResponse.status}`);
        }
        const countsData = await countsResponse.json();
        if (!countsData.status || typeof countsData.counts !== 'object' || countsData.counts === null) {
          throw new Error("Format de données des comptes inattendu.");
        }
        const apiCounts: StructureCounts = countsData.counts;

        // 3. Merge data
        const mergedCategories = apiTypes.map(apiType => {
          const details = staticCategoryDetails[apiType.value] || staticCategoryDetails.default;
          return {
            icon: details.icon,
            name: apiType.label, // Utiliser le label de l'API
            type: apiType.value,
            color: details.color,
            bgColor: details.bgColor,
            count: apiCounts[apiType.value] !== undefined ? apiCounts[apiType.value] : 0,
          };
        });

        setCategories(mergedCategories);

      } catch (err: any) {
        console.error("Erreur lors du chargement des données de catégories:", err);
        setError(err.message || "Impossible de charger les catégories et les comptes.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllCategoryData();
  }, []);

  const handleCategoryClick = (categoryType: string) => {
    // Navigue vers une page de résultats filtrée par ce type de catégorie
    // ou vers une page dédiée si elle existe.
    // Pour l'instant, utilisons une URL générique de recherche/liste.
    navigate(`/search-results?type=${categoryType}`);
    // Alternative: navigate(`/structures?type=${categoryType}`);
    // Alternative: navigate(`/category/${categoryType}`);
    // L'implémentation de la page de destination /search-results doit pouvoir gérer ce paramètre 'type'.
  };

  return (
    <section className="py-16 px-4 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Structure par Catégorie
          </h2>
          <p className="text-muted-foreground text-lg">
            Trouvez rapidement l'établissement de santé que vous recherchez.
          </p>
        </div>

        {loading ? (
            <div className="flex flex-col items-center justify-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-green-500 mb-2"></div>
                <p className="text-gray-600">Chargement des catégories...</p>
            </div>
        ) : error ? (
            <div className="text-center text-red-600 py-10">
                <p>{error}</p>
                <p className="text-sm text-gray-500">Veuillez vérifier le serveur ou réessayer.</p>
            </div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {categories.map((category, index) => (
                    <Card
                        key={index}
                        className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-2"
                        onClick={() => handleCategoryClick(category.type)}
                    >
                        <CardContent className="p-6 text-center">
                            <div className={`w-16 h-16 ${category.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                                <category.icon className={`h-8 w-8 ${category.color}`} />
                            </div>
                            <h3 className="font-semibold text-foreground mb-2">{category.name}</h3>
                            <p className="text-sm text-muted-foreground">
                                {category.count.toLocaleString()} établissement{category.count === 1 ? '' : 's'}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedCategories;