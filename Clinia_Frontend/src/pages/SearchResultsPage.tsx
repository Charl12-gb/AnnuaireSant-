// src/pages/SearchResultsPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig'; 
import Header from '../components/Header'; 
import Footer from '../components/Footer'; 
import { Building2, Hospital, Stethoscope, FlaskConical, Syringe, BriefcaseMedical, HeartPulse, Search, MapPin, XCircle } from 'lucide-react';

// Fonction pour mapper les noms d'icônes aux composants d'icônes
const getIconComponent = (iconName) => {
    switch (iconName) {
        case 'Building2': return Building2;
        case 'Hospital': return Hospital;
        case 'Stethoscope': return Stethoscope;
        case 'FlaskConical': return FlaskConical;
        case 'Syringe': return Syringe;
        case 'BriefcaseMedical': return BriefcaseMedical;
        case 'HeartPulse': return HeartPulse;
        default: return Building2;
    }
};

const SearchResultsPage = () => {
    const navigate = useNavigate();

    // État pour les données des filtres (initialement vides)
    const [structureTypes, setStructureTypes] = useState([]);
    const [availableServices, setAvailableServices] = useState([]);
    const [availableAssurances, setAvailableAssurances] = useState([]);

    // États pour le chargement et les erreurs des filtres
    const [loadingFilters, setLoadingFilters] = useState(true);
    const [filterError, setFilterError] = useState(null);

    // États pour les critères de recherche
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [selectedService, setSelectedService] = useState('');
    const [selectedAssurance, setSelectedAssurance] = useState('');
    const [userLocation, setUserLocation] = useState(null);
    const [radius, setRadius] = useState(10);
    const [openNow, setOpenNow] = useState(false);

    // État pour les résultats de la recherche de structures
    const [searchResults, setSearchResults] = useState([]);
    const [loadingResults, setLoadingResults] = useState(false);
    const [resultsError, setResultsError] = useState(null);

    // ******************************************************
    // EFFET POUR RÉCUPÉRER LES OPTIONS DE FILTRE DE L'API
    // ******************************************************
    useEffect(() => {
        const fetchFilterOptions = async () => {
            setLoadingFilters(true);
            setFilterError(null);
            try {
                // Récupérer les types de structure
                const typesResponse = await api.get('/structure-types');
                
                // Vérifier si les données existent et sont un tableau
                const typesData = typesResponse.data?.data || typesResponse.data || [];
                const dynamicTypes = [
                    { value: '', label: 'Tous les types', icon_name: 'Building2' },
                    ...(Array.isArray(typesData) ? typesData.map(type => ({
                        value: type.value?.toLowerCase()?.replace(/\s/g, '_') || type.id,
                        label: type.label || 'Type inconnu',
                        icon_name: type.icon_name || 'Building2'
                    })) : [])
                ];
                setStructureTypes(dynamicTypes);

                // Récupérer les services
                const servicesResponse = await api.get('/services');

                console.log('Services response:', servicesResponse.data); // Debug
                
                const servicesData = servicesResponse.data?.services || [];
                const dynamicServices = [
                    { value: '', label: 'Tous les services' },
                    ...(Array.isArray(servicesData) ? servicesData.map(service => ({
                        value: service.id,
                        label: service.nom_service || service.nom || service.name || 'Service inconnu'
                    })) : [])
                ];
                setAvailableServices(dynamicServices);

                // Récupérer les assurances
                const assurancesResponse = await api.get('/assurances');

                const assurancesData = assurancesResponse.data?.compagnies || [];
                const dynamicAssurances = [
                    { value: '', label: 'Toutes les assurances' },
                    ...(Array.isArray(assurancesData) ? assurancesData.map(assurance => ({
                        value: assurance.id,
                        label: assurance.nom_assurance || assurance.nom || assurance.name || 'Assurance inconnue'
                    })) : [])
                ];
                setAvailableAssurances(dynamicAssurances);

            } catch (err) {
                setFilterError("Impossible de charger les options de filtre. Veuillez vérifier votre connexion.");
                
                // Définir des valeurs par défaut en cas d'erreur
                setStructureTypes([{ value: '', label: 'Tous les types', icon_name: 'Building2' }]);
                setAvailableServices([{ value: '', label: 'Tous les services' }]);
                setAvailableAssurances([{ value: '', label: 'Toutes les assurances' }]);
            } finally {
                setLoadingFilters(false);
            }
        };

        fetchFilterOptions();
    }, []);

    // ******************************************************
    // EFFET POUR LA GÉOLOCALISATION DE L'UTILISATEUR
    // ******************************************************
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setUserLocation({ latitude, longitude });
                },
                (err) => {
                    console.warn(`Geolocation Error (${err.code}): ${err.message}`);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        }
    }, []);

    // ******************************************************
    // FONCTION POUR LA RECHERCHE DE STRUCTURES
    // ******************************************************
    const handleSearch = async (e) => {
        e.preventDefault();
        setLoadingResults(true);
        setResultsError(null);

        try {
            const params = {
                search: searchTerm,
                type: selectedType,
                service: selectedService,
                assurance: selectedAssurance,
                open_now: openNow,
                ...(userLocation && radius && {
                    user_lat: userLocation.latitude,
                    user_lon: userLocation.longitude,
                    radius: radius
                })
            };

            // Nettoyer les paramètres vides
            Object.keys(params).forEach(key => {
                if (params[key] === '' || params[key] === null || params[key] === undefined) {
                    delete params[key];
                }
            });

            console.log('Search params:', params); // Debug

            const response = await api.get('/structures/search', { params });
            console.log('Search response:', response.data); // Debug
            
            const structuresData = response.data?.structures || response.data?.data || response.data || [];
            setSearchResults(Array.isArray(structuresData) ? structuresData : []);
        } catch (err) {
            console.error("Erreur lors de la recherche des structures:", err);
            console.error("Détails de l'erreur:", err.response?.data);
            setResultsError(err.response?.data?.message || "Erreur lors de la recherche des structures. Veuillez réessayer.");
        } finally {
            setLoadingResults(false);
        }
    };

    // Fonction pour réinitialiser les filtres
    const handleResetFilters = () => {
        setSearchTerm('');
        setSelectedType('');
        setSelectedService('');
        setSelectedAssurance('');
        setRadius(10);
        setOpenNow(false);
        setSearchResults([]);
        setResultsError(null);
    };

    // ******************************************************
    // GESTION DU CLIC "VOIR SUR LA CARTE" POUR UNE STRUCTURE
    // ******************************************************
    const handleViewOnMapClick = (structure) => {
        const params = new URLSearchParams();
        if (structure.latitude != null) params.append('lat', String(structure.latitude));
        if (structure.longitude != null) params.append('lng', String(structure.longitude));
        if (structure.id_structure != null) params.append('id', String(structure.id_structure));
        if (structure.nom_structure) params.append('name', structure.nom_structure);
        if (structure.adresse) params.append('address', structure.adresse);
        if (structure.ville) params.append('ville', structure.ville);

        navigate(`/map?${params.toString()}`);
    };

    // ******************************************************
    // GESTION DU CLIC "VOIR TOUT SUR LA CARTE"
    // ******************************************************
    const handleViewAllOnMapClick = () => {
        if (searchResults.length > 0) {
            const validStructuresForMap = searchResults
                .filter(s => s.latitude != null && s.longitude != null && typeof s.latitude === 'number' && typeof s.longitude === 'number')
                .map(s => ({
                    id_structure: s.id_structure,
                    latitude: s.latitude,
                    longitude: s.longitude,
                    nom_structure: s.nom_structure,
                    adresse: s.adresse,
                    ville: s.ville,
                }));

            if (validStructuresForMap.length === 0) {
                alert("Aucune des structures trouvées n'a de coordonnées valides pour l'affichage sur la carte.");
                return;
            }

            const params = new URLSearchParams();
            params.append('structures', JSON.stringify(validStructuresForMap));

            if (userLocation && userLocation.latitude != null && userLocation.longitude != null) {
                params.append('userLat', String(userLocation.latitude));
                params.append('userLng', String(userLocation.longitude));
            }
            navigate(`/map?${params.toString()}`);
        } else {
            alert("Veuillez effectuer une recherche pour afficher des structures sur la carte.");
        }
    };

    // Obtenir le composant icône pour le type de structure sélectionné
    const SelectedTypeIcon = selectedType
        ? getIconComponent(structureTypes.find(type => type.value === selectedType)?.icon_name)
        : Building2;

    // ******************************************************
    // RENDU DU COMPOSANT
    // ******************************************************
    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8">
                {/* Section Filtres de recherche */}
                <section className="bg-white rounded-lg shadow-md p-6 mb-8 w-full max-w-4xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-filter mr-2">
                                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                            </svg>
                            Filtres de recherche
                        </h2>
                        <button
                            onClick={handleResetFilters}
                            className="text-red-500 hover:text-red-700 flex items-center text-sm font-medium"
                        >
                            <XCircle size={16} className="mr-1" />
                            Réinitialiser
                        </button>
                    </div>

                    {loadingFilters ? (
                        <p className="text-gray-600 text-center py-4">Chargement des filtres...</p>
                    ) : filterError ? (
                        <div className="text-red-500 text-center py-4">
                            <p>Erreur de chargement des filtres: {filterError}</p>
                            <p className="text-sm mt-2">Les filtres par défaut sont utilisés.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSearch} className="space-y-6">
                            {/* Barre de recherche principale */}
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Rechercher par nom, ville..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Type de structure */}
                                <div className="relative">
                                    <label htmlFor="structureType" className="block text-sm font-medium text-gray-700 mb-1">
                                        Type de structure
                                    </label>
                                    <div className="relative">
                                        <SelectedTypeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                        <select
                                            id="structureType"
                                            value={selectedType}
                                            onChange={(e) => setSelectedType(e.target.value)}
                                            className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none bg-white"
                                        >
                                            {structureTypes.map((type) => (
                                                <option key={type.value} value={type.value}>
                                                    {type.label}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Services proposés */}
                                <div className="relative">
                                    <label htmlFor="services" className="block text-sm font-medium text-gray-700 mb-1">
                                        Services proposés
                                    </label>
                                    <div className="relative">
                                        <select
                                            id="services"
                                            value={selectedService}
                                            onChange={(e) => setSelectedService(e.target.value)}
                                            className="w-full px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none bg-white"
                                        >
                                            {availableServices.map((service) => (
                                                <option key={service.value} value={service.value}>
                                                    {service.label}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Compagnies d'assurance */}
                                <div className="relative">
                                    <label htmlFor="assurances" className="block text-sm font-medium text-gray-700 mb-1">
                                        Compagnies d'assurance
                                    </label>
                                    <div className="relative">
                                        <select
                                            id="assurances"
                                            value={selectedAssurance}
                                            onChange={(e) => setSelectedAssurance(e.target.value)}
                                            className="w-full px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none bg-white"
                                        >
                                            {availableAssurances.map((assurance) => (
                                                <option key={assurance.value} value={assurance.value}>
                                                    {assurance.label}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center space-x-6">
                                {/* Ouvert maintenant */}
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={openNow}
                                        onChange={(e) => setOpenNow(e.target.checked)}
                                        className="form-checkbox h-4 w-4 text-green-600 rounded"
                                    />
                                    <span className="ml-2 text-gray-700">Ouvert maintenant</span>
                                </label>

                                {/* Distance Max */}
                                <div className="flex-grow">
                                    <label htmlFor="radius" className="block text-sm font-medium text-gray-700 mb-1">
                                        Distance Max: <span className="font-semibold">{radius} km</span>
                                    </label>
                                    <input
                                        type="range"
                                        id="radius"
                                        min="1"
                                        max="100"
                                        value={radius}
                                        onChange={(e) => setRadius(parseInt(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-green-600 text-white py-3 rounded-lg flex items-center justify-center hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200"
                                disabled={loadingResults}
                            >
                                <Search size={20} className="mr-2" />
                                {loadingResults ? 'Recherche en cours...' : 'Appliquer les filtres'}
                            </button>
                        </form>
                    )}
                </section>

                {/* Section Résultats de la recherche */}
                <section className="bg-white rounded-lg shadow-md p-6 w-full max-w-4xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-semibold text-gray-800">
                            Résultats de la recherche
                            {searchResults.length > 0 && (
                                <span className="text-sm text-gray-600 ml-2">({searchResults.length} résultat{searchResults.length > 1 ? 's' : ''})</span>
                            )}
                        </h3>
                        {searchResults.length > 0 && (
                            <button
                                onClick={handleViewAllOnMapClick}
                                className="bg-blue-500 text-white py-2 px-4 rounded-lg flex items-center hover:bg-blue-600 transition-colors duration-200"
                            >
                                <MapPin size={20} className="mr-2" />
                                Afficher tout sur la carte
                            </button>
                        )}
                    </div>

                    {resultsError && (
                        <div className="text-red-500 text-center py-4 bg-red-50 border border-red-200 rounded-lg">
                            {resultsError}
                        </div>
                    )}

                    {!loadingResults && searchResults.length === 0 && !resultsError && (
                        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg text-center flex items-center justify-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-info">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M12 16v-4"/>
                                <path d="M12 8h.01"/>
                            </svg>
                            <span>Aucune structure trouvée pour vos critères. Essayez de modifier vos filtres.</span>
                        </div>
                    )}

                    {loadingResults ? (
                        <div className="text-gray-600 text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
                            Chargement des résultats...
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {searchResults.map((structure) => (
                                <div
                                key={structure.id_structure || structure.id}
                                className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 p-5 flex flex-col justify-between"
                                >
                                <div>
                                    {/* Nom de la structure */}
                                    <h4 className="text-xl font-semibold text-gray-800 mb-1">
                                    {structure.nom_structure || structure.nom || 'Structure sans nom'}
                                    </h4>

                                    {structure.type_structure && (
                                        <div className="text-sm text-gray-500 mb-2">
                                            🏥 <span className="font-medium">Type :</span>{' '}
                                            {structure.type_structure
                                            .replace(/_/g, ' ')
                                            .replace(/^\w/, c => c.toUpperCase())}
                                        </div>
                                        )}

                                    {/* Adresse complète */}
                                    <p className="text-sm text-gray-600 flex items-center mb-1">
                                    <MapPin size={16} className="mr-1 text-gray-400" />
                                    {structure.adresse || 'Adresse inconnue'}
                                    {structure.ville && `, ${structure.ville}`}
                                    </p>

                                    {/* Numéro de téléphone */}
                                    {structure.telephone_principal && (
                                    <p className="text-sm text-gray-600 flex items-center mb-1">
                                        📞 <span className="ml-1">{structure.telephone_principal}</span>
                                    </p>
                                    )}

                                    {/* Site web (optionnel) */}
                                    {structure.site_web && (
                                    <p className="text-sm text-blue-600 underline mb-1">
                                        🌐 <a href={structure.site_web} target="_blank" rel="noopener noreferrer">
                                        {structure.site_web.replace(/^https?:\/\//, '')}
                                        </a>
                                    </p>
                                    )}
                                </div>

                                {/* Bouton d'action */}
                                <div className="mt-4 flex justify-end">
                                    {structure.latitude != null && structure.longitude != null &&
                                     typeof structure.latitude === 'number' && typeof structure.longitude === 'number' && (
                                        <button
                                        onClick={() => handleViewOnMapClick(structure)}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1"
                                        >
                                        <MapPin size={16} />
                                        Voir sur la carte
                                        </button>
                                    )}
                                </div>
                                </div>
                            ))}
                            </div>
                    )}
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default SearchResultsPage;