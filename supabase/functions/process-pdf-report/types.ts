export interface Measurements {
  [key: string]: any;
  total_area?: number;
  predominant_pitch?: string;
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