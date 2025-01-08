import { PRICING } from '@/config/pricing';

export const calculateEstimateItems = (measurements: any) => {
  if (!measurements.total_area) return [];

  const totalArea = parseFloat(measurements.total_area.toString().replace(/,/g, ''));
  const pitch = measurements.predominant_pitch ? parseInt(measurements.predominant_pitch) : 4;
  const wasteFactor = measurements.suggested_waste_percentage || 15;
  const numberOfStories = measurements.number_of_stories || 1;
  
  // Calculate squares needed (including waste factor)
  const squares = Math.ceil(totalArea / 100 * (1 + wasteFactor/100));
  
  // Calculate labor rate based on pitch
  let laborRate = PRICING.LABOR_RATES['4/12-7/12']; // Default labor rate
  if (pitch >= 13) {
    laborRate = PRICING.LABOR_RATES['13/12-16/12'];
  } else if (pitch >= 10) {
    laborRate = PRICING.LABOR_RATES['10/12-12/12'];
  } else if (pitch >= 8) {
    laborRate = PRICING.LABOR_RATES['8/12-9/12'];
  }

  // Add two-story charge if applicable
  if (numberOfStories > 1) {
    laborRate += PRICING.ADDITIONAL_CHARGES.twoStory;
  }

  const items = [
    {
      description: 'GAF Timberline HDZ SG Shingles',
      quantity: squares,
      unit: 'squares',
      unit_price: PRICING.MATERIALS.shingles,
      total: squares * PRICING.MATERIALS.shingles
    },
    {
      description: 'Underlayment (GAF FeltBuster)',
      quantity: Math.ceil(squares / 10), // Each roll covers 10 squares
      unit: 'rolls',
      unit_price: PRICING.MATERIALS.underlayment,
      total: Math.ceil(squares / 10) * PRICING.MATERIALS.underlayment
    },
    {
      description: 'Starter Strip (GAF ProStart)',
      quantity: Math.ceil((measurements.rakes?.length || 0) / 120), // 120 linear feet per box
      unit: 'boxes',
      unit_price: PRICING.MATERIALS.starterStrip,
      total: Math.ceil((measurements.rakes?.length || 0) / 120) * PRICING.MATERIALS.starterStrip
    },
    {
      description: 'Ridge Caps (GAF Seal-A-Ridge)',
      quantity: Math.ceil((measurements.ridges?.length || 0) / 25), // 25 linear feet per bundle
      unit: 'bundles',
      unit_price: PRICING.MATERIALS.ridgeCaps,
      total: Math.ceil((measurements.ridges?.length || 0) / 25) * PRICING.MATERIALS.ridgeCaps
    },
    {
      description: 'Drip Edge',
      quantity: Math.ceil((measurements.eaves?.length || 0) / 10), // 10' pieces
      unit: 'pieces',
      unit_price: PRICING.MATERIALS.dripEdge,
      total: Math.ceil((measurements.eaves?.length || 0) / 10) * PRICING.MATERIALS.dripEdge
    },
    {
      description: 'Roofing Nails',
      quantity: Math.ceil(squares / 3), // One box per 3 squares
      unit: 'boxes',
      unit_price: PRICING.MATERIALS.nails,
      total: Math.ceil(squares / 3) * PRICING.MATERIALS.nails
    },
    {
      description: 'Dumpster (12 yard)',
      quantity: 1,
      unit: 'unit',
      unit_price: PRICING.MATERIALS.dumpster,
      total: PRICING.MATERIALS.dumpster
    },
    {
      description: 'Permits and Inspections',
      quantity: 1,
      unit: 'unit',
      unit_price: PRICING.MATERIALS.permits,
      total: PRICING.MATERIALS.permits
    },
    {
      description: `Labor for ${pitch}/12 pitch`,
      quantity: squares,
      unit: 'squares',
      unit_price: laborRate,
      total: squares * laborRate
    },
    {
      description: 'Trip Charge',
      quantity: 1,
      unit: 'flat rate',
      unit_price: PRICING.ADDITIONAL_CHARGES.tripCharge,
      total: PRICING.ADDITIONAL_CHARGES.tripCharge
    }
  ];

  // Add Ice & Water Shield if needed (valleys, eaves, etc.)
  const iceAndWaterArea = ((measurements.valleys?.length || 0) * 6 + 
                          (measurements.eaves?.length || 0) * 3) / 144; // Convert to squares
  if (iceAndWaterArea > 0) {
    items.push({
      description: 'Ice & Water Shield',
      quantity: Math.ceil(iceAndWaterArea / 2), // Each roll covers 2 squares
      unit: 'rolls',
      unit_price: PRICING.MATERIALS.iceAndWater,
      total: Math.ceil(iceAndWaterArea / 2) * PRICING.MATERIALS.iceAndWater
    });
  }

  return items;
};