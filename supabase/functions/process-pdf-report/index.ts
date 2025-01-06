import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file')
    
    if (!file || !(file instanceof File)) {
      throw new Error('No PDF file provided')
    }

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
        status: 'pending',
        metadata: {},
        user_id: req.headers.get('x-user-id')
      })
      .select()
      .single()

    if (reportError) {
      console.error('Database error:', reportError)
      throw new Error('Failed to create report record')
    }

    // Process the PDF file here
    // TODO: Add your PDF processing logic
    const measurements = {
      totalArea: 0, // Replace with actual processing
      pitchBreakdown: [] // Replace with actual processing
    }

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