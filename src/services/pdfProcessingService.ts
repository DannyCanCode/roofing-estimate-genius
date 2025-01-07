import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const processPdfFile = async (
  file: File,
  profitMargin: number,
  roofingType: string
) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('profitMargin', profitMargin.toString());
  formData.append('roofingType', roofingType);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration is missing');
  }

  console.log('Uploading to:', `${supabaseUrl}/functions/v1/process-pdf-report`);

  const response = await fetch(
    `${supabaseUrl}/functions/v1/process-pdf-report`,
    {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      }
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! status: ${response.status}. ${errorText}`);
  }

  const data = await response.json();
  
  if (data.error) {
    console.error('Processing error:', data);
    throw new Error(data.error);
  }

  if (!data.measurements?.total_area) {
    throw new Error('Could not extract roof area from PDF. Please make sure you uploaded an EagleView report.');
  }

  return data;
};