import { useState } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2, Download } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { PRICING } from '@/config/pricing'

interface Measurements {
  totalRoofArea: string | null
  totalRoofSquares: string | null
  predominantPitch: string | null
  ridgesLength: string | null
  ridgesCount: string | null
  hipsLength: string | null
  hipsCount: string | null
  valleysLength: string | null
  valleysCount: string | null
  rakesLength: string | null
  rakesCount: string | null
  eavesLength: string | null
  eavesCount: string | null
  dripEdgeLength: string | null
  flashingLength: string | null
  stepFlashingLength: string | null
  totalPenetrationsArea: string | null
  wasteFactorArea: string | null
  suggestedWasteFactor: string | null
  flatArea: string | null
  numberOfStories: string | null
}

interface ProcessingResult {
  measurements: Measurements
  extractionStatus: Record<string, boolean>
  pricing: any
  debug?: {
    textSample: string
    pdfInfo: {
      pageCount: number
      fileSize: number
    }
  }
}

export function PDFUploader() {
  const [status, setStatus] = useState('')
  const [result, setResult] = useState<ProcessingResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [profitMargin, setProfitMargin] = useState(25)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [selectedRoofingType, setSelectedRoofingType] = useState('SHINGLE')

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setStatus('Processing PDF...')
    setError(null)
    setIsLoading(true)
    setResult(null)
    setDebugInfo(null)
    
    const formData = new FormData()
    formData.append('file', file)
    formData.append('profitMargin', profitMargin.toString())
    formData.append('roofingType', selectedRoofingType)

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/process-pdf`,
        {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          }
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.error) {
        setError(data.error)
        setStatus('Error processing PDF')
        setDebugInfo(data.debug)
        console.error('Processing error:', data.error)
        console.error('Debug info:', data.debug)
      } else {
        if (!data.measurements?.totalRoofArea) {
          setError('Could not extract roof area from PDF. Please make sure you uploaded an EagleView report.')
          setDebugInfo(data.debug)
        } else {
          setResult(data)
          setStatus('PDF processed successfully')
        }
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      setError(error.message || 'Error uploading PDF')
      setStatus('Error uploading PDF')
    } finally {
      setIsLoading(false)
    }
  }

  const getEstimateItems = () => {
    if (!result?.measurements.totalRoofArea) return []

    const totalArea = parseFloat(result.measurements.totalRoofArea.replace(/,/g, ''))
    const pitch = result.measurements.predominantPitch ? parseInt(result.measurements.predominantPitch) : 4
    const wasteFactor = result.measurements.suggestedWasteFactor ? parseFloat(result.measurements.suggestedWasteFactor) : 15
    
    // Calculate squares needed (1 square = 100 sq ft)
    const squares = Math.ceil(totalArea / 100 * (1 + wasteFactor/100))

    // Determine labor rate based on pitch
    let laborRate = PRICING.LABOR_RATES['4/12-7/12']
    if (pitch >= 13) laborRate = PRICING.LABOR_RATES['13/12-16/12']
    else if (pitch >= 10) laborRate = PRICING.LABOR_RATES['10/12-12/12']
    else if (pitch >= 8) laborRate = PRICING.LABOR_RATES['8/12-9/12']

    return [
      {
        description: `${selectedRoofingType} Material`,
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
    ]
  }

  const handleExportPdf = () => {
    // TODO: Implement PDF export
    console.log('Export PDF')
  }

  const items = getEstimateItems()
  const totalPrice = items.reduce((sum, item) => sum + item.total, 0)

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <Label htmlFor="profitMargin">Profit Margin (%)</Label>
            <Input
              id="profitMargin"
              type="number"
              value={profitMargin}
              onChange={(e) => setProfitMargin(Number(e.target.value))}
              className="w-32"
              min="0"
              max="100"
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="pdfUpload">Upload EagleView PDF</Label>
            <Input
              id="pdfUpload"
              type="file"
              accept=".pdf"
              onChange={handleUpload}
              disabled={isLoading}
            />
          </div>
        </div>
      </Card>

      {isLoading && (
        <Card className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>{status}</span>
          </div>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error Processing PDF</AlertTitle>
          <AlertDescription>
            {error}
            {debugInfo && (
              <details className="mt-2">
                <summary className="cursor-pointer font-medium">Show Debug Info</summary>
                <pre className="mt-2 p-2 bg-red-950/10 rounded text-xs overflow-auto">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>
            )}
          </AlertDescription>
        </Alert>
      )}

      {result && !error && (
        <>
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Select Roofing Type</h2>
            <div className="flex gap-4">
              <Button
                variant={selectedRoofingType === 'SHINGLE' ? 'default' : 'outline'}
                onClick={() => setSelectedRoofingType('SHINGLE')}
              >
                SHINGLE
              </Button>
              <Button
                variant={selectedRoofingType === 'TILE' ? 'default' : 'outline'}
                onClick={() => setSelectedRoofingType('TILE')}
              >
                TILE
              </Button>
              <Button
                variant={selectedRoofingType === 'METAL' ? 'default' : 'outline'}
                onClick={() => setSelectedRoofingType('METAL')}
              >
                METAL
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Estimate Preview</h2>
              <Button variant="outline" size="sm" onClick={handleExportPdf}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
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
                  {items.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2">{item.description}</td>
                      <td className="text-right">{item.quantity}</td>
                      <td className="text-right">{item.unit}</td>
                      <td className="text-right">${item.unitPrice.toFixed(2)}</td>
                      <td className="text-right">${item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="font-bold">
                    <td colSpan={4} className="text-right py-2">Total</td>
                    <td className="text-right py-2">${totalPrice.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">PDF Extraction Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(result.measurements).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${value ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-sm font-medium">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                  <span className="text-sm">{value || '0'}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Calculate Roof Estimate</h2>
            <div className="space-y-4">
              <div>
                <Label>Roofing Type</Label>
                <select className="w-full border rounded p-2">
                  <option>Select roofing type</option>
                </select>
              </div>
              <div>
                <Label>Roof Pitch</Label>
                <select className="w-full border rounded p-2">
                  <option>Select pitch</option>
                </select>
              </div>
              <div>
                <Label>Total Area (sq ft)</Label>
                <Input placeholder="Enter total area" />
              </div>
              <div>
                <Label>Waste Percentage (%)</Label>
                <Input defaultValue="12" />
              </div>
              <div>
                <Label>Number of Plumbing Boots</Label>
                <Input defaultValue="0" />
              </div>
              <div>
                <Label>Number of 4" Goosenecks</Label>
                <Input defaultValue="0" />
              </div>
              <div>
                <Label>Number of 10" Goosenecks</Label>
                <Input defaultValue="0" />
              </div>
              <div>
                <Label>Number of Skylights</Label>
                <Input defaultValue="0" />
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  )
} 