import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { RoofingCategory } from "@/components/RoofingCategorySelector";
import { RoofMeasurements, EstimateItem } from "@/types/estimate";
import { usePdfProcessing } from "./estimate/usePdfProcessing";
import { useEstimateGeneration } from "./estimate/useEstimateGeneration";
import { EstimateForm } from "./estimate/EstimateForm";
import { EstimateSidebar } from "./estimate/EstimateSidebar";

const EstimateGenerator = () => {
  const { toast } = useToast();
  const [measurements, setMeasurements] = useState<RoofMeasurements | null>(null);
  const [profitMargin, setProfitMargin] = useState(25);
  const [selectedCategory, setSelectedCategory] = useState<RoofingCategory | null>(null);
  const [estimateItems, setEstimateItems] = useState<EstimateItem[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [rawPdfData, setRawPdfData] = useState<Record<string, any> | null>(null);

  const processPdfMutation = usePdfProcessing({
    onSuccess: (measurements, rawData) => {
      console.log('PDF processing succeeded with measurements:', measurements);
      console.log('Raw PDF data:', rawData);
      setMeasurements(measurements);
      setRawPdfData(rawData);
    }
  });
  
  const generateEstimateMutation = useEstimateGeneration({
    onSuccess: (items, price) => {
      setEstimateItems(items);
      setTotalPrice(price);
    }
  });

  useEffect(() => {
    if (measurements?.totalArea && selectedCategory) {
      console.log('Generating estimate with:', {
        measurements,
        profitMargin,
        roofingCategory: selectedCategory
      });
      
      generateEstimateMutation.mutate({
        measurements,
        profitMargin,
        roofingCategory: selectedCategory
      });
    }
  }, [measurements, selectedCategory, profitMargin]);

  const handleExportPdf = () => {
    toast({
      title: "Export Started",
      description: "Your estimate PDF is being generated...",
    });
  };

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <EstimateForm
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        measurements={measurements}
        estimateItems={estimateItems}
        totalPrice={totalPrice}
        rawPdfData={rawPdfData}
        onFileAccepted={processPdfMutation.mutate}
        isProcessing={processPdfMutation.isPending}
        onExportPdf={handleExportPdf}
      />
      <EstimateSidebar
        measurements={measurements}
        selectedCategory={selectedCategory}
        profitMargin={profitMargin}
        onProfitMarginChange={setProfitMargin}
      />
    </div>
  );
};

export default EstimateGenerator;