import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import pdfParse from "npm:pdf-parse@1.1.1";
import { extractMeasurements } from "./measurementExtractor.ts";

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
    console.log('Processing PDF request...');
    const formData = await req.formData();
    const file = formData.get('file');
    
    if (!file || !(file instanceof File)) {
      console.error('No PDF file provided');
      return new Response(
        JSON.stringify({ error: 'No PDF file provided' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Converting file to ArrayBuffer:', file.name, 'Size:', file.size);
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    console.log('Parsing PDF content...');
    const data = await pdfParse(uint8Array);
    console.log('PDF parsed successfully, text length:', data.text.length);
    
    console.log('Extracting measurements from text...');
    const { measurements, debugInfo } = extractMeasurements(data.text);

    if (!measurements.total_area) {
      console.error('Could not extract total area from PDF');
      return new Response(
        JSON.stringify({
          error: 'Could not extract roof area from PDF',
          details: 'Required measurement "total_area" not found',
          debug: {
            ...debugInfo,
            text_preview: data.text.substring(0, 1000),
            text_length: data.text.length
          }
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Measurements extracted successfully:', Object.keys(measurements).length, 'fields found');
    return new Response(
      JSON.stringify({
        measurements,
        debug: debugInfo,
        text_length: data.text.length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error processing PDF:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString(),
        stack: error.stack
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});