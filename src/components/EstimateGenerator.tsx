import React, { useState } from 'react';
import { useMutation } from "@tanstack/react-query";
import { FileUpload } from "@/components/FileUpload";
import { ProfitMarginSlider } from "@/components/ProfitMarginSlider";
import { EstimatePreview } from "@/components/EstimatePreview";
import { RoofingCategorySelector, RoofingCategory } from "@/components/RoofingCategorySelector";
import { processPdfReport } from "@/services/api";
import { RoofMeasurements } from "@/types/estimate";
import { useToast } from "@/hooks/use-toast";

const EstimateGenerator = () => {
  const [measurements, setMeasurements] = useState<RoofMeasurements | null>(null);
  const [profitMargin, setProfitMargin] = useState(25);
  const [selectedCategory, setSelectedCategory] = useState<RoofingCategory | null>(null);
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
            items={[]}
            totalPrice={0}
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