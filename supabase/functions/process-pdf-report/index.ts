import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    console.log('File received:', file.name);

    // Read the file content as text
    const fileContent = await file.text();
    console.log('Raw file content length:', fileContent.length);

    // Enhanced regex patterns with more variations and better logging
    const measurements = {
      totalArea: extractNumberWithLog(fileContent, /Total\s*(?:Roof)?\s*Area\s*[:\s=]+(\d+(?:\.\d+)?)/i, 'Total Area'),
      totalSquares: extractNumberWithLog(fileContent, /Total\s*(?:Roof)?\s*Squares\s*[:\s=]+(\d+(?:\.\d+)?)/i, 'Total Squares'),
      predominantPitch: extractStringWithLog(fileContent, /(?:Predominant|Main)\s*Pitch\s*[:\s=]+(\d+\/\d+)/i, 'Predominant Pitch'),
      ridgesLength: extractNumberWithLog(fileContent, /(?:Total\s*)?Ridges?\s*Length\s*[:\s=]+(\d+(?:\.\d+)?)/i, 'Ridges Length'),
      ridgesCount: extractNumberWithLog(fileContent, /(?:Total\s*)?Ridges?\s*Count\s*[:\s=]+(\d+)/i, 'Ridges Count'),
      hipsLength: extractNumberWithLog(fileContent, /(?:Total\s*)?Hips?\s*Length\s*[:\s=]+(\d+(?:\.\d+)?)/i, 'Hips Length'),
      hipsCount: extractNumberWithLog(fileContent, /(?:Total\s*)?Hips?\s*Count\s*[:\s=]+(\d+)/i, 'Hips Count'),
      valleysLength: extractNumberWithLog(fileContent, /(?:Total\s*)?Valleys?\s*Length\s*[:\s=]+(\d+(?:\.\d+)?)/i, 'Valleys Length'),
      valleysCount: extractNumberWithLog(fileContent, /(?:Total\s*)?Valleys?\s*Count\s*[:\s=]+(\d+)/i, 'Valleys Count'),
      rakesLength: extractNumberWithLog(fileContent, /(?:Total\s*)?Rakes?\s*Length\s*[:\s=]+(\d+(?:\.\d+)?)/i, 'Rakes Length'),
      rakesCount: extractNumberWithLog(fileContent, /(?:Total\s*)?Rakes?\s*Count\s*[:\s=]+(\d+)/i, 'Rakes Count'),
      eavesLength: extractNumberWithLog(fileContent, /(?:Total\s*)?Eaves?\s*Length\s*[:\s=]+(\d+(?:\.\d+)?)/i, 'Eaves Length'),
      eavesCount: extractNumberWithLog(fileContent, /(?:Total\s*)?Eaves?\s*Count\s*[:\s=]+(\d+)/i, 'Eaves Count'),
      dripEdgeLength: extractNumberWithLog(fileContent, /Drip\s*Edge\s*Length\s*[:\s=]+(\d+(?:\.\d+)?)/i, 'Drip Edge Length'),
      flashingLength: extractNumberWithLog(fileContent, /(?:Total\s*)?Flashing\s*Length\s*[:\s=]+(\d+(?:\.\d+)?)/i, 'Flashing Length'),
      flashingCount: extractNumberWithLog(fileContent, /(?:Total\s*)?Flashing\s*Count\s*[:\s=]+(\d+)/i, 'Flashing Count'),
      stepFlashingLength: extractNumberWithLog(fileContent, /Step\s*Flashing\s*Length\s*[:\s=]+(\d+(?:\.\d+)?)/i, 'Step Flashing Length'),
      stepFlashingCount: extractNumberWithLog(fileContent, /Step\s*Flashing\s*Count\s*[:\s=]+(\d+)/i, 'Step Flashing Count'),
      totalPenetrationsArea: extractNumberWithLog(fileContent, /Total\s*Penetrations?\s*Area\s*[:\s=]+(\d+(?:\.\d+)?)/i, 'Total Penetrations Area'),
      suggestedWaste: extractNumberWithLog(fileContent, /(?:Suggested|Recommended)\s*Waste(?:\s*Factor)?\s*[:\s=]+(\d+(?:\.\d+)?)/i, 'Suggested Waste'),
      wasteFactorArea: extractNumberWithLog(fileContent, /Waste\s*Factor\s*Area\s*[:\s=]+(\d+(?:\.\d+)?)/i, 'Waste Factor Area'),
      wasteFactorSquares: extractNumberWithLog(fileContent, /Waste\s*Factor\s*Squares\s*[:\s=]+(\d+(?:\.\d+)?)/i, 'Waste Factor Squares'),
      roofingType: extractStringWithLog(fileContent, /Roofing\s*Type\s*[:\s=]+([^\n\r]+)/i, 'Roofing Type'),
      structureComplexity: extractStringWithLog(fileContent, /Structure\s*Complexity\s*[:\s=]+([^\n\r]+)/i, 'Structure Complexity'),
      wasteNote: extractStringWithLog(fileContent, /Waste\s*Note\s*[:\s=]+([^\n\r]+)/i, 'Waste Note'),
    };

    // Extract areas per pitch using a more flexible regex
    const pitchAreas: Record<string, number> = {};
    const pitchPattern = /(\d+\/\d+)\s*(?:pitch|slope).*?(\d+(?:\.\d+)?)\s*(?:sq\.?\s*ft\.?|sqft|sf)/gi;
    let match;
    
    console.log('Searching for pitch areas in content...');
    while ((match = pitchPattern.exec(fileContent)) !== null) {
      const pitch = match[1];
      const area = parseFloat(match[2]);
      if (!isNaN(area)) {
        console.log(`Found pitch area: ${pitch} = ${area} sq ft`);
        pitchAreas[pitch] = (pitchAreas[pitch] || 0) + area;
      }
    }
    measurements['areasPerPitch'] = pitchAreas;

    // Log the first 500 characters of content for debugging
    console.log('First 500 chars of content:', fileContent.substring(0, 500));
    
    // Log extracted measurements
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

// Helper functions with logging
function extractNumberWithLog(text: string, pattern: RegExp, fieldName: string): number {
  const match = text.match(pattern);
  if (match && match[1]) {
    const value = parseFloat(match[1].replace(/,/g, ''));
    console.log(`Extracted ${fieldName}:`, value);
    return isNaN(value) ? 0 : value;
  }
  console.log(`No match found for ${fieldName}`);
  return 0;
}

function extractStringWithLog(text: string, pattern: RegExp, fieldName: string): string {
  const match = text.match(pattern);
  const value = match && match[1] ? match[1].trim() : '';
  console.log(`Extracted ${fieldName}:`, value);
  return value;
}