import { useState } from 'react';
import { Alert } from "@/components/ui/alert";
import { EstimateForm } from './estimate/EstimateForm';
import { EstimateTypeSelector } from './estimate/EstimateTypeSelector';
import { ProcessingIndicator } from './estimate/ProcessingIndicator';
import { DebugInfo } from './estimate/DebugInfo';
import { processPdfFile } from '@/services/pdfProcessingService';
import { calculateEstimateItems } from '@/services/estimateCalculationService';
import { createEstimate, createEstimateItems } from '@/services/estimateService';
import { useToast } from '@/hooks/use-toast';
import { RoofingCategory } from './RoofingCategorySelector';
import { EstimateItem, RoofMeasurements } from '@/types/estimate';

export function PDFUploader() {
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [profitMargin, setProfitMargin] = useState(25);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [selectedRoofingType, setSelectedRoofingType] = useState<RoofingCategory | null>(null);
  const [measurements, setMeasurements] = useState<RoofMeasurements | null>(null);
  const [estimateItems, setEstimateItems] = useState<EstimateItem[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [rawPdfData, setRawPdfData] = useState<Record<string, any> | null>(null);
  const { toast } = useToast();

  const handleUpload = async (file: File) => {
    setStatus('Processing PDF...');
    setError(null);
    setIsLoading(true);
    setDebugInfo(null);
    
    try {
      const data = await processPdfFile(file, profitMargin, selectedRoofingType || 'SHINGLE');
      
      // Calculate estimate items
      const items = calculateEstimateItems(data.measurements);
      const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

      // Create estimate in database
      const estimate = await createEstimate({
        customer_name: "Customer",
        amount: totalAmount,
        status: 'pending',
        roofing_type: selectedRoofingType || 'SHINGLE',
        report_id: data.report_id,
        address: data.measurements.address || 'Address pending',
        date: new Date().toISOString()
      });

      // Create estimate items
      await createEstimateItems(items.map(item => ({
        ...item,
        estimate_id: estimate.id
      })));

      setMeasurements(data.measurements);
      setEstimateItems(items);
      setTotalPrice(totalAmount);
      setRawPdfData(data);

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

  const handleExportPdf = () => {
    toast({
      title: "Export Started",
      description: "Your estimate PDF is being generated...",
    });
  };

  return (
    <div className="space-y-6">
      <EstimateForm
        selectedCategory={selectedRoofingType}
        onSelectCategory={setSelectedRoofingType}
        measurements={measurements}
        estimateItems={estimateItems}
        totalPrice={totalPrice}
        rawPdfData={rawPdfData}
        onFileAccepted={handleUpload}
        isProcessing={isLoading}
        onExportPdf={handleExportPdf}
      />

      <ProcessingIndicator isLoading={isLoading} status={status} />
      <DebugInfo error={error} debugInfo={debugInfo} />

      {!error && !isLoading && (
        <EstimateTypeSelector
          selectedType={selectedRoofingType || 'SHINGLE'}
          onTypeSelect={(type) => setSelectedRoofingType(type as RoofingCategory)}
        />
      )}
    </div>
  );
}