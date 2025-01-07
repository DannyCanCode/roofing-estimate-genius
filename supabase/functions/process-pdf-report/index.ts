import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { extractMeasurements } from "./measurementExtractor.ts";
import { extractWithOpenAI } from "./openaiExtractor.ts";

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
    
    // Convert ArrayBuffer to text, handling potential binary data
    const decoder = new TextDecoder('utf-8');
    let text = decoder.decode(arrayBuffer);
    
    // Clean up binary artifacts and PDF syntax
    text = text.replace(/%PDF-.*?%%EOF/gs, '')
              .replace(/<</g, '')
              .replace(/>>/g, '')
              .replace(/endobj/g, '')
              .replace(/endstream/g, '')
              .replace(/\r\n/g, '\n')
              .replace(/\x00/g, '') // Remove null bytes
              .replace(/[^\x20-\x7E\n]/g, ' ') // Keep only printable ASCII
              .replace(/\s+/g, ' ')
              .trim();
    
    console.log('Cleaned text length:', text.length);
    console.log('Sample of cleaned text:', text.substring(0, 200));
    
    try {
      console.log('Attempting OpenAI extraction first');
      const openAiMeasurements = await extractWithOpenAI(text);
      console.log('OpenAI extraction result:', openAiMeasurements);
      
      if (openAiMeasurements.total_area && openAiMeasurements.total_area > 0) {
        return new Response(
          JSON.stringify({ measurements: openAiMeasurements }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (openAiError) {
      console.error('OpenAI extraction failed:', openAiError);
    }

    // Fallback to pattern matching
    console.log('Falling back to pattern matching');
    const { measurements, debugInfo } = extractMeasurements(text);
    
    if (!measurements.total_area || measurements.total_area <= 0) {
      return new Response(
        JSON.stringify({
          error: 'Could not find total area in PDF',
          measurements,
          requiresManualReview: true,
          debug: { 
            extractedText: text.substring(0, 1000),
            patterns: debugInfo.matched_patterns
          }
        }),
        { 
          status: 422,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ measurements }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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