import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { TextExtractor } from './extractors/text-extractor.ts';
import { EagleViewParser } from './extractors/eagleview-parser.ts';
import { MeasurementsValidator } from './validators/measurements-validator.ts';

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
    const parser = new EagleViewParser();
    const validator = new MeasurementsValidator();

    console.log('Starting text extraction');
    const text = await textExtractor.extractText(uint8Array);
    console.log('Text extracted, parsing measurements');
    const measurements = parser.parseMeasurements(text);

    if (!validator.validate(measurements)) {
      throw new Error('Invalid measurements extracted from PDF');
    }

    console.log('Successfully processed PDF');
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});