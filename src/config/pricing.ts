export const PRICING = {
  MATERIALS: {
    shingles: 152.10, // GAF Timberline HDZ SG Shingles per square
    ridgeCap: 66.41,  // GAF Seal-A-Ridge per bundle
    starterStrip: 63.25, // GAF ProStart per box
    underlayment: 104.94, // GAF FeltBuster per roll (10 squares)
    iceAndWater: 117.50, // per roll (2 squares)
    dripEdge: 7.50,   // per 10' piece
    nails: 66.69,     // per box (4500 count)
    plumbingBoots: 53.75, // each (3")
    plywood: 21.80    // per board
  },
  LABOR_RATES: {
    '4/12-7/12': 100.00,
    '8/12-9/12': 110.00,
    '10/12-12/12': 150.00,
    '13/12-16/12': 171.68,
    'flat': 85.00     // for 0/12 pitch
  },
  ADDITIONAL_CHARGES: {
    twoStory: 10.90,  // per square
    tripCharge: 327.00, // flat rate
    keepGutters: 1.38,  // per square
    flashing: 5.45,     // per unit
    dumpster: 687.50,   // 12 yard
    permitsAndInspections: 2500.00
  },
  FLAT_ROOF: {
    baseCap: 75.00,   // per square
    iso: 45.00        // per square
  }
}

export function calculateEstimate(measurements: {
  totalRoofArea: number,
  flatArea?: number,
  predominantPitch?: number,
  numberOfStories?: number,
  wasteFactor?: number
}, profitMargin: number = 25) {
  
  const flatArea = measurements.flatArea || 0
  const pitch = measurements.predominantPitch || 4
  const stories = measurements.numberOfStories || 1
  const wasteFactor = Math.max(measurements.wasteFactor || 12, 12) / 100

  // Calculate squares needed with waste factor
  const totalSquares = Math.ceil((measurements.totalRoofArea - flatArea) / 100 * (1 + wasteFactor))
  const flatSquares = Math.ceil(flatArea / 100 * (1 + wasteFactor))

  // Determine labor rate based on pitch
  let laborRate = PRICING.LABOR_RATES['4/12-7/12']
  if (pitch >= 13) laborRate = PRICING.LABOR_RATES['13/12-16/12']
  else if (pitch >= 10) laborRate = PRICING.LABOR_RATES['10/12-12/12']
  else if (pitch >= 8) laborRate = PRICING.LABOR_RATES['8/12-9/12']

  const calculatedPricing = {
    // Sloped roof materials
    shingles: totalSquares * PRICING.MATERIALS.shingles,
    underlayment: Math.ceil(totalSquares / 10) * PRICING.MATERIALS.underlayment,
    iceAndWater: Math.ceil(totalSquares / 2) * PRICING.MATERIALS.iceAndWater,
    
    // Flat roof materials (if any)
    flatRoofMaterials: flatSquares * (PRICING.FLAT_ROOF.baseCap + PRICING.FLAT_ROOF.iso),
    
    // Labor costs
    slopedRoofLabor: totalSquares * laborRate,
    flatRoofLabor: flatSquares * PRICING.LABOR_RATES.flat,
    
    // Additional charges
    twoStoryCharge: stories > 1 ? (totalSquares + flatSquares) * PRICING.ADDITIONAL_CHARGES.twoStory : 0,
    tripCharge: PRICING.ADDITIONAL_CHARGES.tripCharge,
    dumpster: PRICING.ADDITIONAL_CHARGES.dumpster,
    permitsAndInspections: PRICING.ADDITIONAL_CHARGES.permitsAndInspections,
  }

  // Calculate totals
  const subtotal = Object.values(calculatedPricing).reduce((a, b) => a + b, 0)
  const profitAmount = subtotal * (profitMargin / 100)
  const total = subtotal + profitAmount

  return {
    ...calculatedPricing,
    subtotal,
    profitAmount,
    total,
    details: {
      totalSquares,
      flatSquares,
      wasteFactor: wasteFactor * 100,
      laborRate,
      stories
    }
  }
} 