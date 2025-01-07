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
    
    // Read the file as text
    const pdfText = await file.text();
    
    // Clean up the text by removing PDF binary data markers and unnecessary whitespace
    const cleanedText = pdfText
      .replace(/%PDF-.*?(?=\n)/g, '')
      .replace(/%%EOF.*$/g, '')
      .replace(/\r\n/g, '\n')
      .replace(/\s+/g, ' ')
      .trim();

    console.log('Cleaned text length:', cleanedText.length);
    console.log('Sample of cleaned text:', cleanedText.substring(0, 500));

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