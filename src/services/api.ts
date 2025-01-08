// Import necessary modules and types
import { supabase } from '../integrations/supabase/client';
import axios from 'axios';
import { RoofMeasurements } from '../types/estimate';

const PROCESS_PDF_URL = import.meta.env.VITE_PROCESS_PDF_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export async function processPdfReport(file: File): Promise<RoofMeasurements> {
  console.log('Starting PDF processing:', file.name);

  try {
    // Validate file type
    if (!file.type.includes('pdf')) {
      throw new Error('Please upload a PDF file');
    }

    // Generate a unique filename
    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substring(7);
    const fileName = `${timestamp}-${randomString}.pdf`;
    const filePath = `reports/${fileName}`;

    console.log('Uploading file to storage:', filePath);

    // Upload the file to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('eagleview-reports')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      throw new Error(`Failed to upload PDF file: ${uploadError.message}`);
    }

    if (!uploadData) {
      throw new Error('No upload data received');
    }

    console.log('File uploaded successfully:', uploadData.path);

    // Get the public URL for the uploaded file
    const { data: publicUrlData } = await supabase.storage
      .from('eagleview-reports')
      .getPublicUrl(filePath);

    if (!publicUrlData?.publicUrl) {
      throw new Error('Failed to get public URL for the uploaded file');
    }

    const publicUrl = publicUrlData.publicUrl;
    console.log('File public URL:', publicUrl);

    // Make sure we're using the correct function URL
    const functionUrl = PROCESS_PDF_URL.endsWith('/') ? 
      `${PROCESS_PDF_URL}process-pdf-report` : 
      `${PROCESS_PDF_URL}/process-pdf-report`;

    // Process the PDF
    console.log('Sending request to PDF processing API:', functionUrl);
    const response = await axios.post(
      functionUrl,
      JSON.stringify({ fileUrl: publicUrl }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY
        }
      }
    );

    const responseData = response.data;
    console.log('Response from PDF processing:', responseData);

    if (!responseData || !responseData.measurements) {
      throw new Error('Invalid response from PDF processing API');
    }

    console.log('PDF processing successful:', responseData);
    return responseData.measurements;

  } catch (error: any) {
    console.error('Error in processPdfReport:', error);
    
    // Provide more specific error messages based on the error type
    if (axios.isAxiosError(error)) {
      const responseData = error.response?.data;
      console.error('Full error response:', responseData);
      throw new Error(
        `API Error: ${responseData?.error || error.response?.data?.error || error.message}`
      );
    }
    
    throw new Error(error.message || 'Failed to process PDF report');
  }
}

// Other existing functions remain unchanged...
