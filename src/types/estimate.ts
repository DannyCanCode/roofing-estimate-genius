export interface RoofMeasurements {
  totalArea: number;
  pitchBreakdown: {
    pitch: string;
    area: number;
  }[];
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
  unitPrice: number;
  total: number;
}

export interface Estimate {
  materials: Material[];
  labor: Labor[];
  profitMargin: number;
  totalCost: number;
  totalPrice: number;
}