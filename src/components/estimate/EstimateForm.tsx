import React from 'react';
import { RoofingCategorySelector, RoofingCategory } from "@/components/RoofingCategorySelector";
import { EstimateUploadSection } from "./EstimateUploadSection";
import { EstimatePreview } from "@/components/EstimatePreview";
import { PdfExtractionDetails } from "@/components/PdfExtractionDetails";
import { EstimateItem, RoofMeasurements } from "@/types/estimate";

export interface EstimateFormProps {
  selectedCategory: RoofingCategory | null;
  onSelectCategory: (category: RoofingCategory) => void;
  measurements: RoofMeasurements | null;
  estimateItems: EstimateItem[];
  totalPrice: number;
  rawPdfData: Record<string, any> | null;
  onFileAccepted: (file: File) => void;
  isProcessing: boolean;
  onExportPdf: () => void;
}

export function EstimateForm({
  selectedCategory,
  onSelectCategory,
  measurements,
  estimateItems,
  totalPrice,
  rawPdfData,
  onFileAccepted,
  isProcessing,
  onExportPdf,
}: EstimateFormProps) {
  return (
    <div className="lg:col-span-2 space-y-6">
      <RoofingCategorySelector
        selectedCategory={selectedCategory}
        onSelectCategory={onSelectCategory}
      />
      
      {!selectedCategory ? (
        <div className="text-center p-8 bg-muted rounded-lg">
          <p className="text-muted-foreground">
            Please select a roofing type to continue
          </p>
        </div>
      ) : !measurements ? (
        <EstimateUploadSection
          onFileAccepted={onFileAccepted}
          isProcessing={isProcessing}
        />
      ) : (
        <>
          <EstimatePreview
            items={estimateItems}
            totalPrice={totalPrice}
            onExportPdf={onExportPdf}
          />
          {rawPdfData && (
            <PdfExtractionDetails data={rawPdfData} />
          )}
        </>
      )}
    </div>
  );
}