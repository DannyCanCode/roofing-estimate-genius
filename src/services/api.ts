import { supabase } from "@/integrations/supabase/client";
import { RoofMeasurements } from "@/types/estimate";

interface EstimateData {
  materials: Array<{ name: string; quantity: number; unit: string; basePrice: number }>;
  labor: Array<{ pitch: string; area: number; rate: number }>;
  totalPrice: number;
}

export async function processPdfReport(file: File): Promise<RoofMeasurements> {
  console.log('Starting PDF processing:', file.name);
  
  // First, upload the file to Supabase storage
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `reports/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('eagleview-reports')
    .upload(filePath, file);

  if (uploadError) {
    console.error('Error uploading file:', uploadError);
    throw new Error("Failed to upload PDF file");
  }

  // Create a new report record
  const { error: dbError } = await supabase
    .from('reports')
    .insert({
      file_path: filePath,
      original_filename: file.name,
      status: 'processing',
      metadata: {}
    });

  if (dbError) {
    console.error('Error saving report to database:', dbError);
    throw new Error("Failed to save report information");
  }

  // Process the PDF using the edge function
  const formData = new FormData();
  formData.append("file", file);

  const { data, error } = await supabase.functions.invoke('process-pdf-report', {
    body: formData,
  });

  if (error) {
    console.error('Error processing PDF:', error);
    // Update report status to error
    await supabase
      .from('reports')
      .update({
        status: 'error',
        error_message: error.message || "Failed to process PDF report"
      })
      .eq('file_path', filePath);
    throw new Error(error.message || "Failed to process PDF report");
  }

  if (!data) {
    console.error('No data returned from PDF processing');
    // Update report status to error
    await supabase
      .from('reports')
      .update({
        status: 'error',
        error_message: "No data returned from PDF processing"
      })
      .eq('file_path', filePath);
    throw new Error("No data returned from PDF processing");
  }

  // Update report status to completed with the processed data
  await supabase
    .from('reports')
    .update({
      status: 'completed',
      metadata: data,
      processed_text: JSON.stringify(data)
    })
    .eq('file_path', filePath);

  console.log('PDF processing successful:', data);
  return data;
}

export async function generateEstimate(params: {
  measurements: RoofMeasurements;
  profitMargin: number;
  roofingCategory: string;
}): Promise<EstimateData> {
  console.log('Generating estimate with params:', params);

  const { data, error } = await supabase.functions.invoke('generate-estimate', {
    body: {
      measurements: params.measurements,
      profitMargin: params.profitMargin,
      roofingCategory: params.roofingCategory,
    },
  });

  if (error) {
    console.error('Error generating estimate:', error);
    throw error;
  }

  console.log('Estimate generated successfully:', data);
  return data;
}