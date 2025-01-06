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

    // Mock response data for testing
    const mockEstimate = {
      materials: [
        {
          name: "Shingles",
          basePrice: 100,
          unit: "bundle",
          quantity: 50
        },
        {
          name: "Underlayment",
          basePrice: 50,
          unit: "roll",
          quantity: 10
        }
      ],
      labor: [
        {
          pitch: "4/12",
          rate: 50,
          area: 20
        }
      ],
      profitMargin: profitMargin || 20,
      totalCost: 6000,
      totalPrice: 7200,
      category: roofingCategory || "SHINGLE"
    }

    console.log('Generated mock estimate:', mockEstimate)

    return new Response(
      JSON.stringify(mockEstimate),
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