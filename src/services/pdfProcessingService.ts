import { supabase } from "@/integrations/supabase/client";

export const processPdfFile = async (
  file: File,
  profitMargin: number,
  roofingType: string
) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('profitMargin', profitMargin.toString());
  formData.append('roofingType', roofingType);

  console.log('Processing PDF file:', file.name);

  const { data, error } = await supabase.functions.invoke('process-pdf-report', {
    body: formData,
  });

  if (error) {
    console.error('Processing error:', error);
    throw new Error(error.message || 'Error processing PDF');
  }

  if (!data?.measurements?.total_area) {
    throw new Error('Could not extract roof area from PDF. Please make sure you uploaded an EagleView report.');
  }

  return data;
};