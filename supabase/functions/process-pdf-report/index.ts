import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { extractWithOpenAI } from "./openaiExtractor.ts";
import { cleanText } from "./utils/text-processing.ts";

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
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Processing PDF file:', file.name);
    
    // Read the file content
    const fileContent = await file.text();
    const cleanedText = cleanText(fileContent);
    
    console.log('Sample of cleaned text:', cleanedText.substring(0, 1000));
    console.log('Cleaned text length:', cleanedText.length);

    try {
      // Extract measurements using OpenAI
      const measurements = await extractWithOpenAI(cleanedText);
      console.log('Extracted measurements:', measurements);

      return new Response(
        JSON.stringify({ measurements }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    } catch (error) {
      // Handle measurement not found errors as 422
      if (error.name === 'MeasurementNotFoundError') {
        return new Response(
          JSON.stringify({ error: error.message }),
          { 
            status: 422,
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          }
        );
      }
      // Re-throw other errors to be handled as 500
      throw error;
    }
  } catch (error) {
    console.error('Error processing PDF:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});