import { supabase } from "@/integrations/supabase/client";
import { RoofMeasurements, RoofingCategory } from "@/types/estimate";

interface GenerateEstimateParams {
  measurements: RoofMeasurements;
  profitMargin: number;
  roofingCategory: RoofingCategory;
}

export async function processPdfReport(file: File): Promise<RoofMeasurements> {
  const formData = new FormData();
  formData.append("file", file);

  const { data, error } = await supabase.functions.invoke('process-pdf-report', {
    body: formData,
  });

  if (error) {
    console.error('Error processing PDF:', error);
    throw new Error("Failed to process PDF report");
  }

  return data;
}

export async function generateEstimate({
  measurements,
  profitMargin,
  roofingCategory,
}: GenerateEstimateParams): Promise<any> {
  console.log('Sending estimate request:', { measurements, profitMargin, roofingCategory });
  
  if (!measurements?.totalArea) {
    throw new Error("Total area is required");
  }

  if (!roofingCategory) {
    throw new Error("Roofing category is required");
  }

  if (typeof profitMargin !== 'number') {
    throw new Error("Profit margin must be a number");
  }

  const { data, error } = await supabase.functions.invoke('generate-estimate', {
    body: {
      measurements: {
        totalArea: measurements.totalArea,
        pitchBreakdown: measurements.pitchBreakdown || [{ pitch: "4/12", area: measurements.totalArea }],
        suggestedWaste: measurements.suggestedWaste || 12
      },
      profitMargin,
      roofingCategory
    },
  });

  if (error) {
    console.error('Error generating estimate:', error);
    throw error;
  }

  return data;
}