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

    // Mock measurements for testing
    // In production, you would parse actual measurements from the PDF
    const measurements = {
      totalArea: 2500,
      pitchBreakdown: [
        { pitch: "4/12", area: 1000 },
        { pitch: "6/12", area: 1500 }
      ]
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