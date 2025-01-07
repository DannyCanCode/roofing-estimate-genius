import { PRICING } from '@/config/pricing';

export const calculateEstimateItems = (measurements: any) => {
  if (!measurements.total_area) return [];

  const totalArea = parseFloat(measurements.total_area.toString().replace(/,/g, ''));
  const pitch = measurements.predominant_pitch ? parseInt(measurements.predominant_pitch) : 4;
  const wasteFactor = measurements.suggested_waste_percentage || 15;
  
  const squares = Math.ceil(totalArea / 100 * (1 + wasteFactor/100));

  let laborRate = PRICING.LABOR_RATES['4/12-7/12'];
  if (pitch >= 13) laborRate = PRICING.LABOR_RATES['13/12-16/12'];
  else if (pitch >= 10) laborRate = PRICING.LABOR_RATES['10/12-12/12'];
  else if (pitch >= 8) laborRate = PRICING.LABOR_RATES['8/12-9/12'];

  return [
    {
      description: `Roofing Material`,
      quantity: squares,
      unit: 'sq ft',
      unitPrice: PRICING.MATERIALS.shingles,
      total: squares * PRICING.MATERIALS.shingles
    },
    {
      description: 'Underlayment',
      quantity: totalArea,
      unit: 'sq ft',
      unitPrice: 0.45,
      total: totalArea * 0.45
    },
    {
      description: 'Starter Strip',
      quantity: totalArea,
      unit: 'sq ft',
      unitPrice: 0.30,
      total: totalArea * 0.30
    },
    {
      description: 'Ridge Caps',
      quantity: totalArea,
      unit: 'sq ft',
      unitPrice: 0.25,
      total: totalArea * 0.25
    },
    {
      description: 'Nails/Fasteners',
      quantity: totalArea,
      unit: 'sq ft',
      unitPrice: 0.15,
      total: totalArea * 0.15
    },
    {
      description: `Labor for ${pitch}/12 pitch`,
      quantity: totalArea,
      unit: 'sq ft',
      unitPrice: laborRate,
      total: totalArea * laborRate
    }
  ];
};