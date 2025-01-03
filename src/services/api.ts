import { RoofMeasurements, Estimate, RoofingCategory } from "@/types/estimate";
import { supabase } from "@/integrations/supabase/client";

// Use Supabase Edge Functions URL instead of localhost
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

interface GenerateEstimateParams {
  measurements: RoofMeasurements;
  profitMargin: number;
  roofingCategory: RoofingCategory;
}

export async function generateEstimate({
  measurements,
  profitMargin,
  roofingCategory,
}: GenerateEstimateParams): Promise<Estimate> {
  const { data, error } = await supabase.functions.invoke('generate-estimate', {
    body: { measurements, profitMargin, roofingCategory },
  });

  if (error) {
    console.error('Error generating estimate:', error);
    throw new Error("Failed to generate estimate");
  }

  return data;
}