// src/components/Hero.jsx
import { useState, useEffect } from "react";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button"; // En supposant que c'est votre composant Button de la bibliothèque UI
import { Input } from "@/components/ui/input";   // En supposant que c'est votre composant Input de la bibliothèque UI
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext"; // Import useAuth

// Note: Suppression de la prop onSearch car la navigation sera gérée en interne
// interface HeroProps { onSearch: (query: string, category: string) => void; }

const Hero = () => { // Changement de prop à pas de props
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTypeIndex, setCurrentTypeIndex] = useState(0);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth(); // Utilisation de useAuth pour obtenir l'utilisateur

  const healthCenterTypes = [
    "hôpital",
    "centre de rééducation",
    "clinique",
    "laboratoire",
    "cabinet d'imagerie",
    "cabinet dentaire",
    "ambulance et urgence",
    "pharmacie",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTypeIndex((prevIndex) =>
        prevIndex === healthCenterTypes.length - 1 ? 0 : prevIndex + 1
      );
    }, 1000); // Change le type toutes les 1 secondes

    return () => clearInterval(interval);
  }, [healthCenterTypes.length]);

  const handleSearch = () => {
    const queryParams = new URLSearchParams();
    if (searchQuery.trim()) {
      // Utilisation du paramètre 'keywords' cohérent avec le backend
      queryParams.append('keywords', searchQuery.trim());
    }
    // Ajoutez ici d'autres paramètres si votre formulaire de recherche les gère (ex: type, ville)

    navigate(`/search-results?${queryParams.toString()}`);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleAddBusiness = () => {
    navigate('/ajouter-centre');
  };

  return (
    <section className="relative min-h-[500px] bg-gradient-to-br from-green-700 via-green-600 to-green-800 overflow-hidden">
      {/* Éléments décoratifs d'arrière-plan */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/20 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-400/20 rounded-full translate-y-1/2 -translate-x-1/2"></div>
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Annuaire des services de santé au Bénin
        </h1>
        <p className="text-2xl text-green-100 mb-12 max-w-3xl mx-auto leading-relaxed">
          Trouvez rapidement des établissements de santé près de chez vous.
        </p>

        {/* Formulaire de recherche */}
        <div className="mb-8">
          <div className="max-w-2xl mx-auto relative">
            <Input
              placeholder={`${healthCenterTypes[currentTypeIndex]}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="h-14 pl-6 pr-32 text-lg rounded-full border-0 shadow-lg text-gray-400"
            />
            <Button
              onClick={handleSearch}
              className="absolute right-2 top-2 h-10 px-8 bg-green-600 hover:bg-green-700 text-white rounded-full"
            >
              <Search className="mr-2 h-4 w-4" />
              Rechercher
            </Button>
          </div>
        </div>

        {/* Boutons d'action */}
        { isAuthenticated ? (
        <div className="flex flex-wrap justify-center gap-4">
          <Button
            onClick={handleAddBusiness}
            variant="outline"
            className="bg-white/10 border-white/30 text-white hover:bg-white/20 rounded-full px-6"
          >
            <Plus className="mr-2 h-4 w-4" />
            Ajouter une structure de santé
          </Button>
        </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              onClick={() => navigate('/gerer-connexion')}
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 rounded-full px-6"
            >
              Se connecter
            </Button>
            <Button
              onClick={() => navigate('/gerer-connexion')}
              className="bg-green-600 hover:bg-green-700 text-white rounded-full px-6"
            >
              S'inscrire
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default Hero;