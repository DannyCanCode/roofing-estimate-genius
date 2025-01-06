import React, { useState, useEffect } from 'react';
import { useMutation } from "@tanstack/react-query";
import { FileUpload } from "@/components/FileUpload";
import { ProfitMarginSlider } from "@/components/ProfitMarginSlider";
import { EstimatePreview } from "@/components/EstimatePreview";
import { RoofingCategorySelector, RoofingCategory } from "@/components/RoofingCategorySelector";
import { processPdfReport, generateEstimate } from "@/services/api";
import { RoofMeasurements, EstimateItem } from "@/types/estimate";
import { useToast } from "@/hooks/use-toast";

const EstimateGenerator = () => {
  const [measurements, setMeasurements] = useState<RoofMeasurements | null>(null);
  const [profitMargin, setProfitMargin] = useState(25);
  const [selectedCategory, setSelectedCategory] = useState<RoofingCategory | null>(null);
  const [estimateItems, setEstimateItems] = useState<EstimateItem[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const { toast } = useToast();

  const processPdfMutation = useMutation({
    mutationFn: processPdfReport,
    onSuccess: (data) => {
      setMeasurements(data);
      toast({
        title: "PDF Processed Successfully",
        description: "Your roof measurements have been extracted.",
      });
    },
    onError: () => {
      toast({
        title: "Error Processing PDF",
        description: "Failed to process the PDF report. Please try again.",
        variant: "destructive",
      });
    },
  });

  const generateEstimateMutation = useMutation({
    mutationFn: generateEstimate,
    onSuccess: (data) => {
      const items: EstimateItem[] = [
        ...data.materials.map(material => ({
          description: material.name,
          quantity: material.quantity,
          unit: material.unit,
          unitPrice: material.basePrice,
          total: material.quantity * material.basePrice
        })),
        ...data.labor.map(labor => ({
          description: `Labor for ${labor.pitch} pitch`,
          quantity: labor.area,
          unit: 'sq ft',
          unitPrice: labor.rate,
          total: labor.area * labor.rate
        }))
      ];
      setEstimateItems(items);
      setTotalPrice(data.totalPrice);
    },
    onError: () => {
      toast({
        title: "Error Generating Estimate",
        description: "Failed to generate the estimate. Please try again.",
        variant: "destructive",
      });
    }
  });

  useEffect(() => {
    if (measurements && selectedCategory) {
      generateEstimateMutation.mutate({
        measurements,
        profitMargin,
        roofingCategory: selectedCategory
      });
    }
  }, [measurements, selectedCategory, profitMargin]);

  const handleFileUpload = (file: File) => {
    processPdfMutation.mutate(file);
  };

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
          <FileUpload
            onFileAccepted={handleFileUpload}
            isProcessing={processPdfMutation.isPending}
          />
        ) : (
          <EstimatePreview
            items={estimateItems}
            totalPrice={totalPrice}
            onExportPdf={handleExportPdf}
          />
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