export interface Measurements {
  totalArea: number;
  totalSquares: number;
  predominantPitch: string;
  ridgesLength: number;
  ridgesCount: number;
  hipsLength: number;
  hipsCount: number;
  valleysLength: number;
  valleysCount: number;
  rakesLength: number;
  rakesCount: number;
  eavesLength: number;
  eavesCount: number;
  dripEdgeLength: number;
  flashingLength: number;
  flashingCount: number;
  stepFlashingLength: number;
  stepFlashingCount: number;
  totalPenetrationsArea: number;
  suggestedWaste: number;
  wasteFactorArea: number;
  wasteFactorSquares: number;
  areasPerPitch: Record<string, number>;
  roofingType: string;
  structureComplexity: string;
  wasteNote: string;
}

export interface ProcessingResult {
  measurements: Measurements;
  metadata: {
    original_filename: string;
    page_count: number;
    processing_time: number;
  };
}