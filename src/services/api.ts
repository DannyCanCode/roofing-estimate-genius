import { supabase } from "@/integrations/supabase/client";
import { ProcessedPdfData } from "@/types/estimate";

export async function processPdfReport(file: File): Promise<ProcessedPdfData> {
  console.log('Starting PDF processing:', file.name);
  
  // Upload file to Supabase storage
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

  // Create report record
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

  // Process PDF using edge function
  const formData = new FormData();
  formData.append('file', file);

  const { data, error } = await supabase.functions.invoke<ProcessedPdfData>('process-pdf-report', {
    body: formData,
  });

  if (error) {
    console.error('Error processing PDF:', error);
    // Update report status to error
    await supabase
      .from('reports')
      .update({
        status: 'error',
        error_message: error.message
      })
      .eq('file_path', filePath);
    throw error;
  }

  if (!data) {
    const errorMessage = "No data returned from PDF processing";
    console.error(errorMessage);
    // Update report status to error
    await supabase
      .from('reports')
      .update({
        status: 'error',
        error_message: errorMessage
      })
      .eq('file_path', filePath);
    throw new Error(errorMessage);
  }

  // Update report with processed data
  await supabase
    .from('reports')
    .update({
      status: 'completed',
      metadata: data.measurements,
      processed_text: JSON.stringify(data)
    })
    .eq('file_path', filePath);

  console.log('PDF processing successful:', data);
  return data;
}

export async function generateEstimate(params: {
  measurements: any;
  profitMargin: number;
  roofingCategory: string;
}): Promise<any> {
  const { data, error } = await supabase.functions.invoke('generate-estimate', {
    body: params
  });

  if (error) throw error;
  return data;
}