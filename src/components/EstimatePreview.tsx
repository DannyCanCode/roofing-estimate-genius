import { useState } from 'react'

interface EstimatePreviewProps {
  measurements: {
    totalRoofArea: string | null
    predominantPitch: string | null
    wasteFactor: string | null
  }
}

const PRICING = {
  MATERIALS: {
    shingles: 152.10, // GAF Timberline HDZ SG Shingles per square
    ridgeCap: 66.41,  // GAF Seal-A-Ridge per bundle
    starterStrip: 63.25, // GAF ProStart per box
    underlayment: 104.94, // GAF FeltBuster per roll (10 squares)
    iceAndWater: 117.50, // per roll (2 squares)
  },
  LABOR_RATES: {
    '4/12-7/12': 100.00,
    '8/12-9/12': 110.00,
    '10/12-12/12': 150.00,
    '13/12-16/12': 171.68
  }
}

export function EstimatePreview({ measurements }: EstimatePreviewProps) {
  const [showExport, setShowExport] = useState(false)

  const totalArea = measurements.totalRoofArea ? parseFloat(measurements.totalRoofArea) : 0
  const pitch = measurements.predominantPitch ? parseInt(measurements.predominantPitch) : 4
  const wasteFactor = measurements.wasteFactor ? parseFloat(measurements.wasteFactor) : 15
  
  // Calculate squares needed (1 square = 100 sq ft)
  const squares = Math.ceil(totalArea / 100 * (1 + wasteFactor/100))

  // Determine labor rate based on pitch
  let laborRate = PRICING.LABOR_RATES['4/12-7/12']
  if (pitch >= 13) laborRate = PRICING.LABOR_RATES['13/12-16/12']
  else if (pitch >= 10) laborRate = PRICING.LABOR_RATES['10/12-12/12']
  else if (pitch >= 8) laborRate = PRICING.LABOR_RATES['8/12-9/12']

  const calculations = {
    materials: {
      shingles: squares * PRICING.MATERIALS.shingles,
      underlayment: Math.ceil(squares / 10) * PRICING.MATERIALS.underlayment,
      starterStrip: Math.ceil(squares / 5) * PRICING.MATERIALS.starterStrip,
      ridgeCap: Math.ceil(squares / 20) * PRICING.MATERIALS.ridgeCap,
      iceAndWater: Math.ceil(squares / 2) * PRICING.MATERIALS.iceAndWater
    },
    labor: squares * laborRate
  }

  const total = Object.values(calculations.materials).reduce((a, b) => a + b, 0) + calculations.labor

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Estimate Preview</h2>
        <button
          onClick={() => setShowExport(!showExport)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Export PDF
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Description</th>
              <th className="text-right py-2">Quantity</th>
              <th className="text-right py-2">Unit</th>
              <th className="text-right py-2">Unit Price</th>
              <th className="text-right py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-2">GAF Timberline HDZ Shingles</td>
              <td className="text-right">{squares}</td>
              <td className="text-right">squares</td>
              <td className="text-right">${PRICING.MATERIALS.shingles.toFixed(2)}</td>
              <td className="text-right">${calculations.materials.shingles.toFixed(2)}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2">GAF FeltBuster Underlayment</td>
              <td className="text-right">{Math.ceil(squares / 10)}</td>
              <td className="text-right">rolls</td>
              <td className="text-right">${PRICING.MATERIALS.underlayment.toFixed(2)}</td>
              <td className="text-right">${calculations.materials.underlayment.toFixed(2)}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2">GAF ProStart Starter Strip</td>
              <td className="text-right">{Math.ceil(squares / 5)}</td>
              <td className="text-right">boxes</td>
              <td className="text-right">${PRICING.MATERIALS.starterStrip.toFixed(2)}</td>
              <td className="text-right">${calculations.materials.starterStrip.toFixed(2)}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2">GAF Seal-A-Ridge Ridge Cap</td>
              <td className="text-right">{Math.ceil(squares / 20)}</td>
              <td className="text-right">bundles</td>
              <td className="text-right">${PRICING.MATERIALS.ridgeCap.toFixed(2)}</td>
              <td className="text-right">${calculations.materials.ridgeCap.toFixed(2)}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2">Ice & Water Shield</td>
              <td className="text-right">{Math.ceil(squares / 2)}</td>
              <td className="text-right">rolls</td>
              <td className="text-right">${PRICING.MATERIALS.iceAndWater.toFixed(2)}</td>
              <td className="text-right">${calculations.materials.iceAndWater.toFixed(2)}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2">Labor ({pitch}/12 pitch)</td>
              <td className="text-right">{squares}</td>
              <td className="text-right">squares</td>
              <td className="text-right">${laborRate.toFixed(2)}</td>
              <td className="text-right">${calculations.labor.toFixed(2)}</td>
            </tr>
            <tr className="font-bold">
              <td className="py-2">Total</td>
              <td></td>
              <td></td>
              <td></td>
              <td className="text-right">${total.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}