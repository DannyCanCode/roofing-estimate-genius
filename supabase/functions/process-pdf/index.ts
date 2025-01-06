import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import * as pdfjsLib from "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/+esm";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PRICING = {
  MATERIALS: {
    shingles: 152.10, // GAF Timberline HDZ SG Shingles per square
    ridgeCap: 66.41,  // GAF Seal-A-Ridge per bundle
    starterStrip: 63.25, // GAF ProStart per box
    underlayment: 104.94, // GAF FeltBuster per roll (10 squares)
    iceAndWater: 117.50, // per roll (2 squares)
    dripEdge: 7.50,   // per 10' piece
    nails: 66.69,     // per box (4500 count)
    plumbingBoots: 53.75, // each (3")
    plywood: 21.80    // per board
  },
  LABOR_RATES: {
    '4/12-7/12': 100.00,
    '8/12-9/12': 110.00,
    '10/12-12/12': 150.00,
    '13/12-16/12': 171.68,
    'flat': 85.00     // for 0/12 pitch
  },
  ADDITIONAL_CHARGES: {
    twoStory: 10.90,  // per square
    tripCharge: 327.00, // flat rate
    keepGutters: 1.38,  // per square
    flashing: 5.45,     // per unit
    dumpster: 687.50,   // 12 yard
    permitsAndInspections: 2500.00
  },
  FLAT_ROOF: {
    baseCap: 75.00,   // per square
    iso: 45.00        // per square
  }
}

interface Measurements {
  totalRoofArea: string | null;
  totalRoofSquares: string | null;
  predominantPitch: string | null;
  ridgesLength: string | null;
  ridgesCount: string | null;
  hipsLength: string | null;
  hipsCount: string | null;
  valleysLength: string | null;
  valleysCount: string | null;
  rakesLength: string | null;
  rakesCount: string | null;
  eavesLength: string | null;
  eavesCount: string | null;
  dripEdgeLength: string | null;
  flashingLength: string | null;
  stepFlashingLength: string | null;
  totalPenetrationsArea: string | null;
  wasteFactorArea: string | null;
  suggestedWasteFactor: string | null;
  flatArea: string | null;
  numberOfStories: string | null;
}

function calculateEstimate(measurements: Measurements, profitMargin: number = 25) {
  const totalArea = measurements.totalRoofArea ? parseFloat(measurements.totalRoofArea.replace(/,/g, '')) : 0
  const flatArea = measurements.flatArea ? parseFloat(measurements.flatArea.replace(/,/g, '')) : 0
  const pitch = measurements.predominantPitch ? parseInt(measurements.predominantPitch) : 4
  const stories = measurements.numberOfStories ? parseInt(measurements.numberOfStories) : 1
  const wasteFactor = Math.max(measurements.suggestedWasteFactor ? parseFloat(measurements.suggestedWasteFactor) : 12, 12) / 100

  // Calculate squares needed with waste factor
  const totalSquares = Math.ceil((totalArea - flatArea) / 100 * (1 + wasteFactor))
  const flatSquares = Math.ceil(flatArea / 100 * (1 + wasteFactor))

  // Determine labor rate based on pitch
  let laborRate = PRICING.LABOR_RATES['4/12-7/12']
  if (pitch >= 13) laborRate = PRICING.LABOR_RATES['13/12-16/12']
  else if (pitch >= 10) laborRate = PRICING.LABOR_RATES['10/12-12/12']
  else if (pitch >= 8) laborRate = PRICING.LABOR_RATES['8/12-9/12']

  const calculatedPricing = {
    // Sloped roof materials
    shingles: totalSquares * PRICING.MATERIALS.shingles,
    underlayment: Math.ceil(totalSquares / 10) * PRICING.MATERIALS.underlayment,
    iceAndWater: Math.ceil(totalSquares / 2) * PRICING.MATERIALS.iceAndWater,
    
    // Flat roof materials (if any)
    flatRoofMaterials: flatSquares * (PRICING.FLAT_ROOF.baseCap + PRICING.FLAT_ROOF.iso),
    
    // Labor costs
    slopedRoofLabor: totalSquares * laborRate,
    flatRoofLabor: flatSquares * PRICING.LABOR_RATES.flat,
    
    // Additional charges
    twoStoryCharge: stories > 1 ? (totalSquares + flatSquares) * PRICING.ADDITIONAL_CHARGES.twoStory : 0,
    tripCharge: PRICING.ADDITIONAL_CHARGES.tripCharge,
    dumpster: PRICING.ADDITIONAL_CHARGES.dumpster,
    permitsAndInspections: PRICING.ADDITIONAL_CHARGES.permitsAndInspections,
  }

  // Calculate totals
  const subtotal = Object.values(calculatedPricing).reduce((a, b) => a + b, 0)
  const profitAmount = subtotal * (profitMargin / 100)
  const total = subtotal + profitAmount

  return {
    ...calculatedPricing,
    subtotal,
    profitAmount,
    total,
    details: {
      totalSquares,
      flatSquares,
      wasteFactor: wasteFactor * 100,
      laborRate,
      stories
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const profitMargin = parseFloat(formData.get('profitMargin') as string) || 25;

    if (!file) {
      throw new Error('No file provided');
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
    const pdf = await loadingTask.promise;

    let allText = '';
    let debugText = '';
    const extractionStatus: Record<string, boolean> = {};

    // Process first 3 pages only for efficiency
    const pagesToProcess = Math.min(pdf.numPages, 3);
    
    for (let i = 1; i <= pagesToProcess; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: any) => item.str).join(' ');
      allText += pageText + ' ';
      if (i === 1) debugText = pageText.substring(0, 500); // Store first 500 chars for debugging
    }

    const measurements: Measurements = {
      totalRoofArea: extractMeasurement(allText, /Total Area[^=\n]*=\s*([\d,]+)/i, extractionStatus, 'totalRoofArea'),
      totalRoofSquares: extractMeasurement(allText, /Total Squares[^=\n]*=\s*([\d.]+)/i, extractionStatus, 'totalRoofSquares'),
      predominantPitch: extractMeasurement(allText, /Predominant Pitch[^=\n]*=\s*(\d+)\/12/i, extractionStatus, 'predominantPitch'),
      ridgesLength: extractMeasurement(allText, /Ridges[^=\n]*=\s*(\d+)\s*ft/i, extractionStatus, 'ridgesLength'),
      ridgesCount: extractMeasurement(allText, /Ridges[^=\n]*Count[^=\n]*=\s*(\d+)/i, extractionStatus, 'ridgesCount'),
      hipsLength: extractMeasurement(allText, /Hips[^=\n]*=\s*(\d+)\s*ft/i, extractionStatus, 'hipsLength'),
      hipsCount: extractMeasurement(allText, /Hips[^=\n]*Count[^=\n]*=\s*(\d+)/i, extractionStatus, 'hipsCount'),
      valleysLength: extractMeasurement(allText, /Valleys[^=\n]*=\s*(\d+)\s*ft/i, extractionStatus, 'valleysLength'),
      valleysCount: extractMeasurement(allText, /Valleys[^=\n]*Count[^=\n]*=\s*(\d+)/i, extractionStatus, 'valleysCount'),
      rakesLength: extractMeasurement(allText, /Rakes[^=\n]*=\s*(\d+)\s*ft/i, extractionStatus, 'rakesLength'),
      rakesCount: extractMeasurement(allText, /Rakes[^=\n]*Count[^=\n]*=\s*(\d+)/i, extractionStatus, 'rakesCount'),
      eavesLength: extractMeasurement(allText, /Eaves[^=\n]*=\s*(\d+)\s*ft/i, extractionStatus, 'eavesLength'),
      eavesCount: extractMeasurement(allText, /Eaves[^=\n]*Count[^=\n]*=\s*(\d+)/i, extractionStatus, 'eavesCount'),
      dripEdgeLength: extractMeasurement(allText, /Drip Edge[^=\n]*=\s*(\d+)\s*ft/i, extractionStatus, 'dripEdgeLength'),
      flashingLength: extractMeasurement(allText, /Flashing[^=\n]*=\s*(\d+)\s*ft/i, extractionStatus, 'flashingLength'),
      stepFlashingLength: extractMeasurement(allText, /Step Flashing[^=\n]*=\s*(\d+)\s*ft/i, extractionStatus, 'stepFlashingLength'),
      totalPenetrationsArea: extractMeasurement(allText, /Total Penetrations[^=\n]*=\s*(\d+)/i, extractionStatus, 'totalPenetrationsArea'),
      wasteFactorArea: extractMeasurement(allText, /Waste Factor Area[^=\n]*=\s*(\d+)/i, extractionStatus, 'wasteFactorArea'),
      suggestedWasteFactor: extractMeasurement(allText, /Suggested Waste Factor[^=\n]*=\s*(\d+)/i, extractionStatus, 'suggestedWasteFactor'),
      flatArea: extractMeasurement(allText, /Flat Area[^=\n]*=\s*(\d+)/i, extractionStatus, 'flatArea'),
      numberOfStories: extractMeasurement(allText, /Number of Stories[^=\n]*=\s*(\d+)/i, extractionStatus, 'numberOfStories'),
    };

    // Add debug information
    const debug = {
      textSample: debugText,
      pdfInfo: {
        pageCount: pdf.numPages,
        fileSize: arrayBuffer.byteLength,
      }
    };

    if (!measurements.totalRoofArea) {
      return new Response(
        JSON.stringify({
          error: 'Could not extract roof area. Please ensure this is an EagleView report.',
          debug,
          extractionStatus
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // Calculate pricing
    const pricing = calculateEstimate(measurements, profitMargin);

    return new Response(
      JSON.stringify({
        measurements,
        extractionStatus,
        pricing,
        debug
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error processing PDF:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error processing PDF',
        debug: { error: error instanceof Error ? error.stack : 'No stack trace available' }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

function extractMeasurement(text: string, pattern: RegExp, status: Record<string, boolean>, key: string): string | null {
  const match = text.match(pattern);
  status[key] = !!match;
  return match ? match[1].replace(/,/g, '') : null;
} 