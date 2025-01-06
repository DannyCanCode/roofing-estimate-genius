export interface RoofMeasurements {
  total_area: number;
  pitch: number;
  roof_type: string;
  waste_percentage?: number;
  property_address?: string;
  pitch_breakdown?: { pitch: string; area: number }[];
  ridges_length?: number;
  valleys_length?: number;
  rakes_length?: number;
  eaves_length?: number;
  number_of_stories?: number;
  total_facets?: number;
  total_penetrations?: number;
  penetrations_perimeter?: number;
  penetrations_area?: number;
}

export interface PageContent {
  text: string;
}