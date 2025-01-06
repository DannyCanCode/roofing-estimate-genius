import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    console.log('Processing PDF report...');

    // Get the FormData from the request
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      throw new Error('No file provided');
    }

    console.log('File received:', file.name);

    // Read the file content
    const fileContent = await file.text();
    console.log('File content length:', fileContent.length);

    // Extract measurements using regex patterns
    const measurements = {
      totalArea: extractNumber(fileContent, /Total\s*(?:Roof)?\s*Area[:\s]+(\d+(?:\.\d+)?)/i),
      totalSquares: extractNumber(fileContent, /Total\s*(?:Roof)?\s*Squares[:\s]+(\d+(?:\.\d+)?)/i),
      predominantPitch: extractString(fileContent, /Predominant\s*Pitch[:\s]+(\d+\/\d+)/i),
      ridgesLength: extractNumber(fileContent, /(?:Total\s*)?Ridges?\s*Length[:\s]+(\d+(?:\.\d+)?)/i),
      ridgesCount: extractNumber(fileContent, /(?:Total\s*)?Ridges?\s*Count[:\s]+(\d+)/i),
      hipsLength: extractNumber(fileContent, /(?:Total\s*)?Hips?\s*Length[:\s]+(\d+(?:\.\d+)?)/i),
      hipsCount: extractNumber(fileContent, /(?:Total\s*)?Hips?\s*Count[:\s]+(\d+)/i),
      valleysLength: extractNumber(fileContent, /(?:Total\s*)?Valleys?\s*Length[:\s]+(\d+(?:\.\d+)?)/i),
      valleysCount: extractNumber(fileContent, /(?:Total\s*)?Valleys?\s*Count[:\s]+(\d+)/i),
      rakesLength: extractNumber(fileContent, /(?:Total\s*)?Rakes?\s*Length[:\s]+(\d+(?:\.\d+)?)/i),
      rakesCount: extractNumber(fileContent, /(?:Total\s*)?Rakes?\s*Count[:\s]+(\d+)/i),
      eavesLength: extractNumber(fileContent, /(?:Total\s*)?Eaves?\s*Length[:\s]+(\d+(?:\.\d+)?)/i),
      eavesCount: extractNumber(fileContent, /(?:Total\s*)?Eaves?\s*Count[:\s]+(\d+)/i),
      dripEdgeLength: extractNumber(fileContent, /Drip\s*Edge\s*Length[:\s]+(\d+(?:\.\d+)?)/i),
      flashingLength: extractNumber(fileContent, /(?:Total\s*)?Flashing\s*Length[:\s]+(\d+(?:\.\d+)?)/i),
      flashingCount: extractNumber(fileContent, /(?:Total\s*)?Flashing\s*Count[:\s]+(\d+)/i),
      stepFlashingLength: extractNumber(fileContent, /Step\s*Flashing\s*Length[:\s]+(\d+(?:\.\d+)?)/i),
      stepFlashingCount: extractNumber(fileContent, /Step\s*Flashing\s*Count[:\s]+(\d+)/i),
      totalPenetrationsArea: extractNumber(fileContent, /Total\s*Penetrations?\s*Area[:\s]+(\d+(?:\.\d+)?)/i),
      suggestedWaste: extractNumber(fileContent, /Suggested\s*Waste(?:\s*Factor)?[:\s]+(\d+(?:\.\d+)?)/i),
      wasteFactorArea: extractNumber(fileContent, /Waste\s*Factor\s*Area[:\s]+(\d+(?:\.\d+)?)/i),
      wasteFactorSquares: extractNumber(fileContent, /Waste\s*Factor\s*Squares[:\s]+(\d+(?:\.\d+)?)/i),
      roofingType: extractString(fileContent, /Roofing\s*Type[:\s]+([^\n\r]+)/i),
      structureComplexity: extractString(fileContent, /Structure\s*Complexity[:\s]+([^\n\r]+)/i),
      wasteNote: extractString(fileContent, /Waste\s*Note[:\s]+([^\n\r]+)/i),
    };

    // Extract areas per pitch using a more complex regex
    const pitchAreas: Record<string, number> = {};
    const pitchPattern = /(\d+\/\d+)\s*(?:pitch|slope).*?(\d+(?:\.\d+)?)\s*(?:sq\.?\s*ft\.?|sqft|sf)/gi;
    let match;
    while ((match = pitchPattern.exec(fileContent)) !== null) {
      const pitch = match[1];
      const area = parseFloat(match[2]);
      if (!isNaN(area)) {
        pitchAreas[pitch] = (pitchAreas[pitch] || 0) + area;
      }
    }
    measurements['areasPerPitch'] = pitchAreas;

    console.log('Extracted measurements:', measurements);

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

// Helper functions for extraction
function extractNumber(text: string, pattern: RegExp): number {
  const match = text.match(pattern);
  if (match && match[1]) {
    const value = parseFloat(match[1]);
    return isNaN(value) ? 0 : value;
  }
  return 0;
}

function extractString(text: string, pattern: RegExp): string {
  const match = text.match(pattern);
  return match && match[1] ? match[1].trim() : '';
}