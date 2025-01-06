import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as pdfParse from 'npm:pdf-parse';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function extractTextFromPdf(pdfBuffer: ArrayBuffer): Promise<string> {
  try {
    console.log('Starting PDF parsing...');
    // Convert ArrayBuffer to Buffer for pdf-parse
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

function findTotalArea(text: string): number {
  console.log('Searching for total area in text');
  
  const patterns = [
    /Total\s*Area\s*(?:\(All\s*Pitches\))?\s*[:=]?\s*([\d,]+)/i,
    /Total\s*Roof\s*Area\s*[:=]?\s*([\d,]+)/i,
    /Roof\s*Area\s*[:=]?\s*([\d,]+)/i,
    /Area\s*\(Sq\s*ft\)\s*[:=]?\s*([\d,]+)/i,
    /(\d{2,}(?:,\d{3})*(?:\.\d+)?)\s*(?:sq\.?\s*ft\.?|sqft|sf)/i,
    /Total\s*Square\s*Footage\s*[:=]?\s*([\d,]+)/i,
    /Total\s*Squares\s*[:=]?\s*([\d,]+)/i
  ];

  for (const pattern of patterns) {
    console.log('Trying pattern:', pattern);
    const match = text.match(pattern);
    if (match && match[1]) {
      const area = parseFloat(match[1].replace(/,/g, ''));
      console.log('Found area:', area);
      if (area > 0) {
        return area;
      }
    }
  }

  console.log('No area found with any pattern');
  throw new Error('Could not find total roof area in PDF. Please make sure you are uploading a valid EagleView report.');
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

    // Find total area
    const totalArea = findTotalArea(textContent);

    const measurements = {
      totalArea,
      pitchBreakdown: [{
        pitch: "4/12", // Default pitch if not found
        area: totalArea
      }],
      suggestedWaste: 15 // Default waste percentage
    };

    console.log('Successfully processed PDF:', measurements);

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