import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as pdfParse from 'npm:pdf-parse';
import { extractNumber, extractMeasurement, extractPitchBreakdown } from './utils/measurementExtractor.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const REGEX_PATTERNS = {
  totalArea: /Total Area \(All Pitches\)\s*=\s*([\d,]+)/i,
  totalFacets: /Total Roof Facets\s*=\s*(\d+)/i,
  predominantPitch: /Predominant Pitch\s*=\s*(\d+)\/12/i,
  wasteTable: /Waste %\s*\n((?:(?:\d+%)\s*\n)+)Area \(Sq ft\)\s*\n((?:[\d,]+\s*\n)+)Squares \*\s*\n((?:[\d.]+\s*\n)+)/,
};

async function extractTextFromPdf(pdfBuffer: ArrayBuffer): Promise<string> {
  try {
    console.log('Starting PDF parsing...');
    const buffer = new Uint8Array(pdfBuffer);
    console.log('Buffer created, length:', buffer.length);
    
    const data = await pdfParse(buffer);
    console.log('PDF parsed, text length:', data.text?.length);
    
    if (!data.text || data.text.length === 0) {
      throw new Error('No text content could be extracted');
    }

    // Log a sample of the extracted text for debugging
    console.log('First 500 characters:', data.text.substring(0, 500));
    
    return data.text;
  } catch (error) {
    console.error('Error in PDF parsing:', error);
    throw new Error('Failed to extract text from PDF. Please ensure this is a text-based PDF and not a scanned document.');
  }
}

function extractWasteTable(text: string): { 
  wasteTable: Array<{ percentage: number; area: number; squares: number; is_suggested: boolean }>;
  suggested_waste_percentage: number;
} {
  const match = text.match(REGEX_PATTERNS.wasteTable);
  if (!match) {
    return { wasteTable: [], suggested_waste_percentage: 15 }; // Default waste percentage
  }

  const percentages = match[1].trim().split('\n').map(p => parseFloat(p));
  const areas = match[2].trim().split('\n').map(a => parseFloat(a.replace(/,/g, '')));
  const squares = match[3].trim().split('\n').map(s => parseFloat(s));

  const wasteTable = percentages.map((percentage, index) => ({
    percentage,
    area: areas[index] || 0,
    squares: squares[index] || 0,
    is_suggested: index === Math.floor(percentages.length / 2)
  }));

  const suggested_waste_percentage = percentages[Math.floor(percentages.length / 2)] || 15;

  return { wasteTable, suggested_waste_percentage };
}

function processMeasurements(text: string) {
  console.log('Processing measurements from text');
  
  const totalArea = extractNumber(text, REGEX_PATTERNS.totalArea);
  const totalFacets = extractNumber(text, REGEX_PATTERNS.totalFacets);
  const predominantPitchMatch = text.match(REGEX_PATTERNS.predominantPitch);
  const predominantPitch = predominantPitchMatch ? parseInt(predominantPitchMatch[1]) : 4;

  const ridges = extractMeasurement(text, /Ridges\s*=\s*(\d+)\s*ft\s*\((\d+)\s*Ridges?\)/i);
  const hips = extractMeasurement(text, /Hips\s*=\s*(\d+)\s*ft\s*\((\d+)\s*Hips?\)/i);
  const valleys = extractMeasurement(text, /Valleys\s*=\s*(\d+)\s*ft\s*\((\d+)\s*Valleys?\)/i);
  const rakes = extractMeasurement(text, /Rakes\s*=\s*(\d+)\s*ft\s*\((\d+)\s*Rakes?\)/i);
  const eaves = extractMeasurement(text, /Eaves\s*=\s*(\d+)\s*ft\s*\((\d+)\s*Eaves?\)/i);

  const { wasteTable, suggested_waste_percentage } = extractWasteTable(text);
  const pitchBreakdown = extractPitchBreakdown(text);

  return {
    totalArea,
    totalRoofFacets: totalFacets,
    predominantPitch,
    pitchBreakdown,
    ridges,
    hips,
    valleys,
    rakes,
    eaves,
    wasteTable,
    suggestedWaste: suggested_waste_percentage,
  };
}

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
    const textContent = await extractTextFromPdf(arrayBuffer);
    
    if (textContent.length < 100) {
      console.error('Very little text extracted, might be a scanned PDF');
      throw new Error('Could not extract text from PDF. This might be a scanned or image-based PDF.');
    }

    // Process measurements
    const measurements = processMeasurements(textContent);
    console.log('Successfully processed measurements:', measurements);

    return new Response(
      JSON.stringify(measurements),
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
        error: error.message || 'Failed to process PDF report'
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