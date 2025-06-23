<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\StructureSante;

class TypeStructureController extends Controller
{
    public function index()
    {
        $types = StructureSante::VALID_STRUCTURE_TYPES;

        $formattedTypes = [];
        foreach ($types as $type) {
            $label = ucfirst(str_replace('_', ' ', $type));
            $formattedTypes[] = [
                'value' => $type,
                'label' => $label,
            ];
        }

        return response()->json([
            'status' => true,
            'message' => 'Types de structure récupérés avec succès.',
            'data' => $formattedTypes,
        ], 200);
    }
}
