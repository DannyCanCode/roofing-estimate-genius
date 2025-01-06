import { useState } from 'react'

interface PricingDetails {
  totalSquares: number
  flatSquares: number
  wasteFactor: number
  laborRate: number
  stories: number
}

interface CalculatedPricing {
  shingles: number
  underlayment: number
  iceAndWater: number
  flatRoofMaterials: number
  slopedRoofLabor: number
  flatRoofLabor: number
  twoStoryCharge: number
  tripCharge: number
  dumpster: number
  permitsAndInspections: number
  dripEdge: number
  plumbingBoots: number
  nails: number
  subtotal: number
  profitAmount: number
  total: number
  details: PricingDetails
}

export function EstimateCalculator({ pricing }: { pricing: CalculatedPricing }) {
  const [showDetails, setShowDetails] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Estimate Breakdown</h2>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-blue-600 hover:text-blue-800"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      <div className="space-y-6">
        {/* Project Details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="text-sm text-gray-500">Total Squares</div>
            <div className="font-semibold">{pricing.details.totalSquares}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Flat Squares</div>
            <div className="font-semibold">{pricing.details.flatSquares}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Waste Factor</div>
            <div className="font-semibold">{pricing.details.wasteFactor}%</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Stories</div>
            <div className="font-semibold">{pricing.details.stories}</div>
          </div>
        </div>

        {showDetails && (
          <>
            {/* Materials */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Materials</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm">Shingles</div>
                <div className="text-right">{formatCurrency(pricing.shingles)}</div>
                <div className="text-sm">Underlayment</div>
                <div className="text-right">{formatCurrency(pricing.underlayment)}</div>
                <div className="text-sm">Ice & Water Shield</div>
                <div className="text-right">{formatCurrency(pricing.iceAndWater)}</div>
                <div className="text-sm">Flat Roof Materials</div>
                <div className="text-right">{formatCurrency(pricing.flatRoofMaterials)}</div>
                <div className="text-sm">Drip Edge</div>
                <div className="text-right">{formatCurrency(pricing.dripEdge)}</div>
                <div className="text-sm">Plumbing Boots</div>
                <div className="text-right">{formatCurrency(pricing.plumbingBoots)}</div>
                <div className="text-sm">Nails</div>
                <div className="text-right">{formatCurrency(pricing.nails)}</div>
              </div>
            </div>

            {/* Labor */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Labor</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm">Sloped Roof Labor</div>
                <div className="text-right">{formatCurrency(pricing.slopedRoofLabor)}</div>
                <div className="text-sm">Flat Roof Labor</div>
                <div className="text-right">{formatCurrency(pricing.flatRoofLabor)}</div>
                <div className="text-sm">Two Story Charge</div>
                <div className="text-right">{formatCurrency(pricing.twoStoryCharge)}</div>
              </div>
            </div>

            {/* Additional Charges */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Additional Charges</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm">Trip Charge</div>
                <div className="text-right">{formatCurrency(pricing.tripCharge)}</div>
                <div className="text-sm">Dumpster</div>
                <div className="text-right">{formatCurrency(pricing.dumpster)}</div>
                <div className="text-sm">Permits & Inspections</div>
                <div className="text-right">{formatCurrency(pricing.permitsAndInspections)}</div>
              </div>
            </div>
          </>
        )}

        {/* Totals */}
        <div className="border-t pt-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="text-sm font-medium">Subtotal</div>
            <div className="text-right">{formatCurrency(pricing.subtotal)}</div>
            <div className="text-sm font-medium">Profit</div>
            <div className="text-right">{formatCurrency(pricing.profitAmount)}</div>
            <div className="text-lg font-bold">Total</div>
            <div className="text-right text-lg font-bold">{formatCurrency(pricing.total)}</div>
          </div>
        </div>
      </div>
    </div>
  )
} 