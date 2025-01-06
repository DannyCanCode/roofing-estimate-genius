import { useState } from 'react'
import { EstimateCalculator } from './EstimateCalculator'

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
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-pdf`,
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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Profit Margin (%)
            </label>
            <input
              type="number"
              value={profitMargin}
              onChange={(e) => setProfitMargin(Number(e.target.value))}
              className="mt-1 block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              min="0"
              max="100"
              disabled={isLoading}
            />
          </div>
        </div>

        <label className="block text-sm font-medium mb-2">
          Upload EagleView PDF
        </label>
        <input
          type="file"
          accept=".pdf"
          onChange={handleUpload}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100
            disabled:opacity-50"
          disabled={isLoading}
        />
      </div>

      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">{status}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-red-700 font-medium mb-2">Error Processing PDF</h3>
          <p className="text-red-600 text-sm mb-2">{error}</p>
          {debugInfo && (
            <div className="mt-4">
              <details className="text-sm">
                <summary className="cursor-pointer text-red-700 hover:text-red-800">Show Debug Info</summary>
                <pre className="mt-2 p-2 bg-red-100 rounded overflow-auto text-xs">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      )}

      {result && !error && (
        <div className="space-y-8">
          {/* Extraction Status */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">PDF Extraction Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(result.extractionStatus).map(([key, success]) => (
                <div key={key} className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded-full ${success ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-sm">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Measurements */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">Measurements</h3>
            <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(result.measurements).map(([key, value]) => (
                <div key={key} className="border-b pb-2">
                  <dt className="text-sm font-medium text-gray-500">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {value || 'Not found'}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Estimate Calculator */}
          <EstimateCalculator pricing={result.pricing} />
        </div>
      )}
    </div>
  )
} 