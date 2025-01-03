import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

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

    // Get Django backend URL from environment variable
    const djangoUrl = Deno.env.get("DJANGO_BACKEND_URL")
    if (!djangoUrl) {
      throw new Error("Django backend URL not configured")
    }

    // Forward the file to Django backend
    const djangoFormData = new FormData()
    djangoFormData.append('file', file)

    const response = await fetch(`${djangoUrl}/api/process-pdf/`, {
      method: 'POST',
      body: djangoFormData
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Django backend error:', error)
      throw new Error(`Django backend error: ${error}`)
    }

    const measurements = await response.json()
    console.log('Processed measurements:', measurements)

    return new Response(
      JSON.stringify(measurements),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    )
  } catch (error) {
    console.error('Error processing PDF:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})