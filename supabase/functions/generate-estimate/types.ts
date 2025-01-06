export interface EstimateParams {
  measurements: {
    totalArea: number;
    pitchBreakdown: Array<{ pitch: string; area: number }>;
    suggestedWaste?: number;
  };
  profitMargin: number;
  roofingCategory: string;
}

export interface Material {
  name: string;
  basePrice: number;
  unit: string;
  quantity: number;
  total: number;
}

export interface Labor {
  pitch: string;
  rate: number;
  area: number;
  total: number;
}

export interface EstimateResult {
  materials: Material[];
  labor: Labor[];
  profitMargin: number;
  totalMaterialCost: number;
  totalLaborCost: number;
  totalCost: number;
  totalPrice: number;
  category: string;
}