import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import pdfParse from "npm:pdf-parse@1.1.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const extractMeasurements = (text: string) => {
  // More flexible patterns with multiple variations
  const patterns = {
    total_area: [
      /Total Area \(All Pitches\)\s*=\s*([\d,]+)/i,
      /Total Roof Area\s*=\s*([\d,]+)/i,
      /Total Area\s*=\s*([\d,]+)/i,
      /Roof Area\s*=\s*([\d,]+)/i
    ],
    total_roof_facets: [
      /Total Roof Facets\s*=\s*(\d+)/i,
      /Roof Facets\s*=\s*(\d+)/i,
      /Total Facets\s*=\s*(\d+)/i
    ],
    predominant_pitch: [
      /Predominant Pitch\s*=\s*(\d+)\/12/i,
      /Primary Pitch\s*=\s*(\d+)\/12/i,
      /Main Pitch\s*=\s*(\d+)\/12/i
    ],
    number_of_stories: [
      /Number of Stories\s*<=\s*(\d+)/i,
      /Stories\s*=\s*(\d+)/i,
      /Building Height\s*=\s*(\d+)\s*stories/i
    ],
    ridges: [
      /Ridges\s*=\s*(\d+)\s*ft\s*\((\d+)\s*Ridges?\)/i,
      /Ridge Length\s*=\s*(\d+)\s*ft\s*\((\d+)\)/i
    ],
    hips: [
      /Hips\s*=\s*(\d+)\s*ft\s*\((\d+)\s*Hips?\)/i,
      /Hip Length\s*=\s*(\d+)\s*ft\s*\((\d+)\)/i
    ],
    valleys: [
      /Valleys\s*=\s*(\d+)\s*ft\s*\((\d+)\s*Valleys?\)/i,
      /Valley Length\s*=\s*(\d+)\s*ft\s*\((\d+)\)/i
    ],
    rakes: [
      /Rakes†?\s*=\s*(\d+)\s*ft\s*\((\d+)\s*Rakes?\)/i,
      /Rake Length\s*=\s*(\d+)\s*ft\s*\((\d+)\)/i
    ],
    eaves: [
      /Eaves\/Starter‡?\s*=\s*(\d+)\s*ft\s*\((\d+)\s*Eaves?\)/i,
      /Eave Length\s*=\s*(\d+)\s*ft\s*\((\d+)\)/i
    ],
    total_penetrations: [
      /Total Penetrations\s*=\s*(\d+)/i,
      /Number of Penetrations\s*=\s*(\d+)/i
    ],
    total_penetrations_area: [
      /Total Penetrations Area\s*=\s*(\d+)\s*sq\s*ft/i,
      /Penetrations Area\s*=\s*(\d+)\s*sq\s*ft/i
    ],
    waste_table: [
      /Waste %\s*\n((?:(?:\d+%)\s*\n)+)Area \(Sq ft\)\s*\n((?:[\d,]+\s*\n)+)Squares \*\s*\n((?:[\d.]+\s*\n)+)/s,
      /Waste[^\n]*\n((?:\d+%\s*)+)(?:Area|Square Feet)[^\n]*\n((?:[\d,]+\s*)+)/s
    ]
  };

  const measurements: any = {};
  const debugInfo: any = {
    matched_patterns: {},
    text_samples: {}
  };

  const tryPatterns = (patterns: RegExp[], text: string) => {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match;
    }
    return null;
  };

  for (const [key, patternList] of Object.entries(patterns)) {
    debugInfo.text_samples[key] = text.substring(0, 1000);
    const match = tryPatterns(patternList, text);
    debugInfo.matched_patterns[key] = !!match;

    if (match) {
      if (key === 'waste_table') {
        try {
          const percentages = match[1].trim().split('\n').map(p => parseInt(p));
          const areas = match[2].trim().split('\n').map(a => parseFloat(a.replace(',', '')));
          const squares = match[3]?.trim().split('\n').map(s => parseFloat(s)) || [];
          
          const wasteEntries = percentages.map((percentage, i) => ({
            percentage,
            area: areas[i],
            squares: squares[i] || areas[i] / 100,
            is_suggested: i === Math.floor(percentages.length / 2)
          }));
          
          measurements[key] = wasteEntries;
          measurements.suggested_waste_percentage = percentages[Math.floor(percentages.length / 2)];
        } catch (e) {
          debugInfo.waste_table_error = e.message;
        }
      } else if (['ridges', 'hips', 'valleys', 'rakes', 'eaves'].includes(key)) {
        measurements[key] = {
          length: parseFloat(match[1]),
          count: parseInt(match[2])
        };
      } else {
        const value = match[1].replace(',', '');
        measurements[key] = value.includes('.') || !isNaN(value) ? parseFloat(value) : value;
      }
    }
  }

  return { measurements, debugInfo };
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing PDF request...');
    const formData = await req.formData();
    const file = formData.get('file');
    
    if (!file || !(file instanceof File)) {
      console.error('No PDF file provided');
      return new Response(
        JSON.stringify({ error: 'No PDF file provided' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Converting file to ArrayBuffer:', file.name, 'Size:', file.size);
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    console.log('Parsing PDF content...');
    const data = await pdfParse(uint8Array);
    console.log('PDF parsed successfully, text length:', data.text.length);
    
    console.log('Extracting measurements from text...');
    const { measurements, debugInfo } = extractMeasurements(data.text);

    if (!measurements.total_area) {
      console.error('Could not extract total area from PDF');
      return new Response(
        JSON.stringify({
          error: 'Could not extract roof area from PDF',
          details: 'Required measurement "total_area" not found',
          debug: {
            ...debugInfo,
            text_preview: data.text.substring(0, 1000),
            text_length: data.text.length
          }
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Measurements extracted successfully:', measurements);
    return new Response(
      JSON.stringify({
        measurements,
        debug: debugInfo,
        text_length: data.text.length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error processing PDF:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString(),
        stack: error.stack
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});