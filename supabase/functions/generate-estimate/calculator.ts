import { EstimateParams, EstimateResult, Material, Labor } from './types.ts';

const MATERIAL_PRICES = {
  SHINGLE: {
    base: 4.50,
    underlayment: 0.45,
    starter: 0.30,
    ridge: 0.25,
    nails: 0.15,
  },
  TILE: {
    base: 8.75,
    underlayment: 0.65,
    starter: 0.45,
    ridge: 0.35,
    nails: 0.20,
  },
  METAL: {
    base: 7.25,
    underlayment: 0.55,
    fasteners: 0.25,
    trim: 0.45,
    sealant: 0.15,
  }
};

const LABOR_RATES = {
  "2/12": 2.25,
  "3/12": 2.50,
  "4/12": 2.75,
  "5/12": 3.00,
  "6/12": 3.25,
  "7/12": 3.75,
  "8/12": 4.25,
  "9/12": 4.75,
  "10/12": 5.25,
  "11/12": 5.75,
  "12/12": 6.25,
};

export function calculateEstimate(params: EstimateParams): EstimateResult {
  console.log('Calculating estimate with params:', params);
  
  const { materials, totalMaterialCost } = calculateMaterials(
    params.measurements.totalArea,
    params.roofingCategory,
    params.measurements.suggestedWaste || 12
  );

  const { labor, totalLaborCost } = calculateLabor(params.measurements.pitchBreakdown);

  const totalCost = totalMaterialCost + totalLaborCost;
  const profitAmount = totalCost * (params.profitMargin / 100);
  const totalPrice = totalCost + profitAmount;

  return {
    materials,
    labor,
    profitMargin: params.profitMargin,
    totalMaterialCost,
    totalLaborCost,
    totalCost,
    totalPrice,
    category: params.roofingCategory
  };
}

function calculateMaterials(totalArea: number, roofingCategory: string, wastePercentage: number) {
  if (!MATERIAL_PRICES[roofingCategory]) {
    throw new Error(`Invalid roofing category: ${roofingCategory}`);
  }

  const prices = MATERIAL_PRICES[roofingCategory];
  const areaWithWaste = totalArea * (1 + wastePercentage / 100);
  
  const materials: Material[] = [];
  let totalMaterialCost = 0;

  // Add main roofing material
  const mainMaterialCost = areaWithWaste * prices.base;
  materials.push({
    name: `${roofingCategory} Material`,
    basePrice: prices.base,
    unit: "sq ft",
    quantity: areaWithWaste,
    total: mainMaterialCost
  });
  totalMaterialCost += mainMaterialCost;

  // Add underlayment
  const underlaymentCost = totalArea * prices.underlayment;
  materials.push({
    name: "Underlayment",
    basePrice: prices.underlayment,
    unit: "sq ft",
    quantity: totalArea,
    total: underlaymentCost
  });
  totalMaterialCost += underlaymentCost;

  // Add other materials based on roofing type
  if (roofingCategory === "METAL") {
    const additionalMaterials = [
      { name: "Fasteners", price: prices.fasteners },
      { name: "Trim", price: prices.trim },
      { name: "Sealant", price: prices.sealant }
    ];

    for (const material of additionalMaterials) {
      const cost = totalArea * material.price;
      materials.push({
        name: material.name,
        basePrice: material.price,
        unit: "sq ft",
        quantity: totalArea,
        total: cost
      });
      totalMaterialCost += cost;
    }
  } else {
    const additionalMaterials = [
      { name: "Starter Strip", price: prices.starter },
      { name: "Ridge Caps", price: prices.ridge },
      { name: "Nails/Fasteners", price: prices.nails }
    ];

    for (const material of additionalMaterials) {
      const cost = totalArea * material.price;
      materials.push({
        name: material.name,
        basePrice: material.price,
        unit: "sq ft",
        quantity: totalArea,
        total: cost
      });
      totalMaterialCost += cost;
    }
  }

  return { materials, totalMaterialCost };
}

function calculateLabor(pitchBreakdown: Array<{ pitch: string; area: number }>) {
  const labor: Labor[] = pitchBreakdown.map(({ pitch, area }) => {
    const rate = LABOR_RATES[pitch] || LABOR_RATES["4/12"]; // Default to 4/12 if pitch not found
    return {
      pitch,
      rate,
      area,
      total: area * rate
    };
  });

  const totalLaborCost = labor.reduce((sum, item) => sum + item.total, 0);
  return { labor, totalLaborCost };
}