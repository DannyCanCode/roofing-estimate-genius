import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { EstimatePreview } from "@/components/EstimatePreview";
import { RoofingCategorySelector, RoofingCategory } from "@/components/RoofingCategorySelector";
import { ProfitMarginSlider } from "@/components/ProfitMarginSlider";
import { RoofMeasurements, EstimateItem } from "@/types/estimate";
import { EstimateUploadSection } from "./estimate/EstimateUploadSection";
import { usePdfProcessing } from "./estimate/usePdfProcessing";
import { useEstimateGeneration } from "./estimate/useEstimateGeneration";
import { PdfExtractionDetails } from "./PdfExtractionDetails";

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
      <div className="lg:col-span-2 space-y-6">
        <RoofingCategorySelector
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
        
        {!selectedCategory ? (
          <div className="text-center p-8 bg-muted rounded-lg">
            <p className="text-muted-foreground">
              Please select a roofing type to continue
            </p>
          </div>
        ) : !measurements ? (
          <EstimateUploadSection
            onFileAccepted={processPdfMutation.mutate}
            isProcessing={processPdfMutation.isPending}
          />
        ) : (
          <>
            <EstimatePreview
              items={estimateItems}
              totalPrice={totalPrice}
              onExportPdf={handleExportPdf}
            />
            {rawPdfData && <PdfExtractionDetails data={rawPdfData} />}
          </>
        )}
      </div>

      <div className="space-y-6">
        {measurements && selectedCategory && (
          <ProfitMarginSlider
            value={profitMargin}
            onChange={setProfitMargin}
          />
        )}
      </div>
    </div>
  );
};

export default EstimateGenerator;