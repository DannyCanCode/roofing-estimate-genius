export interface PitchDetail {
  pitch: string;
  area: number;
}

export interface RoofFacet {
  number: number;
  area: number;
}

export interface Measurement {
  length: number;
  count: number;
}

export interface WasteTableEntry {
  percentage: number;
  area: number;
  is_suggested: boolean;
}

export interface RoofMeasurements {
  total_area: number;
  predominant_pitch: string;
  number_of_stories?: number;
  suggested_waste_percentage?: number;
  ridges?: Measurement;
  hips?: Measurement;
  valleys?: Measurement;
  rakes?: Measurement;
  eaves?: Measurement;
  waste_table?: WasteTableEntry[];
}

export interface ProcessedPdfData {
  measurements: RoofMeasurements;
  debugInfo?: {
    matched_patterns: Record<string, boolean>;
    text_samples: Record<string, string>;
    validation_errors: Record<string, string>;
  };
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
