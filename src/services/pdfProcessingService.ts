import { supabase } from "@/integrations/supabase/client";

export const processPdfFile = async (
  file: File,
  profitMargin: number,
  roofingType: string
) => {
  console.log('Processing PDF file:', file.name);

  try {
    // Upload file to storage first
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

    // Get the public URL for the uploaded file
    const { data: publicUrlData } = await supabase.storage
      .from('eagleview-reports')
      .getPublicUrl(filePath);

    if (!publicUrlData?.publicUrl) {
      throw new Error('Failed to get public URL for the uploaded file');
    }

    console.log('File uploaded, public URL:', publicUrlData.publicUrl);

    // Process the PDF using Edge Function
    const { data, error } = await supabase.functions.invoke('process-pdf-report', {
      body: {
        fileUrl: publicUrlData.publicUrl,
        profitMargin,
        roofingType
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (error) {
      console.error('Processing error:', error);
      throw new Error(error.message || 'Error processing PDF');
    }

    if (!data?.measurements?.total_area) {
      throw new Error('Could not extract roof area from PDF. Please make sure you uploaded an EagleView report.');
    }

    return data;
  } catch (error) {
    console.error('Error in processPdfFile:', error);
    throw error;
  }
};