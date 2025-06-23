import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Mail, Lock, User, UserPlus, Phone, Loader2 } from 'lucide-react'; // Importez Loader2 pour l'icône de chargement
import { useAuth } from '../context/AuthContext'; // Assurez-vous que le chemin est correct selon votre arborescence

const ConnexionUser = () => {
  // Utilisez le hook useAuth pour accéder aux fonctions d'authentification et à l'état de chargement
  const { login, register, loadingAuth } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    password: '',
    confirmPassword: ''
  });
  const [passwordMatchError, setPasswordMatchError] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null); // Nouvel état pour les erreurs de l'API

  // Charger les données si "Se souvenir de moi" était coché lors de la dernière connexion
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberMeEmail');
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Réinitialiser les erreurs lors de la modification des champs
    if (e.target.name === 'password' || e.target.name === 'confirmPassword') {
      setPasswordMatchError(false);
    }
    setApiError(null); // Réinitialise l'erreur API quand l'utilisateur commence à taper
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null); // Réinitialiser les erreurs API précédentes
    // L'état `loadingAuth` du contexte sera utilisé pour désactiver le bouton et afficher un spinner

    try {
      if (isLogin) {
        // Logique pour la connexion
        if (rememberMe) {
          localStorage.setItem('rememberMeEmail', formData.email);
        } else {
          localStorage.removeItem('rememberMeEmail');
        }
        await login(formData.email, formData.password); // Appel de la fonction login du contexte
        // La redirection est gérée à l'intérieur du contexte AuthContext si le login réussit
      } else {
        // Logique pour l'inscription
        if (formData.password !== formData.confirmPassword) {
          setPasswordMatchError(true);
          console.error('Les mots de passe ne correspondent pas.');
          return; // Empêche la soumission si les mots de passe ne correspondent pas
        }
        setPasswordMatchError(false); // Assurez-vous que l'erreur est à false si tout est bon

        // Appel de la fonction register du contexte
        await register(
          formData.prenom,
          formData.nom,
          formData.email,
          formData.telephone,
          formData.password,
          formData.confirmPassword,
          'user' // Spécifier le rôle 'user' ici, car il s'agit d'une inscription utilisateur standard.
                // Si vous aviez un sélecteur de rôle dans le formulaire, vous passeriez sa valeur.
        );
        // La redirection est gérée à l'intérieur du contexte AuthContext si l'inscription réussit
      }
    } catch (error: any) {
      console.error("Erreur lors de la soumission du formulaire:", error);
      // Afficher l'erreur retournée par le contexte AuthContext
      setApiError(error.message || "Une erreur inattendue est survenue.");
    }
    // `loadingAuth` est géré dans AuthContext, donc pas besoin de `setFormLoading(false)` ici.
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {isLogin ? 'Connexion' : 'Inscription'}
          </h1>
          <p className="text-gray-600">
            {isLogin
              ? 'Connectez-vous à votre compte'
              : 'Créez votre compte pour accéder aux fonctionnalités personnalisées'
            }
          </p>
        </div>

        {/* Message d'erreur API */}
        {apiError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{apiError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Champs nom, prénom et téléphone pour l'inscription */}
          {!isLogin && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="prenom" className="text-gray-700 font-medium">
                    Prénom
                  </Label>
                  <Input
                    id="prenom"
                    name="prenom"
                    type="text"
                    value={formData.prenom}
                    onChange={handleInputChange}
                    className="mt-1 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    placeholder="Votre prénom"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="nom" className="text-gray-700 font-medium">
                    Nom
                  </Label>
                  <Input
                    id="nom"
                    name="nom"
                    type="text"
                    value={formData.nom}
                    onChange={handleInputChange}
                    className="mt-1 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    placeholder="Votre nom"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="telephone" className="text-gray-700 font-medium">
                  Téléphone
                </Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="telephone"
                    name="telephone"
                    type="tel"
                    value={formData.telephone}
                    onChange={handleInputChange}
                    className="pl-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    placeholder="Ex: 0123456789"
                    required
                  />
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <Label htmlFor="email" className="text-gray-700 font-medium">
              Email
            </Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className="pl-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
                placeholder="votre@email.com"
                required
              />
            </div>
          </div>

          {/* Mot de passe */}
          <div>
            <Label htmlFor="password" className="text-gray-700 font-medium">
              Mot de passe
            </Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleInputChange}
                className="pl-10 pr-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
                placeholder="Votre mot de passe"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirmer mot de passe (uniquement pour l'inscription) */}
          {!isLogin && (
            <div>
              <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
                Confirmer mot de passe
              </Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`pl-10 pr-10 border-gray-300 focus:border-green-500 focus:ring-green-500 ${
                    passwordMatchError ? 'border-red-500' : ''
                  }`}
                  placeholder="Confirmez votre mot de passe"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {passwordMatchError && (
                <p className="text-red-500 text-sm mt-1">Les mots de passe ne correspondent pas.</p>
              )}
            </div>
          )}

          {/* Section "Se souvenir de moi" et "Mot de passe oublié" */}
          {isLogin && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <Label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900">
                  Se souvenir de moi
                </Label>
              </div>
              <button
                type="button"
                className="text-sm text-green-600 hover:text-green-700 hover:underline"
              >
                Mot de passe oublié ?
              </button>
            </div>
          )}

          {/* Bouton de soumission */}
          <Button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 rounded-lg transition-colors"
            disabled={loadingAuth} // Désactiver le bouton pendant le chargement (utilise loadingAuth du contexte)
          >
            {loadingAuth ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> // Icône de chargement
            ) : isLogin ? (
              <>
                <User className="w-5 h-5 mr-2" />
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5 mr-2" />
              </>
            )}
            {loadingAuth ? 'Chargement...' : (isLogin ? 'Se connecter' : "S'inscrire")}
          </Button>
        </form>

        {/* Toggle entre connexion et inscription */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            {isLogin ? "Vous n'avez pas de compte ?" : "Vous avez déjà un compte ?"}
          </p>
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setApiError(null); // Réinitialiser les erreurs API lors du changement de mode
              setPasswordMatchError(false); // Réinitialiser l'erreur de mot de passe
              setFormData(prev => ({ // Réinitialiser le formulaire pour éviter de conserver d'anciennes données
                prenom: '',
                nom: '',
                email: isLogin && rememberMe ? prev.email : '', // Garder l'email si "se souvenir de moi" est actif et on passe du login au register
                telephone: '',
                password: '',
                confirmPassword: ''
              }));
            }}
            className="mt-2 text-green-600 hover:text-green-700 font-medium hover:underline"
          >
            {isLogin ? "Créer un compte" : "Se connecter"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnexionUser;