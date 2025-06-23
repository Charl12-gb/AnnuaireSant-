import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// --- Interfaces Améliorées ---
interface User {
  id_utilisateur: number; // Modifié pour correspondre à votre backend Laravel
  nom: string;
  prenom: string;
  email: string;
  // Assurez-vous que tous les rôles possibles du backend sont inclus ici
  role: 'user' | 'health_structure' | 'admin';
  telephone?: string | null; // Peut être null si non fourni
  statut_compte?: string; // Ajouté si vous voulez l'afficher côté client
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loadingAuth: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    prenom: string,
    nom: string,
    email: string,
    telephone: string, // Telephone est requis dans le formulaire de ConnexionUser.tsx
    password: string,
    password_confirmation: string,
    role?: 'user' | 'health_structure' // Rôle est facultatif ici car il a une valeur par défaut dans le backend
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Utilisez une variable d'environnement pour l'URL de base de l'API en production
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  // Initialisez à true pour indiquer que le processus de vérification de l'authentification est en cours au démarrage
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);
  const navigate = useNavigate();

  // --- Effet pour charger l'état d'authentification au démarrage ---
  useEffect(() => {
    const initializeAuth = async () => { // Rendre async pour de futures vérifications asynchrones si nécessaire
      try {
        const token = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('utilisateur');

        if (token && storedUser) {
          const parsedUser: User = JSON.parse(storedUser);
          setIsAuthenticated(true);
          setUser(parsedUser);
          console.log("AuthContext: Utilisateur restauré depuis le localStorage.", parsedUser.email);
          // Optionnel: Vérifier la validité du token auprès du backend ici si besoin
        } else {
          setIsAuthenticated(false);
          setUser(null);
          console.log("AuthContext: Pas de session active trouvée dans le localStorage.");
        }
      } catch (e) {
        console.error("AuthContext: Erreur lors de la lecture des données utilisateur depuis le localStorage. Nettoyage...", e);
        localStorage.removeItem('authToken');
        localStorage.removeItem('utilisateur');
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoadingAuth(false); // Assurez-vous que loadingAuth passe à false une fois le chargement initial terminé
      }
    };

    initializeAuth();
  }, []); // Exécuté une seule fois au montage du composant

  // --- Fonction de Connexion ---
  const login = async (email: string, password: string) => {
    setLoadingAuth(true); // Active l'état de chargement
    try {
      console.log("AuthContext: Démarrage du processus de connexion.");
      console.log("AuthContext: Tentative d'envoi de la requête de connexion à:", `${API_BASE_URL}/login`);

      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log("AuthContext: Données JSON de la réponse de connexion:", data);

      if (response.ok) {
        // Le backend doit renvoyer 'token', 'utilisateur', 'redirect_to'
        localStorage.setItem('authToken', data.access_token);
        localStorage.setItem('utilisateur', JSON.stringify(data.utilisateur));
        setIsAuthenticated(true);
        setUser(data.utilisateur); // Affectez directement l'objet utilisateur retourné par le backend

        const redirectTo = data.redirect_to || '/'; // Utilisez la redirection du backend ou la racine par défaut
        console.log("AuthContext: Connexion réussie. Redirection vers:", redirectTo);
        navigate(redirectTo); // Redirige l'utilisateur

      } else {
        // Gérer les erreurs spécifiques renvoyées par le backend (ex: 422 ValidationException, 401 Unauthorized)
        const errorMessage = data.message || (data.errors && Object.values(data.errors).flat().join(". ")) || "Échec de la connexion. Veuillez réessayer.";
        console.error("AuthContext: Erreur du backend lors de la connexion:", errorMessage, data);
        throw new Error(errorMessage); // Propage l'erreur pour qu'elle soit gérée par le composant appelant
      }
    } catch (error: any) {
      console.error("AuthContext: Erreur durant l'appel d'authentification ou le traitement de la réponse:", error.message || error);
      // Pour les erreurs inattendues ou de réseau
      throw new Error(error.message || "Une erreur réseau est survenue. Veuillez vérifier votre connexion.");
    } finally {
      console.log("AuthContext: Fonction de connexion terminée.");
      setLoadingAuth(false); // Désactive l'état de chargement
    }
  };

  // --- Fonction d'Inscription ---
  const register = async (
    prenom: string,
    nom: string,
    email: string,
    telephone: string,
    password: string,
    password_confirmation: string,
    role?: 'user' | 'health_structure'
  ) => {
    setLoadingAuth(true); // Active l'état de chargement
    try {
      console.log("AuthContext: Démarrage du processus d'inscription.");

      const payload = {
        prenom,
        nom,
        email,
        telephone,
        password,
        password_confirmation,
        ...(role && { role }), // Ajoute le rôle seulement s'il est défini
      };
      console.log("AuthContext: Données envoyées pour l'inscription:", payload);

      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("AuthContext: Données JSON de la réponse d'inscription:", data);

      if (response.ok) {
        localStorage.setItem('authToken', data.access_token);
        localStorage.setItem('utilisateur', JSON.stringify(data.utilisateur));
        setIsAuthenticated(true);
        setUser(data.utilisateur); // Affectez directement l'objet utilisateur retourné par le backend

        const redirectTo = data.redirect_to || '/';
        console.log("AuthContext: Inscription réussie. Redirection vers:", redirectTo);
        navigate(redirectTo); // Redirige l'utilisateur
      } else {
        const errorMessage = data.message || (data.errors && Object.values(data.errors).flat().join(". ")) || "Échec de l'inscription. Veuillez vérifier les informations.";
        console.error("AuthContext: Erreur du backend lors de l'inscription:", errorMessage, data);
        throw new Error(errorMessage); // Propage l'erreur
      }
    } catch (error: any) {
      console.error("AuthContext: Erreur durant l'appel d'inscription:", error.message || error);
      // Pour les erreurs inattendues ou de réseau
      throw new Error(error.message || "Une erreur réseau est survenue. Veuillez vérifier votre connexion.");
    } finally {
      console.log("AuthContext: Fin de la fonction register.");
      setLoadingAuth(false); // Désactive l'état de chargement
    }
  };

  // --- Fonction de Déconnexion ---
  const logout = async () => {
    setLoadingAuth(true); // Active l'état de chargement
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        // Envoi de la requête de déconnexion au backend
        const response = await fetch(`${API_BASE_URL}/logout`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("AuthContext: Erreur du backend lors de la déconnexion:", errorData.message || "Erreur inconnue.");
          // Ne propage pas l'erreur car la déconnexion locale doit quand même avoir lieu
        }
        console.log("AuthContext: Requête de déconnexion envoyée au backend.");
      }
    } catch (error) {
      console.error("AuthContext: Erreur réseau lors de la déconnexion du backend:", error);
    } finally {
      // Nettoyage de l'état local et du localStorage, quelle que soit la réponse du backend
      localStorage.removeItem('authToken');
      localStorage.removeItem('utilisateur');
      setIsAuthenticated(false);
      setUser(null);
      setLoadingAuth(false); // Désactive l'état de chargement
      console.log("AuthContext: Déconnexion locale effectuée.");
      navigate('/gerer-connexion'); // Redirection vers la page de connexion après déconnexion
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loadingAuth, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
};