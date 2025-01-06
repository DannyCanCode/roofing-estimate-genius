import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { PDFDocument } from 'https://cdn.skypack.dev/pdf-lib'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function extractMeasurements(pdfBytes: ArrayBuffer) {
  try {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    console.log(`Processing PDF with ${pages.length} pages`);

    // Extract text content from all pages
    let textContent = '';
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const text = await page.getTextContent();
      textContent += text + ' ';
    }
    console.log('Extracted raw text content');

    // Enhanced regex patterns for better extraction
    const patterns = {
      totalArea: /Total\s+Area:\s*([\d,]+)\s*(?:sq\.?\s*ft\.?|sqft)/i,
      pitches: /(\d+\/\d+)\s*pitch.*?(\d+(?:,\d+)?)\s*(?:sq\.?\s*ft\.?|sqft)/gi,
      waste: /(?:Suggested|Recommended)\s+Waste:\s*(\d+)%/i,
      address: /Property\s+Address:\s*([^\n]+)/i,
      // Add more patterns as needed
    };

    // Extract measurements with detailed logging
    console.log('Starting measurement extraction');
    
    // Total Area
    const totalAreaMatch = textContent.match(patterns.totalArea);
    const totalArea = totalAreaMatch ? 
      parseFloat(totalAreaMatch[1].replace(/,/g, '')) : 0;
    console.log('Extracted total area:', totalArea);

    // Pitch Breakdown
    const pitchBreakdown = [];
    let pitchMatch;
    while ((pitchMatch = patterns.pitches.exec(textContent)) !== null) {
      const pitch = pitchMatch[1];
      const area = parseFloat(pitchMatch[2].replace(/,/g, ''));
      pitchBreakdown.push({ pitch, area });
      console.log(`Found pitch: ${pitch} with area: ${area}`);
    }

    // Waste Percentage
    const wasteMatch = textContent.match(patterns.waste);
    const suggestedWaste = wasteMatch ? 
      parseInt(wasteMatch[1]) : 12; // Default to 12%
    console.log('Extracted waste percentage:', suggestedWaste);

    // Property Address
    const addressMatch = textContent.match(patterns.address);
    const propertyAddress = addressMatch ? 
      addressMatch[1].trim() : '';
    console.log('Extracted property address:', propertyAddress);

    const measurements = {
      totalArea,
      pitchBreakdown,
      suggestedWaste,
      propertyAddress,
      extractedText: textContent // Store for debugging
    };

    console.log('Successfully extracted all measurements:', measurements);
    return measurements;
  } catch (error) {
    console.error('Error in measurement extraction:', error);
    throw new Error(`Failed to extract measurements: ${error.message}`);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    
    if (!file || !(file instanceof File)) {
      throw new Error('No PDF file provided');
    }

    console.log('Processing file:', file.name);
    console.log('File size:', file.size, 'bytes');
    console.log('File type:', file.type);

    if (file.type !== 'application/pdf') {
      throw new Error('Invalid file type. Please upload a PDF file.');
    }

    // Convert file to ArrayBuffer
    const fileBuffer = await file.arrayBuffer();
    console.log('File buffer size:', fileBuffer.byteLength);

    // Process the PDF file
    const measurements = await extractMeasurements(fileBuffer);

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Generate unique filename
    const timestamp = new Date().toISOString();
    const fileExt = file.name.split('.').pop();
    const filePath = `${crypto.randomUUID()}-${timestamp}.${fileExt}`;

    // Upload file to Storage
    const { error: uploadError } = await supabase.storage
      .from('eagleview-reports')
      .upload(filePath, file, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to upload file');
    }

    // Create report record
    const { error: reportError } = await supabase
      .from('reports')
      .insert({
        file_path: filePath,
        original_filename: file.name,
        status: 'completed',
        metadata: measurements,
        processed_text: JSON.stringify(measurements)
      });

    if (reportError) {
      console.error('Database error:', reportError);
      throw new Error('Failed to create report record');
    }

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
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      }
    );
  }
});