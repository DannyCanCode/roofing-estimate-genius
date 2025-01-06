import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { MeasurementExtractor } from './measurement-extractor.ts'
import { ProcessingResult } from './types.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting PDF processing request');
    const startTime = Date.now();

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

    // Extract measurements
    const extractor = new MeasurementExtractor();
    const measurements = await extractor.extractMeasurements(fileBuffer);

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Generate unique filename and upload to storage
    const timestamp = new Date().toISOString();
    const fileExt = file.name.split('.').pop();
    const filePath = `${crypto.randomUUID()}-${timestamp}.${fileExt}`;

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

    // Create processing result
    const result: ProcessingResult = {
      measurements,
      metadata: {
        original_filename: file.name,
        page_count: 1, // TODO: Get actual page count
        processing_time: Date.now() - startTime,
      }
    };

    // Create report record
    const { error: reportError } = await supabase
      .from('reports')
      .insert({
        file_path: filePath,
        original_filename: file.name,
        status: 'completed',
        metadata: result,
        processed_text: JSON.stringify(measurements)
      });

    if (reportError) {
      console.error('Database error:', reportError);
      throw new Error('Failed to create report record');
    }

    console.log('Successfully processed PDF:', result);

    return new Response(
      JSON.stringify(result),
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