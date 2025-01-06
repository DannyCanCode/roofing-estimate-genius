import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { extractTextContent, logTextContent } from "./utils/textExtractor.ts";
import { 
  extractTotalArea,
  extractMeasurement,
  extractPitchBreakdown
} from "./utils/measurementExtractor.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing PDF report...');

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      throw new Error('No file provided');
    }

    console.log('File received:', file.name, 'Size:', file.size);

    // Read and process the file content
    const arrayBuffer = await file.arrayBuffer();
    const textDecoder = new TextDecoder('utf-8');
    const fileContent = textDecoder.decode(arrayBuffer);
    
    // Clean and log the text content
    const processedText = extractTextContent(fileContent);
    logTextContent(processedText);

    // Extract measurements
    const totalArea = extractTotalArea(processedText);
    console.log('Successfully extracted total area:', totalArea);

    // Extract other measurements
    const ridges = extractMeasurement(processedText, /Ridges\s*=\s*(\d+)\s*ft\s*\((\d+)\s*Ridges?\)/i);
    const valleys = extractMeasurement(processedText, /Valleys\s*=\s*(\d+)\s*ft\s*\((\d+)\s*Valleys?\)/i);
    const pitchBreakdown = extractPitchBreakdown(processedText);

    const measurements = {
      totalArea,
      pitchBreakdown: pitchBreakdown.length > 0 ? pitchBreakdown : [{
        pitch: "4/12",
        area: totalArea
      }],
      ridgesLength: ridges.length,
      ridgesCount: ridges.count,
      valleysLength: valleys.length,
      valleysCount: valleys.count
    };

    console.log('Final measurements:', measurements);

    return new Response(
      JSON.stringify(measurements),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.error('Error processing PDF:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }
});