import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { TextExtractor } from './extractors/text-extractor.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing PDF request');
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response(
        JSON.stringify({ 
          error: 'No file provided',
          measurements: null 
        }),
        { 
          status: 422,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Received file:', file.name, 'Size:', file.size);
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const textExtractor = new TextExtractor();
    console.log('Starting text extraction');
    
    const text = await textExtractor.extractText(uint8Array);
    console.log('Text extracted successfully, length:', text.length);
    
    const measurements = textExtractor.extractMeasurements(text);
    console.log('Parsed measurements:', measurements);

    // Check if we found a valid total area
    if (!measurements.totalArea || measurements.totalArea <= 0) {
      return new Response(
        JSON.stringify({
          error: 'Could not find total area in PDF',
          measurements,
          requiresManualReview: true,
          debug: { extractedText: text.substring(0, 1000) }
        }),
        { 
          status: 422,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ measurements }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error processing PDF:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error processing PDF',
        debug: { error: error instanceof Error ? error.stack : 'No stack trace available' }
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});