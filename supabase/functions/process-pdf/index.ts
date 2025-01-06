import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import * as pdfjsLib from "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/+esm";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Process all pages to ensure we don't miss any measurements
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: any) => item.str).join(' ');
      allText += pageText + ' ';
      if (i === 1) debugText = pageText.substring(0, 500);
    }

    // Define regex patterns for measurements
    const patterns = {
      totalRoofArea: /Total Area[^=\n]*=\s*([\d,]+)/i,
      totalRoofSquares: /Total Squares[^=\n]*=\s*([\d.]+)/i,
      predominantPitch: /Predominant Pitch[^=\n]*=\s*(\d+)\/12/i,
      ridgesLength: /Ridges[^=\n]*=\s*(\d+)\s*ft/i,
      ridgesCount: /Ridges[^=\n]*Count[^=\n]*=\s*(\d+)/i,
      hipsLength: /Hips[^=\n]*=\s*(\d+)\s*ft/i,
      hipsCount: /Hips[^=\n]*Count[^=\n]*=\s*(\d+)/i,
      valleysLength: /Valleys[^=\n]*=\s*(\d+)\s*ft/i,
      valleysCount: /Valleys[^=\n]*Count[^=\n]*=\s*(\d+)/i,
      rakesLength: /Rakes[^=\n]*=\s*(\d+)\s*ft/i,
      rakesCount: /Rakes[^=\n]*Count[^=\n]*=\s*(\d+)/i,
      eavesLength: /Eaves[^=\n]*=\s*(\d+)\s*ft/i,
      eavesCount: /Eaves[^=\n]*Count[^=\n]*=\s*(\d+)/i,
      dripEdgeLength: /Drip Edge[^=\n]*=\s*(\d+)\s*ft/i,
      flashingLength: /Flashing[^=\n]*=\s*(\d+)\s*ft/i,
      stepFlashingLength: /Step Flashing[^=\n]*=\s*(\d+)\s*ft/i,
      totalPenetrationsArea: /Total Penetrations[^=\n]*=\s*(\d+)/i,
      wasteFactorArea: /Waste Factor Area[^=\n]*=\s*(\d+)/i,
      suggestedWasteFactor: /Suggested Waste Factor[^=\n]*=\s*(\d+)/i,
      flatArea: /Flat Area[^=\n]*=\s*(\d+)/i,
      numberOfStories: /Number of Stories[^=\n]*=\s*(\d+)/i
    };

    // Extract measurements
    const measurements: Record<string, string | null> = {};
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = allText.match(pattern);
      measurements[key] = match ? match[1].replace(/,/g, '') : null;
      extractionStatus[key] = !!match;
    }

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

    return new Response(
      JSON.stringify({
        measurements,
        extractionStatus,
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