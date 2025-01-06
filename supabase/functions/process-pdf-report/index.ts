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

    // Extract text from first page (usually contains measurements)
    const firstPage = pages[0];
    const text = await firstPage.getTextContent();
    console.log('Extracted text:', text);

    // Parse measurements from text
    // This is a simplified example - adjust based on your EagleView report format
    let totalArea = 0;
    const pitchBreakdown = [];

    // Example regex patterns for EagleView reports
    const areaMatch = text.match(/Total Area:\s*(\d+\.?\d*)/i);
    const pitchMatches = text.matchAll(/(\d+\/\d+)\s*pitch:\s*(\d+\.?\d*)/gi);

    if (areaMatch) {
      totalArea = parseFloat(areaMatch[1]);
    }

    for (const match of pitchMatches) {
      pitchBreakdown.push({
        pitch: match[1],
        area: parseFloat(match[2])
      });
    }

    console.log('Parsed measurements:', { totalArea, pitchBreakdown });

    return {
      totalArea,
      pitchBreakdown
    };
  } catch (error) {
    console.error('Error extracting measurements:', error);
    throw new Error('Failed to extract measurements from PDF');
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file')
    
    if (!file || !(file instanceof File)) {
      throw new Error('No PDF file provided')
    }

    console.log('Processing file:', file.name);

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Generate a unique filename
    const timestamp = new Date().toISOString()
    const fileExt = file.name.split('.').pop()
    const filePath = `${crypto.randomUUID()}-${timestamp}.${fileExt}`

    // Upload file to Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('eagleview-reports')
      .upload(filePath, file, {
        contentType: 'application/pdf',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw new Error('Failed to upload file')
    }

    // Create a record in the reports table
    const { data: reportData, error: reportError } = await supabase
      .from('reports')
      .insert({
        file_path: filePath,
        original_filename: file.name,
        status: 'processing',
        metadata: {},
        user_id: req.headers.get('x-user-id')
      })
      .select()
      .single()

    if (reportError) {
      console.error('Database error:', reportError)
      throw new Error('Failed to create report record')
    }

    // Process the PDF file
    const fileBuffer = await file.arrayBuffer();
    console.log('Starting PDF processing');
    const measurements = await extractMeasurements(fileBuffer);
    console.log('Measurements extracted:', measurements);

    // Update the report with processed data
    const { error: updateError } = await supabase
      .from('reports')
      .update({
        status: 'completed',
        processed_text: JSON.stringify(measurements),
        metadata: measurements
      })
      .eq('id', reportData.id)

    if (updateError) {
      console.error('Update error:', updateError)
      throw new Error('Failed to update report')
    }

    return new Response(
      JSON.stringify({
        success: true,
        measurements,
        reportId: reportData.id
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('Error processing request:', error)
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
    )
  }
})