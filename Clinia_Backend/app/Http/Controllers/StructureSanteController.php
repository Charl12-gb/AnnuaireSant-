<?php

namespace App\Http\Controllers;

use App\Models\StructureSante;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class StructureSanteController extends Controller
{
    public const VALID_STRUCTURE_TYPES = [
        'pharmacie',
        'hopital',
        'laboratoire',
        'clinique',
        'centre_medical',
        'veterinaire',
        'centre_reeducation',
        'cabinet_dentaire',
        'cabinet_neurologie',
        'autre',
        // Ajoutez 'cabinet_imagerie' et 'ambulance' ici si ces types existent réellement dans votre base de données
        // S'ils ne sont que côté frontend, ils compteront 0, ce qui est normal.
        'cabinet_imagerie', 
        'ambulance' 
    ];

    public function index(Request $request)
    {
        $query = StructureSante::with(['services', 'assurances', 'evaluations'])
            ->where('statut_verification', 'verifie');

        if ($request->has('type') && $request->input('type') !== 'toutes') {
            if (in_array($request->input('type'), self::VALID_STRUCTURE_TYPES)) {
                $query->where('type_structure', $request->input('type'));
            }
        }

        $query->orderBy('nom_structure', 'asc');

        $structures = $query->get();

        return response()->json([
            'status' => true,
            'structures' => $structures,
        ], 200);
    }

    public function show($id_structure)
    {
        $structure = StructureSante::with(['services', 'assurances', 'evaluations', 'produitsEnStock'])
            ->where('statut_verification', 'verifie')
            ->find($id_structure);

        if (!$structure) {
            return response()->json([
                'message' => 'Structure de santé non trouvée ou non vérifiée.',
            ], 404);
        }

        return response()->json([
            'status' => true,
            'structure' => $structure,
        ], 200);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nom_structure' => 'required|string|max:255',
            'type_structure' => 'required|string|in:' . implode(',', self::VALID_STRUCTURE_TYPES),
            'adresse' => 'required|string|max:255',
            'quartier' => 'nullable|string|max:255',
            'ville' => 'nullable|string|max:255',
            'commune' => 'nullable|string|max:255',
            'departement' => 'nullable|string|max:255',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'telephone_principal' => 'required|string|max:50',
            'telephone_secondaire' => 'nullable|string|max:50',
            'email_contact' => 'required|string|email|max:255|unique:structures_santes,email_contact',
            'site_web' => 'nullable|string|url|max:255',
            'horaires_ouverture' => 'nullable|json',
            'est_de_garde' => 'boolean',
            'periode_garde_debut' => 'nullable|date',
            'periode_garde_fin' => 'nullable|date|after_or_equal:periode_garde_debut',
            'description' => 'nullable|string',
            'assurances.*' => 'exists:compagnies_assurances,id_assurance',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Erreurs de validation.',
                'errors' => $validator->errors(),
            ], 400);
        }

        $data = $validator->validated();

        DB::beginTransaction();
        try {
            $structure = StructureSante::create($data);
            DB::commit();
            return response()->json([
                'status' => true,
                'message' => 'Structure de santé créée avec succès.',
                'structure' => $structure,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => false,
                'message' => 'Erreur lors de la création de la structure.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, $id_structure)
    {
        $structure = StructureSante::find($id_structure);

        if (!$structure) {
            return response()->json([
                'status' => false,
                'message' => 'Structure de santé non trouvée.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            // Incluez toutes les règles de validation pour les champs modifiables
            // Par exemple, pour les assurances:
            'nom_structure' => 'sometimes|string|max:255',
            'type_structure' => 'sometimes|string|in:' . implode(',', self::VALID_STRUCTURE_TYPES),
            'adresse' => 'sometimes|string|max:255',
            'quartier' => 'nullable|string|max:255',
            'ville' => 'nullable|string|max:255',
            'commune' => 'nullable|string|max:255',
            'departement' => 'nullable|string|max:255',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'telephone_principal' => 'sometimes|string|max:50',
            'telephone_secondaire' => 'nullable|string|max:50',
            // L'email unique doit exclure l'email de la structure actuelle
            'email_contact' => 'sometimes|string|email|max:255|unique:structures_santes,email_contact,' . $id_structure . ',id_structure',
            'site_web' => 'nullable|string|url|max:255',
            'horaires_ouverture' => 'nullable|json',
            'est_de_garde' => 'sometimes|boolean',
            'periode_garde_debut' => 'nullable|date',
            'periode_garde_fin' => 'nullable|date|after_or_equal:periode_garde_debut',
            'description' => 'nullable|string',
            'assurances.*' => 'exists:compagnies_assurances,id_assurance',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Erreurs de validation.',
                'errors' => $validator->errors(),
            ], 400);
        }

        $validatedData = $validator->validated();

        DB::beginTransaction();
        try {
            $structure->update($validatedData);
            // Si vous avez une relation Many-to-Many avec les assurances
            // et que vous voulez la synchroniser ici:
            if (isset($validatedData['assurances'])) {
                $structure->assurances()->sync($validatedData['assurances']);
            }
            DB::commit();
            return response()->json([
                'status' => true,
                'message' => 'Structure mise à jour avec succès.',
                'structure' => $structure,
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => false,
                'message' => 'Erreur lors de la mise à jour de la structure.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy($id_structure)
    {
        $structure = StructureSante::find($id_structure);

        if (!$structure) {
            return response()->json([
                'status' => false,
                'message' => 'Structure de santé non trouvée.',
            ], 404);
        }

        DB::beginTransaction();
        try {
            $structure->delete();
            DB::commit();
            return response()->json([
                'status' => true,
                'message' => 'Structure supprimée avec succès.',
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => false,
                'message' => 'Erreur lors de la suppression de la structure.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

public function search(Request $request)
{
    $query = StructureSante::query()->with(['services', 'assurances', 'evaluations']);

    // Filtre par type (ex: laboratoire)
    if ($request->filled('type')) {
        $query->where('type_structure', $request->input('type'));
    }

    // Recherche par ville, commune, quartier ou nom
    if ($request->filled('search')) {
        $searchTerm = $request->input('search');
        $query->where(function ($q) use ($searchTerm) {
            $q->where('ville', 'like', "%$searchTerm%")
              ->orWhere('commune', 'like', "%$searchTerm%")
              ->orWhere('quartier', 'like', "%$searchTerm%")
              ->orWhere('nom_structure', 'like', "%$searchTerm%");
        });
    }

    // Filtre par service (ex: "Radiologie et Imagerie")
    if ($request->filled('service')) {
        $serviceName = $request->input('service');
        $query->whereHas('services', function ($q) use ($serviceName) {
            $q->where('nom_service', 'like', "%$serviceName%");
        });
    }

    // Filtre par assurance (ex: "GSA - Générale des Assurances")
    if ($request->filled('assurance')) {
        $assuranceName = $request->input('assurance');
        $query->whereHas('assurances', function ($q) use ($assuranceName) {
            $q->where('nom_assurance', 'like', "%$assuranceName%");
        });
    }

    // Filtre "ouvert maintenant"
    if ($request->boolean('open_now')) {
        $now = now();
        $day = strtolower($now->format('l')); // e.g. "monday"
        $hour = $now->format('H:i');
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            $query->whereRaw("(horaires_ouverture->?->>'ouvert') = 'true'", [$day])
                ->whereRaw("(horaires_ouverture->?->>'heure_ouverture') <= ?", [$day, $hour])
                ->whereRaw("(horaires_ouverture->?->>'heure_fermeture') >= ?", [$day, $hour]);
        } elseif ($driver === 'mysql') {
            $query->whereJsonContains("horaires_ouverture->{$day}.ouvert", true)
                ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(horaires_ouverture, '$.$day.heure_ouverture')) <= ?", [$hour])
                ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(horaires_ouverture, '$.$day.heure_fermeture')) >= ?", [$hour]);
        }
    }

    // Filtre par distance et géolocalisation (optionnel)
    if ($request->filled(['latitude', 'longitude', 'distance'])) {
        $lat = $request->input('latitude');
        $lng = $request->input('longitude');
        $distance = $request->input('distance');

        $query->selectRaw('structures_santes.*, 
            (6371 * acos(cos(radians(?)) * cos(radians(latitude)) 
            * cos(radians(longitude) - radians(?)) 
            + sin(radians(?)) * sin(radians(latitude)))) AS distance', [$lat, $lng, $lat])
            ->having('distance', '<=', $distance)
            ->orderBy('distance');
    }

    // Limite des résultats (par défaut : 10)
    $limit = $request->integer('limit', 10);
    $structures = $query->limit($limit)->get();

    return response()->json([
        'structures' => $structures
    ]);
}

    /**
     * Retourne le nombre de structures par type.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getStructuresCounts()
    {
        try {
            // Groupement par type de structure et comptage
            $counts = StructureSante::select('type_structure', DB::raw('count(*) as total'))
                                    ->where('statut_verification', 'verifie') // Assurez-vous de ne compter que les vérifiées si c'est la règle
                                    ->groupBy('type_structure')
                                    ->pluck('total', 'type_structure')
                                    ->toArray();

            // S'assurer que tous les types valides sont présents, même avec un compte de 0
            foreach (self::VALID_STRUCTURE_TYPES as $type) {
                if (!isset($counts[$type])) {
                    $counts[$type] = 0;
                }
            }

            return response()->json([
                'status' => true,
                'counts' => $counts,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Erreur lors de la récupération des comptes de structures.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }


    private function calculateDistance($lat1, $lon1, $lat2, $lon2)
    {
        $earthRadius = 6371; // Rayon de la Terre en kilomètres

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($dLon / 2) * sin($dLon / 2);
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c; // Distance en kilomètres
    }
}