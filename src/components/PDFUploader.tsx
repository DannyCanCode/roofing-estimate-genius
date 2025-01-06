import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { EstimatePreview } from './EstimatePreview'
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
        description: 'SHINGLE Material',
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
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Upload EagleView Report</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>{status}</span>
          </CardContent>
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
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>PDF Extraction Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(result.extractionStatus).map(([key, success]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${success ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-sm">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Measurements</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(result.measurements).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <dt className="text-sm font-medium text-gray-500">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </dt>
                    <dd className="text-sm">
                      {value || 'Not found'}
                    </dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          <EstimatePreview
            items={items}
            totalPrice={totalPrice}
            onExportPdf={handleExportPdf}
          />
        </div>
      )}
    </div>
  )
} 