import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as pdfParse from 'npm:pdf-parse';

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
    console.log('Starting PDF processing...');
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      throw new Error('No file provided');
    }

    console.log('Processing file:', file.name, 'Size:', file.size);
    const arrayBuffer = await file.arrayBuffer();
    console.log('File converted to ArrayBuffer, size:', arrayBuffer.byteLength);
    
    // Extract text from PDF
    console.log('Extracting text from PDF...');
    const buffer = new Uint8Array(arrayBuffer);
    const data = await pdfParse(buffer);
    
    if (!data.text || data.text.length === 0) {
      console.error('No text content extracted from PDF');
      throw new Error('Could not extract text from PDF. Please ensure this is a text-based PDF and not a scanned document.');
    }

    console.log('Successfully extracted text, length:', data.text.length);
    console.log('First 500 characters:', data.text.substring(0, 500));

    // Process measurements
    const measurements = {
      totalArea: extractNumber(data.text, /Total Area \(All Pitches\)\s*=\s*([\d,]+)/),
      totalRoofFacets: extractNumber(data.text, /Total Roof Facets\s*=\s*(\d+)/),
      predominantPitch: extractNumber(data.text, /Predominant Pitch\s*=\s*(\d+)\/12/),
      ridges: extractLengthAndCount(data.text, /Ridges\s*=\s*(\d+)\s*ft\s*\((\d+)\s*Ridges?\)/),
      hips: extractLengthAndCount(data.text, /Hips\s*=\s*(\d+)\s*ft\s*\((\d+)\s*Hips?\)/),
      valleys: extractLengthAndCount(data.text, /Valleys\s*=\s*(\d+)\s*ft\s*\((\d+)\s*Valleys?\)/),
      rakes: extractLengthAndCount(data.text, /Rakes†?\s*=\s*(\d+)\s*ft\s*\((\d+)\s*Rakes?\)/),
      eaves: extractLengthAndCount(data.text, /Eaves\/Starter‡?\s*=\s*(\d+)\s*ft\s*\((\d+)\s*Eaves?\)/),
    };

    const wasteTable = extractWasteTable(data.text);
    const suggestedWaste = extractSuggestedWaste(wasteTable);

    console.log('Successfully processed measurements:', measurements);

    return new Response(
      JSON.stringify({ 
        ...measurements,
        wasteTable,
        suggestedWaste,
        rawText: data.text // Include for debugging
      }),
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
      JSON.stringify({ 
        error: error.message || 'Failed to process PDF report',
        details: error.stack
      }),
      { 
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});

// Helper functions
function extractNumber(text: string, pattern: RegExp): number {
  const match = text.match(pattern);
  if (!match || !match[1]) return 0;
  return parseFloat(match[1].replace(/,/g, ''));
}

function extractLengthAndCount(text: string, pattern: RegExp): { length: number; count: number } {
  const match = text.match(pattern);
  if (!match || !match[1] || !match[2]) {
    return { length: 0, count: 0 };
  }
  return {
    length: parseFloat(match[1]),
    count: parseInt(match[2])
  };
}

function extractWasteTable(text: string): Array<{ percentage: number; area: number; squares: number; is_suggested: boolean }> {
  const wastePattern = /Waste %\s*\n((?:(?:\d+%)\s*\n)+)Area \(Sq ft\)\s*\n((?:[\d,]+\s*\n)+)Squares \*\s*\n((?:[\d.]+\s*\n)+)/;
  const match = text.match(wastePattern);
  
  if (!match) return [];

  const percentages = match[1].trim().split('\n').map(p => parseInt(p));
  const areas = match[2].trim().split('\n').map(a => parseFloat(a.replace(/,/g, '')));
  const squares = match[3].trim().split('\n').map(s => parseFloat(s));

  const middleIndex = Math.floor(percentages.length / 2);
  
  return percentages.map((percentage, i) => ({
    percentage,
    area: areas[i] || 0,
    squares: squares[i] || 0,
    is_suggested: i === middleIndex
  }));
}

function extractSuggestedWaste(wasteTable: Array<{ percentage: number; is_suggested: boolean }>): number {
  const suggestedEntry = wasteTable.find(entry => entry.is_suggested);
  return suggestedEntry?.percentage || 15; // Default to 15% if not found
}