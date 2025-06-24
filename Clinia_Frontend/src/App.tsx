import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index"; // Assurez-vous que c'est votre page d'accueil principale
import SearchResults from "./pages/SearchResults";
import BusinessDetail from "./pages/BusinessDetail";
import AjouterStructure from "./pages/AjouterStructure";
import NotFound from "./pages/NotFound";
import ConnexionUser from "./pages/ConnexionUser";
import StructuresListe from "./pages/StructuresListe"; 
import SearchResultsPage from './pages/SearchResultsPage'; // La nouvelle page
import StructureLocationPage from './pages/StructureLocationPage'; 
import MapPage from './pages/MapPage'; // Import the new MapPage
import StructureLocationMap from './components/TestMap';
import { AuthProvider } from './context/AuthContext';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/recherche" element={<SearchResults />} />
          <Route path="/search-results" element={<SearchResultsPage />} />
          <Route path="/structure-location/:id" element={<StructureLocationPage />} /> {/* Route pour la carte */}
          <Route path="/centre/:id" element={<BusinessDetail />} />
          <Route path="/ajouter-centre" element={<AjouterStructure />} />
          <Route path="/gerer-connexion" element={<ConnexionUser />} />

          {/* Nouvelle route pour afficher toutes les structures par catégorie */}
          {/* Le ":categoryType" est un paramètre dynamique qui sera lu par useParams dans StructuresListe */}
          <Route path="/structures/:categoryType" element={<StructuresListe />} />

          {/* Optionnel: une route pour /structures qui affiche toutes les structures si aucune catégorie n'est spécifiée */}
          <Route path="/structures" element={<StructuresListe />} />
          {/* Nouvelle route pour la carte */}
          <Route path="/structure-location" element={<StructureLocationMap />} />
          <Route path="/map" element={<MapPage />} /> {/* Add route for MapPage */}
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;