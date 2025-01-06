import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import * as pdfjsLib from "https://cdn.skypack.dev/pdfjs-dist@3.11.174/build/pdf.min.js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400'
};

// Pricing constants based on actual costs
const PRICING = {
  MATERIALS: {
    shingles: 152.10, // per square (retail)
    ridgeCap: 66.41,  // per bundle
    starterStrip: 63.25, // per box
    underlayment: 104.94, // per roll (10 squares)
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
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Request received:', req.method);
    
    if (req.method === 'GET') {
      return new Response(JSON.stringify({ 
        status: 'API is running',
        message: 'Please use POST method to process PDF files'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (req.method !== 'POST') {
      throw new Error(`Method ${req.method} not allowed`);
    }

    console.log('Processing form data...');
    const formData = await req.formData();
    const file = formData.get('file');
    const roofingType = formData.get('roofingType') || 'SHINGLE';
    const profitMargin = parseFloat(formData.get('profitMargin')?.toString() || '25');
    
    console.log('Form data received:', {
      hasFile: !!file,
      roofingType,
      profitMargin
    });

    if (!file || !(file instanceof File)) {
      throw new Error('No PDF file provided');
    }

    console.log('Reading PDF file...');
    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    
    console.log('Loading PDF document...');
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdfDocument = await loadingTask.promise;
    
    console.log(`PDF loaded with ${pdfDocument.numPages} pages`);
    let fullText = '';
    
    for (let i = 0; i < pdfDocument.numPages; i++) {
      console.log(`Processing page ${i + 1}...`);
      const page = await pdfDocument.getPage(i + 1);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n';
    }

    console.log('Extracting measurements...');
    // Enhanced pattern matching for all measurements
    const patterns = {
      totalRoofArea: /Total\s*(?:Roof)?\s*Area[^=\n]*=\s*([\d,]+)/i,
      totalRoofSquares: /Total\s*(?:Roof)?\s*Squares[^=\n]*=\s*([\d.]+)/i,
      predominantPitch: /Predominant\s*Pitch[^=\n]*=\s*(\d+)\/12/i,
      flatArea: /Flat\s*Area[^=\n]*=\s*([\d,]+)/i,
      ridgesLength: /Ridges[^=\n]*=\s*(\d+)\s*ft/i,
      ridgesCount: /\((\d+)\s*Ridges\)/i,
      hipsLength: /Hips[^=\n]*=\s*(\d+)\s*ft/i,
      hipsCount: /\((\d+)\s*Hips\)/i,
      valleysLength: /Valleys[^=\n]*=\s*(\d+)\s*ft/i,
      valleysCount: /\((\d+)\s*Valleys\)/i,
      rakesLength: /Rakes[^=\n]*=\s*(\d+)\s*ft/i,
      rakesCount: /\((\d+)\s*Rakes\)/i,
      eavesLength: /Eaves[^=\n]*=\s*(\d+)\s*ft/i,
      eavesCount: /\((\d+)\s*Eaves\)/i,
      dripEdgeLength: /Drip\s*Edge[^=\n]*=\s*(\d+)\s*ft/i,
      flashingLength: /Flashing[^=\n]*=\s*(\d+)\s*ft/i,
      stepFlashingLength: /Step\s*Flashing[^=\n]*=\s*(\d+)\s*ft/i,
      totalPenetrationsArea: /Total\s*Penetrations\s*Area[^=\n]*=\s*(\d+)/i,
      wasteFactorArea: /Waste\s*Factor\s*Area[^=\n]*=\s*(\d+)/i,
      suggestedWasteFactor: /Suggested\s*Waste\s*Factor[^=\n]*=\s*(\d+)/i,
      numberOfStories: /Number\s*of\s*Stories[^=\n]*=\s*(\d+)/i
    };

    const measurements: Record<string, string | null> = {};
    const extractionStatus: Record<string, boolean> = {};
    
    // Extract measurements and track success
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = fullText.match(pattern);
      measurements[key] = match ? match[1].replace(',', '') : null;
      extractionStatus[key] = !!match;
      console.log(`Extracted ${key}:`, measurements[key]);
    }

    console.log('Calculating pricing...');
    // Calculate pricing based on measurements
    const totalArea = measurements.totalRoofArea ? parseFloat(measurements.totalRoofArea) : 0;
    const flatArea = measurements.flatArea ? parseFloat(measurements.flatArea) : 0;
    const pitch = measurements.predominantPitch ? parseInt(measurements.predominantPitch) : 4;
    const stories = measurements.numberOfStories ? parseInt(measurements.numberOfStories) : 1;
    const wasteFactor = Math.max(measurements.suggestedWasteFactor ? parseFloat(measurements.suggestedWasteFactor) : 12, 12) / 100;

    // Calculate squares needed with waste factor
    const totalSquares = Math.ceil((totalArea - flatArea) / 100 * (1 + wasteFactor));
    const flatSquares = Math.ceil(flatArea / 100 * (1 + wasteFactor));

    // Determine labor rate based on pitch
    let laborRate = PRICING.LABOR_RATES['4/12-7/12'];
    if (pitch >= 13) laborRate = PRICING.LABOR_RATES['13/12-16/12'];
    else if (pitch >= 10) laborRate = PRICING.LABOR_RATES['10/12-12/12'];
    else if (pitch >= 8) laborRate = PRICING.LABOR_RATES['8/12-9/12'];

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
      
      // Accessories
      dripEdge: Math.ceil(measurements.dripEdgeLength ? parseFloat(measurements.dripEdgeLength) / 10 : 0) * PRICING.MATERIALS.dripEdge,
      plumbingBoots: (measurements.totalPenetrationsArea ? parseFloat(measurements.totalPenetrationsArea) : 0) * PRICING.MATERIALS.plumbingBoots,
      nails: Math.ceil((totalSquares + flatSquares) / 30) * PRICING.MATERIALS.nails
    };

    // Calculate totals
    const subtotal = Object.values(calculatedPricing).reduce((a, b) => a + b, 0);
    const profitAmount = subtotal * (profitMargin / 100);
    const total = subtotal + profitAmount;

    console.log('Sending response...');
    return new Response(
      JSON.stringify({
        success: true,
        measurements,
        extractionStatus,
        pricing: {
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
        },
        debug: {
          textSample: fullText.substring(0, 500),
          pdfInfo: {
            pageCount: pdfDocument.numPages,
            fileSize: arrayBuffer.byteLength
          }
        }
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
}); 