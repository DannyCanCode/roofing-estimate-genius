import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Import specific version of pdf.js for Deno
const pdfJS = await import('https://cdn.skypack.dev/pdfjs-dist@2.12.313/build/pdf.js');
const pdfjsLib = pdfJS.default;

// Set up the worker for pdf.js
const pdfWorker = await import('https://cdn.skypack.dev/pdfjs-dist@2.12.313/build/pdf.worker.js');
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker.default;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    console.log('Received file:', file?.name);

    if (!file) {
      throw new Error('No file provided');
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    console.log('Processing PDF file of size:', arrayBuffer.byteLength);

    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
    const pdf = await loadingTask.promise;

    let allText = '';
    let debugText = '';
    const extractionStatus: Record<string, boolean> = {};

    // Process all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      console.log('Processing page:', i);
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: any) => item.str).join(' ');
      allText += pageText + ' ';
      if (i === 1) debugText = pageText.substring(0, 500);
    }

    // Define measurement patterns
    const patterns = {
      totalArea: /Total Area[^=\n]*=\s*([\d,]+)/i,
      predominantPitch: /Predominant Pitch[^=\n]*=\s*(\d+)\/12/i,
      suggestedWaste: /Suggested Waste[^=\n]*=\s*(\d+)/i,
    };

    // Extract measurements
    const measurements: Record<string, any> = {};
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = allText.match(pattern);
      if (match) {
        measurements[key] = match[1].replace(/,/g, '');
        extractionStatus[key] = true;
      }
    }

    // Convert measurements to the expected format
    const processedData = {
      measurements: {
        total_area: parseFloat(measurements.totalArea || '0'),
        predominant_pitch: measurements.predominantPitch ? `${measurements.predominantPitch}/12` : '4/12',
        suggested_waste_percentage: parseInt(measurements.suggestedWaste || '15'),
      },
      extractionStatus,
      debug: {
        textSample: debugText,
        pdfInfo: {
          pageCount: pdf.numPages,
          fileSize: arrayBuffer.byteLength,
        }
      }
    };

    console.log('Processed data:', processedData);

    if (!processedData.measurements.total_area) {
      throw new Error('Could not extract roof area from PDF');
    }

    return new Response(
      JSON.stringify(processedData),
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