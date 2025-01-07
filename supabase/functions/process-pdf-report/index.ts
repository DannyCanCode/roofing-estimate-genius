import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { extractWithOpenAI } from "./openaiExtractor.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
      throw new Error('No file provided');
    }

    console.log('Processing PDF file:', file.name);
    
    // Read the file content as an array buffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Convert binary data to text, skipping PDF header and binary content
    let text = new TextDecoder().decode(uint8Array);
    
    // Extract text content between common PDF text markers
    const textContent = text.match(/\((.*?)\)/g)?.map(match => 
      match.slice(1, -1)
        .replace(/\\(\d{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
        .replace(/\\[()\\]/g, match => match.charAt(1))
    ).join(' ') || '';

    console.log('Extracted text length:', textContent.length);
    console.log('Sample of extracted text:', textContent.substring(0, 500));

    // Extract measurements using OpenAI
    const measurements = await extractWithOpenAI(textContent);
    
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