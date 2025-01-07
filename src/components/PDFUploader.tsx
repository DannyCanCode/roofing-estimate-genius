import { useState } from 'react';
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { EstimateForm } from './estimate/EstimateForm';
import { EstimateTypeSelector } from './estimate/EstimateTypeSelector';
import { EstimatePreview } from './EstimatePreview';
import { createEstimate, createEstimateItems } from '@/services/estimateService';
import { useToast } from '@/hooks/use-toast';
import { PRICING } from '@/config/pricing';

export function PDFUploader() {
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [profitMargin, setProfitMargin] = useState(25);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [selectedRoofingType, setSelectedRoofingType] = useState('SHINGLE');
  const { toast } = useToast();

  const handleUpload = async (file: File) => {
    setStatus('Processing PDF...');
    setError(null);
    setIsLoading(true);
    setDebugInfo(null);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('profitMargin', profitMargin.toString());
    formData.append('roofingType', selectedRoofingType);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration is missing');
      }

      console.log('Uploading to:', `${supabaseUrl}/functions/v1/process-pdf-report`);

      const response = await fetch(
        `${supabaseUrl}/functions/v1/process-pdf-report`,
        {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}. ${errorText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        setDebugInfo(data.debug);
        throw new Error(data.error);
      }

      if (!data.measurements?.total_area) {
        throw new Error('Could not extract roof area from PDF. Please make sure you uploaded an EagleView report.');
      }

      // Calculate estimate items
      const items = getEstimateItems(data.measurements);
      const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

      // Create estimate in database with all required fields
      const estimate = await createEstimate({
        customer_name: "Customer", // This should be input by user
        amount: totalAmount,
        status: 'pending',
        roofing_type: selectedRoofingType,
        report_id: data.report_id,
        address: data.measurements.address || 'Address pending', // Add address field
        date: new Date().toISOString() // Add date field
      });

      // Create estimate items in database
      await createEstimateItems(items.map(item => ({
        ...item,
        estimate_id: estimate.id
      })));

      toast({
        title: "Success",
        description: "Estimate created successfully",
      });

      setStatus('PDF processed successfully');
    } catch (error: any) {
      console.error('Upload error:', error);
      setError(error.message || 'Error uploading PDF');
      setStatus('Error uploading PDF');
      
      toast({
        title: "Error",
        description: error.message || 'Error processing PDF',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getEstimateItems = (measurements: any) => {
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
        description: `${selectedRoofingType} Material`,
        quantity: squares,
        unit: 'sq ft',
        unit_price: PRICING.MATERIALS.shingles,
        total: squares * PRICING.MATERIALS.shingles
      },
      {
        description: 'Underlayment',
        quantity: totalArea,
        unit: 'sq ft',
        unit_price: 0.45,
        total: totalArea * 0.45
      },
      {
        description: 'Starter Strip',
        quantity: totalArea,
        unit: 'sq ft',
        unit_price: 0.30,
        total: totalArea * 0.30
      },
      {
        description: 'Ridge Caps',
        quantity: totalArea,
        unit: 'sq ft',
        unit_price: 0.25,
        total: totalArea * 0.25
      },
      {
        description: 'Nails/Fasteners',
        quantity: totalArea,
        unit: 'sq ft',
        unit_price: 0.15,
        total: totalArea * 0.15
      },
      {
        description: `Labor for ${pitch}/12 pitch`,
        quantity: totalArea,
        unit: 'sq ft',
        unit_price: laborRate,
        total: totalArea * laborRate
      }
    ];
  };

  return (
    <div className="space-y-6">
      <EstimateForm
        profitMargin={profitMargin}
        onProfitMarginChange={setProfitMargin}
        onFileSelect={handleUpload}
        isLoading={isLoading}
      />

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

      {!error && !isLoading && (
        <EstimateTypeSelector
          selectedType={selectedRoofingType}
          onTypeSelect={setSelectedRoofingType}
        />
      )}
    </div>
  );
}