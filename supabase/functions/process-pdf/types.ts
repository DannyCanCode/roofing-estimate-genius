export interface WasteTableEntry {
  percentage: number;
  area: number;
  is_suggested: boolean;
}

export interface Measurements {
  [key: string]: any;
  total_area?: number;
  predominant_pitch?: string;
  suggested_waste_percentage?: number;
  number_of_stories?: number;
  ridges?: { length: number; count: number };
  hips?: { length: number; count: number };
  valleys?: { length: number; count: number };
  rakes?: { length: number; count: number };
  eaves?: { length: number; count: number };
  waste_table?: WasteTableEntry[];
}

export interface DebugInfo {
  matched_patterns: Record<string, boolean>;
  text_samples: Record<string, string>;
  validation_errors: Record<string, string>;
}

export interface ExtractionResult {
  measurements: Measurements;
  debugInfo: DebugInfo;
}