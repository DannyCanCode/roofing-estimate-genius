export interface PitchDetail {
  pitch: string;
  area: number;
}

export interface RoofFacet {
  number: number;
  area: number;
}

export interface RoofMeasurements {
  total_area: number;
  predominant_pitch: string;
  ridges: number;
  hips: number;
  valleys: number;
  rakes: number;
  eaves: number;
  flashing: number;
  step_flashing: number;
  pitch_details: PitchDetail[];
  facets: RoofFacet[];
  suggested_waste_percentage: number;
}

export interface ProcessedPdfData {
  measurements: {
    total_area: number;
    predominant_pitch?: string;
    suggested_waste_percentage?: number;
    // ... other measurement fields
  };
  error?: string;
  debug?: any;
}

export interface Material {
  name: string;
  basePrice: number;
  unit: string;
  quantity: number;
}

export interface Labor {
  pitch: string;
  rate: number;
  area: number;
}

export interface EstimateItem {
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;  // Changed from unitPrice to unit_price to match database schema
  total: number;
}

export type RoofingCategory = "SHINGLE" | "TILE" | "METAL";

export interface Estimate {
  materials: Material[];
  labor: Labor[];
  profitMargin: number;
  totalCost: number;
  totalPrice: number;
  category: RoofingCategory;
}
