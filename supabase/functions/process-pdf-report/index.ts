import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { TextExtractor } from './extractors/text-extractor.ts';

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
    console.log('Processing PDF request');
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('No file provided');
    }

    console.log('Received file:', file.name);
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const textExtractor = new TextExtractor();
    
    console.log('Starting text extraction');
    const text = await textExtractor.extractText(uint8Array);
    console.log('Text extracted, length:', text.length);
    
    console.log('Parsing measurements');
    const measurements = textExtractor.extractMeasurements(text);
    console.log('Parsed measurements:', measurements);

    if (!measurements.totalArea) {
      throw new Error('Could not extract total area from PDF');
    }

    return new Response(
      JSON.stringify({ 
        measurements,
        debug: { text: text.substring(0, 500) + '...' } 
      }),
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});