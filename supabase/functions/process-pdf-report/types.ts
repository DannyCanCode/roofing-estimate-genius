export interface Measurements {
  total_area: number;
  pitch: number;
  roof_type: string;
  waste_percentage?: number;
  property_address?: string;
  pitch_breakdown?: { pitch: string; area: number }[];
}

export interface ProcessingResult {
  measurements: Measurements;
  metadata: {
    original_filename: string;
    page_count: number;
    processing_time: number;
  };
}