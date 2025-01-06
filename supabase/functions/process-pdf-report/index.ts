import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const REGEX_PATTERNS = {
  // Primary patterns for total area
  totalArea: /Total Area \(All Pitches\)\s*=\s*([\d,]+)/i,
  alternativeTotalArea: /Total\s*(?:Roof)?\s*Area\s*[:=]?\s*([\d,]+)/i,
  
  // Pitch patterns
  predominantPitch: /Predominant Pitch\s*=\s*(\d+)\/12/i,
  alternativePitch: /(?:Predominant|Main|Primary)\s*Pitch\s*[:=]?\s*(\d+)\/\d+/i,
  
  // Length measurements
  ridges: /Ridges\s*=\s*(\d+)\s*ft\s*\((\d+)\s*Ridges?\)/i,
  hips: /Hips\s*=\s*(\d+)\s*ft\s*\((\d+)\s*Hips?\)/i,
  valleys: /Valleys\s*=\s*(\d+)\s*ft\s*\((\d+)\s*Valleys?\)/i,
  rakes: /Rakes\s*=\s*(\d+)\s*ft\s*\((\d+)\s*Rakes?\)/i,
  eaves: /Eaves\s*=\s*(\d+)\s*ft\s*\((\d+)\s*Eaves?\)/i,
  
  // Waste table pattern
  wasteTable: /Waste %\s*\n((?:(?:\d+%)\s*\n)+)Area \(Sq ft\)\s*\n((?:[\d,]+\s*\n)+)Squares \*\s*\n((?:[\d.]+\s*\n)+)/,
  
  // Areas per pitch patterns
  areasPerPitch: /Areas per Pitch.*?(\d+\/12.*?(?=\n\n|\Z))/s,
  pitchDetails: /(\d+)\/12\s*=?\s*([\d,]+)(?:\s*sq\s*ft)?\s*\(?(\d+\.?\d*)%\)?/g
};

function extractNumber(text: string, pattern: RegExp): number {
  console.log('Extracting number with pattern:', pattern);
  const match = text.match(pattern);
  if (match && match[1]) {
    const value = parseFloat(match[1].replace(/,/g, ''));
    console.log('Extracted value:', value);
    return value;
  }
  console.log('No match found for pattern');
  return 0;
}

function extractMeasurement(text: string, pattern: RegExp): { length: number; count: number } {
  const match = text.match(pattern);
  if (match && match[1] && match[2]) {
    return {
      length: parseFloat(match[1]),
      count: parseInt(match[2])
    };
  }
  return { length: 0, count: 0 };
}

function extractWastePercentage(text: string): number {
  const match = text.match(REGEX_PATTERNS.wasteTable);
  if (match && match[1]) {
    const percentages = match[1].trim().split('\n')
      .map(p => parseInt(p))
      .filter(p => !isNaN(p));
    
    if (percentages.length > 0) {
      const middleIndex = Math.floor(percentages.length / 2);
      return percentages[middleIndex];
    }
  }
  return 15; // Default waste percentage
}

function extractPitchBreakdown(text: string): { pitch: string; area: number }[] {
  const breakdown: { pitch: string; area: number }[] = [];
  const areasMatch = text.match(REGEX_PATTERNS.areasPerPitch);
  
  if (areasMatch && areasMatch[1]) {
    const pitchSection = areasMatch[1];
    let match;
    
    while ((match = REGEX_PATTERNS.pitchDetails.exec(pitchSection)) !== null) {
      const pitch = `${match[1]}/12`;
      const area = parseFloat(match[2].replace(/,/g, ''));
      if (!isNaN(area) && area > 0) {
        breakdown.push({ pitch, area });
      }
    }
  }
  
  return breakdown;
}

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

    // Extract total area using multiple patterns
    let totalArea = extractNumber(fileContent, REGEX_PATTERNS.totalArea);
    if (totalArea === 0) {
      console.log('Trying alternative total area pattern...');
      totalArea = extractNumber(fileContent, REGEX_PATTERNS.alternativeTotalArea);
    }

    if (!totalArea || totalArea <= 0) {
      console.error('No valid total area found in content');
      throw new Error('Could not find total roof area in PDF. Please make sure you are uploading a valid EagleView report.');
    }

    console.log('Successfully extracted total area:', totalArea);

    // Extract pitch with fallback
    let pitchMatch = fileContent.match(REGEX_PATTERNS.predominantPitch);
    if (!pitchMatch) {
      pitchMatch = fileContent.match(REGEX_PATTERNS.alternativePitch);
    }
    const pitch = pitchMatch ? `${pitchMatch[1]}/12` : "4/12";
    console.log('Extracted pitch:', pitch);

    // Extract measurements
    const ridges = extractMeasurement(fileContent, REGEX_PATTERNS.ridges);
    const hips = extractMeasurement(fileContent, REGEX_PATTERNS.hips);
    const valleys = extractMeasurement(fileContent, REGEX_PATTERNS.valleys);
    const rakes = extractMeasurement(fileContent, REGEX_PATTERNS.rakes);
    const eaves = extractMeasurement(fileContent, REGEX_PATTERNS.eaves);

    // Extract waste percentage
    const suggestedWaste = extractWastePercentage(fileContent);
    console.log('Extracted waste percentage:', suggestedWaste);

    // Extract pitch breakdown
    const pitchBreakdown = extractPitchBreakdown(fileContent);
    console.log('Extracted pitch breakdown:', pitchBreakdown);

    const measurements = {
      totalArea,
      pitchBreakdown: pitchBreakdown.length > 0 ? pitchBreakdown : [{
        pitch: pitch,
        area: totalArea
      }],
      suggestedWaste,
      // Additional measurements
      ridgesLength: ridges.length,
      ridgesCount: ridges.count,
      valleysLength: valleys.length,
      valleysCount: valleys.count,
      hipsLength: hips.length,
      hipsCount: hips.count,
      rakesLength: rakes.length,
      rakesCount: rakes.count,
      eavesLength: eaves.length,
      eavesCount: eaves.count
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