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

    console.log('File received:', file.name, 'Size:', file.size);

    // Read the file content
    const arrayBuffer = await file.arrayBuffer();
    const textDecoder = new TextDecoder('utf-8');
    const fileContent = textDecoder.decode(arrayBuffer);

    console.log('Content length:', fileContent.length);
    console.log('First 1000 chars:', fileContent.substring(0, 1000));

    // Enhanced regex patterns for better matching
    const totalAreaPatterns = [
      /Total\s*(?:Roof)?\s*Area\s*[:=]?\s*([\d,\.]+)/i,
      /Roof\s*Area\s*Total\s*[:=]?\s*([\d,\.]+)/i,
      /Total\s*Area\s*[:=]?\s*([\d,\.]+)\s*(?:sq\.?\s*ft\.?|sqft|sf)/i,
      /Area\s*Total\s*[:=]?\s*([\d,\.]+)/i
    ];

    let totalArea = 0;
    let matchFound = false;

    for (const pattern of totalAreaPatterns) {
      const match = fileContent.match(pattern);
      console.log('Trying pattern:', pattern, 'Match:', match);
      
      if (match && match[1]) {
        totalArea = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(totalArea) && totalArea > 0) {
          matchFound = true;
          console.log('Found valid total area:', totalArea);
          break;
        }
      }
    }

    if (!matchFound || totalArea <= 0) {
      console.error('No valid total area found in content');
      throw new Error('Could not find total roof area in PDF. Please make sure you are uploading a valid EagleView report.');
    }

    // Extract pitch with fallback
    const pitchPattern = /(?:Predominant|Main|Primary)\s*Pitch\s*[:=]?\s*(\d+\/\d+)/i;
    const pitchMatch = fileContent.match(pitchPattern);
    const defaultPitch = "4/12";
    const pitch = pitchMatch ? pitchMatch[1] : defaultPitch;

    // Extract waste percentage with fallback
    const wastePattern = /(?:Suggested|Recommended)\s*Waste\s*[:=]?\s*(\d+)/i;
    const wasteMatch = fileContent.match(wastePattern);
    const suggestedWaste = wasteMatch ? parseInt(wasteMatch[1]) : 15;

    const measurements = {
      totalArea,
      pitchBreakdown: [{
        pitch: pitch,
        area: totalArea
      }],
      suggestedWaste,
      // Additional measurements
      ridgesLength: extractMeasurement(fileContent, /Ridge[s]?\s*Length\s*[:=]?\s*([\d,\.]+)/i),
      valleysLength: extractMeasurement(fileContent, /Valley[s]?\s*Length\s*[:=]?\s*([\d,\.]+)/i),
      rakesLength: extractMeasurement(fileContent, /Rake[s]?\s*Length\s*[:=]?\s*([\d,\.]+)/i),
      eavesLength: extractMeasurement(fileContent, /Eave[s]?\s*Length\s*[:=]?\s*([\d,\.]+)/i),
      flashingLength: extractMeasurement(fileContent, /Flashing\s*Length\s*[:=]?\s*([\d,\.]+)/i),
      stepFlashingLength: extractMeasurement(fileContent, /Step\s*Flashing\s*Length\s*[:=]?\s*([\d,\.]+)/i)
    };

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

function extractMeasurement(text: string, pattern: RegExp): number {
  const match = text.match(pattern);
  if (match && match[1]) {
    const value = parseFloat(match[1].replace(/,/g, ''));
    return isNaN(value) ? 0 : value;
  }
  return 0;
}