// src/components/Header.jsx
import { useState, useEffect } from "react";
import { Menu, X, User, Search } from "lucide-react";
import { Button } from "@/components/ui/button"; // En supposant que c'est votre composant Button de la bibliothèque UI
import { useNavigate } from "react-router-dom";
import logo from "/assets/logo.png"; // Assurez-vous que le chemin est correct
import { useAuth } from "@/context/AuthContext"; // Import useAuth

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentHealthcareIndex, setCurrentHealthcareIndex] = useState(0);
  const [headerSearchQuery, setHeaderSearchQuery] = useState(""); // <-- Nouvel état pour la recherche de l'en-tête
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth(); // Get auth state and logout function

  const healthcareFacilities = [
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
      setCurrentHealthcareIndex((prevIndex) =>
        prevIndex === healthcareFacilities.length - 1 ? 0 : prevIndex + 1
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [healthcareFacilities.length]);

  const handleAddBusiness = () => {
    navigate("/ajouter-centre");
  };

  const handleLogoClick = () => {
    navigate("/");
  };

  const handleConnexion = () => {
    navigate("/gerer-connexion");
  };

  const handleConnexionGestion = () => {
    navigate("/gerer-connexion");
  };

  // <-- Nouveau gestionnaire de recherche pour l'en-tête
  const handleHeaderSearch = () => {
    const queryParams = new URLSearchParams();
    if (headerSearchQuery.trim()) {
        queryParams.append('keywords', headerSearchQuery.trim());
    }
    // Ajoutez ici d'autres paramètres si votre barre de recherche d'en-tête les gère (ex: type, ville)
    navigate(`/search-results?${queryParams.toString()}`);
  };

  const handleHeaderKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleHeaderSearch();
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 cursor-pointer flex items-center" onClick={handleLogoClick}>
              {/* Ajout du logo ici */}
              <img src={logo} alt="Application Logo" className="h-8 w-8 rounded-full mr-2" />
              <h1 className="text-2xl font-bold text-primary">
                CLI<span className="text-green-600">NIA</span>
              </h1>
            </div>
          </div>

          {/* Barre de recherche (desktop uniquement) */}
          <div className="hidden md:flex mx-6 w-1/2">
            <div className="flex items-center w-full bg-gray-100 border border-gray-300 rounded-full px-4 py-1">
              <Search className="text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder={`${healthcareFacilities[currentHealthcareIndex]}...`}
                className="flex-1 bg-transparent outline-none text-sm text-gray-400 placeholder-gray-400"
                value={headerSearchQuery} // <-- Lier la valeur de l'entrée à l'état
                onChange={(e) => setHeaderSearchQuery(e.target.value)} // <-- Mettre à jour l'état lors du changement
                onKeyPress={handleHeaderKeyPress} // <-- Gérer la touche Entrée
              />
              <Button
                onClick={handleHeaderSearch} // <-- Appeler le nouveau gestionnaire
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-full shadow-sm transition duration-300 ease-in-out text-sm font-semibold flex items-center"
              >
                <Search className="w-4 h-4 mr-1" />
                Rechercher
              </Button>
            </div>
          </div>

          {/* Actions Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <button
                onClick={logout}
                className="text-sm font-medium text-foreground hover:text-red-700 transition-colors"
              >
                Se déconnecter
              </button>
            ) : (
              <button
                onClick={handleConnexion}
                className="text-sm font-medium text-foreground hover:text-green-700 transition-colors"
              >
                Se connecter
              </button>
            )}
            {isAuthenticated && (
              <Button
                onClick={handleAddBusiness}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded-full shadow-sm transition duration-300 ease-in-out text-sm font-semibold"
              >
                Ajouter une structure de santé
              </Button>
            )}
          </div>

          {/* Bouton Menu Mobile */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Navigation Mobile */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col space-y-4">
              {/* Barre de recherche Mobile */}
              <div className="flex items-center w-full bg-gray-100 border border-gray-300 rounded-full px-4 py-1">
                <Search className="text-gray-500 w-4 h-4" />
                <input
                    type="text"
                    placeholder={`${healthcareFacilities[currentHealthcareIndex]}...`}
                    className="flex-1 bg-transparent outline-none text-sm text-gray-400 placeholder-gray-400"
                    value={headerSearchQuery} // <-- Lier la valeur de l'entrée à l'état
                    onChange={(e) => setHeaderSearchQuery(e.target.value)} // <-- Mettre à jour l'état lors du changement
                    onKeyPress={handleHeaderKeyPress} // <-- Gérer la touche Entrée
                />
                <Button
                    onClick={() => { // Gestionnaire distinct pour le bouton de recherche mobile afin de fermer le menu
                        handleHeaderSearch();
                        setIsMenuOpen(false);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-full shadow-sm transition duration-300 ease-in-out text-sm font-semibold flex items-center"
                >
                    <Search className="w-4 h-4 mr-1" />
                    Rechercher
                </Button>
              </div>

              {/* Icône Se connecter / Se déconnecter */}
              {isAuthenticated ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="self-start"
                  aria-label="Se déconnecter"
                >
                  <User className="h-5 w-5 text-foreground hover:text-red-700" /> {/* Consider different icon for logout e.g. LogOut */}
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    handleConnexionGestion();
                    setIsMenuOpen(false);
                  }}
                  className="self-start"
                  aria-label="Se connecter"
                >
                  <User className="h-5 w-5 text-foreground hover:text-green-700" />
                </Button>
              )}

              {/* Bouton Ajouter une structure */}
              {isAuthenticated && (
                <Button
                  onClick={() => {
                    handleAddBusiness();
                    setIsMenuOpen(false);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white w-full mt-2 px-4 py-1 rounded-full shadow-sm transition duration-300 ease-in-out text-sm font-semibold"
                >
                  Ajouter une structure de santé
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;