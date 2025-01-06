export interface Measurements {
  total_area?: number;
  total_roof_facets?: number;
  predominant_pitch?: number;
  number_of_stories?: number;
  ridges?: { length: number; count: number };
  hips?: { length: number; count: number };
  valleys?: { length: number; count: number };
  rakes?: { length: number; count: number };
  eaves?: { length: number; count: number };
  total_penetrations?: number;
  total_penetrations_area?: number;
  waste_table?: Array<{
    percentage: number;
    area: number;
    squares: number;
    is_suggested: boolean;
  }>;
  suggested_waste_percentage?: number;
}

export interface DebugInfo {
  matched_patterns: Record<string, boolean>;
  text_samples: Record<string, string>;
  waste_table_error?: string;
}

export interface ExtractionResult {
  measurements: Measurements;
  debugInfo: DebugInfo;
}