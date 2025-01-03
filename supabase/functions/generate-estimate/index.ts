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
    const { measurements, profitMargin, roofingCategory } = await req.json()
    console.log('Received request:', { measurements, profitMargin, roofingCategory })

    // Get Django backend URL from environment variable
    const djangoUrl = Deno.env.get("DJANGO_BACKEND_URL")
    if (!djangoUrl) {
      throw new Error("Django backend URL not configured")
    }

    // Forward request to Django backend
    const response = await fetch(`${djangoUrl}/api/generate-estimate/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        measurements,
        profit_margin: profitMargin,
        roofing_category: roofingCategory
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Django backend error:', error)
      throw new Error(`Django backend error: ${error}`)
    }

    const estimate = await response.json()
    console.log('Generated estimate:', estimate)

    return new Response(
      JSON.stringify(estimate),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    )
  } catch (error) {
    console.error('Error generating estimate:', error)
    
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