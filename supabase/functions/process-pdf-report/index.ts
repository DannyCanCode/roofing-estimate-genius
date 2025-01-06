import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing PDF report...');

    // Get the FormData from the request
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      throw new Error('No file provided');
    }

    console.log('File received:', file.name);

    // Here you would process the PDF file
    // For now, we'll return mock data
    const mockMeasurements = {
      totalArea: 2500,
      pitch: "6/12",
      ridges: 60,
      valleys: 30,
      hips: 40,
      rakes: 80,
      eaves: 100,
      flashing: 20,
      chimneys: 2,
      skylights: 1,
      vents: 4,
      suggestedWaste: 15
    };

    console.log('Processed measurements:', mockMeasurements);

    return new Response(
      JSON.stringify(mockMeasurements),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.error('Error processing PDF:', error);

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }
});