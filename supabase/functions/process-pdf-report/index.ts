import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { PDFDocument } from 'https://cdn.skypack.dev/pdf-lib'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function extractMeasurements(pdfBytes: ArrayBuffer): Promise<any> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    console.log(`Processing PDF with ${pages.length} pages`);

    // Extract text content from all pages
    const textContent = pages.map(page => page.getTextContent()).join(' ');
    console.log('Extracted text content:', textContent);

    // Regular expressions for extracting measurements
    const totalAreaRegex = /Total Area:\s*([\d,]+)\s*sq\s*ft/i;
    const pitchRegex = /(\d+\/\d+)\s*pitch.*?(\d+(?:,\d+)?)\s*sq\s*ft/gi;
    const wasteRegex = /Suggested\s+Waste:\s*(\d+)%/i;
    const addressRegex = /Property\s+Address:\s*([^\n]+)/i;

    // Extract measurements
    const totalAreaMatch = textContent.match(totalAreaRegex);
    const totalArea = totalAreaMatch ? 
      parseFloat(totalAreaMatch[1].replace(',', '')) : 0;

    // Extract pitch breakdown
    const pitchBreakdown = [];
    let pitchMatch;
    while ((pitchMatch = pitchRegex.exec(textContent)) !== null) {
      pitchBreakdown.push({
        pitch: pitchMatch[1],
        area: parseFloat(pitchMatch[2].replace(',', ''))
      });
    }

    // Extract waste percentage
    const wasteMatch = textContent.match(wasteRegex);
    const suggestedWaste = wasteMatch ? 
      parseInt(wasteMatch[1]) : 12; // Default to 12% if not found

    // Extract address
    const addressMatch = textContent.match(addressRegex);
    const propertyAddress = addressMatch ? addressMatch[1].trim() : '';

    const measurements = {
      totalArea,
      pitchBreakdown,
      suggestedWaste,
      propertyAddress,
      rawText: textContent // Store for debugging
    };

    console.log('Extracted measurements:', measurements);
    return measurements;
  } catch (error) {
    console.error('Error extracting measurements:', error);
    throw new Error('Failed to extract measurements from PDF');
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

    // Generate a unique filename
    const timestamp = new Date().toISOString();
    const fileExt = file.name.split('.').pop();
    const filePath = `${crypto.randomUUID()}-${timestamp}.${fileExt}`;

    // Upload file to Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('eagleview-reports')
      .upload(filePath, file, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to upload file');
    }

    // Create a record in the reports table
    const { data: reportData, error: reportError } = await supabase
      .from('reports')
      .insert({
        file_path: filePath,
        original_filename: file.name,
        status: 'completed',
        metadata: measurements,
        processed_text: JSON.stringify(measurements)
      })
      .select()
      .single();

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