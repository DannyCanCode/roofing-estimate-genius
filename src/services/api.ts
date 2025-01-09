// Import necessary modules and types
import { ProcessedPdfData } from '../types/estimate';
import { supabase } from '@/integrations/supabase/client';

const PROCESS_PDF_URL = import.meta.env.VITE_PROCESS_PDF_URL;

export async function processPdfReport(file: File): Promise<ProcessedPdfData> {
  try {
    console.log('Processing PDF file:', file.name);

    // Upload file to storage first
    const timestamp = new Date().getTime();
    const fileName = `${timestamp}-${file.name}`;
    const filePath = `reports/${fileName}`;

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('eagleview-reports')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    // Get the public URL
    const { data: urlData } = await supabase.storage
      .from('eagleview-reports')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL');
    }

    // Process using Edge Function
    const { data, error } = await supabase.functions.invoke('process-pdf', {
      body: { fileUrl: urlData.publicUrl }
    });

    if (error) {
      console.error('Processing error:', error);
      throw new Error(error.message);
    }

    return data as ProcessedPdfData;
  } catch (error) {
    console.error('Error processing PDF report:', error);
    throw error;
  }
}

// Other existing functions remain unchanged...
