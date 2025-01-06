import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateEstimateParams } from "./validation.ts";
import { calculateEstimate } from "./calculator.ts";

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
    console.log('Processing estimate generation request');
    
    const params = await req.json();
    console.log('Received params:', params);

    // Validate input parameters
    const validatedParams = validateEstimateParams(params);
    
    // Calculate estimate
    const estimate = calculateEstimate(validatedParams);
    console.log('Generated estimate:', estimate);

    return new Response(
      JSON.stringify(estimate),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );
  } catch (error) {
    console.error('Error generating estimate:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      }
    );
  }
});