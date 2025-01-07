import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { extractWithOpenAI } from "./openaiExtractor.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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
    
    // Read the file content as text
    const text = await file.text();
    
    // Clean and extract meaningful text content
    const cleanedText = text
      .replace(/%PDF.*?(?=%)/gs, '') // Remove PDF header
      .replace(/endobj.*?obj/gs, ' ') // Remove PDF object markers
      .replace(/stream.*?endstream/gs, ' ') // Remove binary streams
      .replace(/[^\x20-\x7E\n]/g, ' ') // Keep only printable ASCII
      .replace(/\s+/g, ' ')
      .trim();

    // Look for common EagleView report markers
    const reportContent = cleanedText.match(/Report.*?Summary|Measurement\s+Report|Total\s+Area|Roof\s+Measurements/i)?.[0] || cleanedText;

    console.log('Cleaned text length:', reportContent.length);
    console.log('Sample of cleaned text:', reportContent.substring(0, 500));

    // Extract measurements using OpenAI
    const measurements = await extractWithOpenAI(reportContent);
    
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