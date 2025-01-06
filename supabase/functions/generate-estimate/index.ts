import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Material pricing data (per square foot)
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

// Labor rates per square foot based on pitch
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

function calculateMaterials(totalArea: number, roofingCategory: string, wastePercentage: number) {
  if (!MATERIAL_PRICES[roofingCategory]) {
    throw new Error(`Invalid roofing category: ${roofingCategory}`);
  }

  const prices = MATERIAL_PRICES[roofingCategory];
  const areaWithWaste = totalArea * (1 + wastePercentage / 100);
  
  const materials = [];
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
    const fastenersCost = totalArea * prices.fasteners;
    const trimCost = totalArea * prices.trim;
    const sealantCost = totalArea * prices.sealant;
    
    materials.push(
      {
        name: "Fasteners",
        basePrice: prices.fasteners,
        unit: "sq ft",
        quantity: totalArea,
        total: fastenersCost
      },
      {
        name: "Trim",
        basePrice: prices.trim,
        unit: "sq ft",
        quantity: totalArea,
        total: trimCost
      },
      {
        name: "Sealant",
        basePrice: prices.sealant,
        unit: "sq ft",
        quantity: totalArea,
        total: sealantCost
      }
    );
    totalMaterialCost += fastenersCost + trimCost + sealantCost;
  } else {
    const starterCost = totalArea * prices.starter;
    const ridgeCost = totalArea * prices.ridge;
    const nailsCost = totalArea * prices.nails;
    
    materials.push(
      {
        name: "Starter Strip",
        basePrice: prices.starter,
        unit: "sq ft",
        quantity: totalArea,
        total: starterCost
      },
      {
        name: "Ridge Caps",
        basePrice: prices.ridge,
        unit: "sq ft",
        quantity: totalArea,
        total: ridgeCost
      },
      {
        name: "Nails/Fasteners",
        basePrice: prices.nails,
        unit: "sq ft",
        quantity: totalArea,
        total: nailsCost
      }
    );
    totalMaterialCost += starterCost + ridgeCost + nailsCost;
  }

  return { materials, totalMaterialCost };
}

function calculateLabor(pitchBreakdown: Array<{ pitch: string; area: number }>) {
  if (!Array.isArray(pitchBreakdown)) {
    throw new Error("Invalid pitch breakdown format");
  }

  const labor = pitchBreakdown.map(({ pitch, area }) => {
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { measurements, profitMargin, roofingCategory } = await req.json();
    console.log('Received request:', { measurements, profitMargin, roofingCategory });

    // Validate required fields
    if (!measurements?.totalArea || !roofingCategory || typeof profitMargin !== 'number') {
      throw new Error("Missing required fields: measurements.totalArea, roofingCategory, or profitMargin");
    }

    // Validate pitch breakdown
    if (!Array.isArray(measurements.pitchBreakdown)) {
      throw new Error("Invalid or missing pitch breakdown");
    }

    // Calculate materials cost
    const { materials, totalMaterialCost } = calculateMaterials(
      measurements.totalArea,
      roofingCategory,
      measurements.suggestedWaste || 12
    );

    // Calculate labor cost
    const { labor, totalLaborCost } = calculateLabor(measurements.pitchBreakdown);

    // Calculate total cost and price with profit margin
    const totalCost = totalMaterialCost + totalLaborCost;
    const profitAmount = totalCost * (profitMargin / 100);
    const totalPrice = totalCost + profitAmount;

    const estimate = {
      materials,
      labor,
      profitMargin,
      totalMaterialCost,
      totalLaborCost,
      totalCost,
      totalPrice,
      category: roofingCategory
    };

    console.log('Generated estimate:', estimate);

    return new Response(
      JSON.stringify(estimate),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );
  } catch (error) {
    console.error('Error generating estimate:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      }
    );
  }
});