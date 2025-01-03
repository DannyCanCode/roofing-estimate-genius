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

    // Mock response data structure
    const estimate = {
      materials: [
        {
          name: "Standard Shingles",
          basePrice: 25.99,
          unit: "bundle",
          quantity: Math.ceil(measurements.totalArea / 100) * 3
        },
        {
          name: "Underlayment",
          basePrice: 35.50,
          unit: "roll",
          quantity: Math.ceil(measurements.totalArea / 200)
        }
      ],
      labor: measurements.pitchBreakdown.map(section => ({
        pitch: section.pitch,
        rate: 55.00,
        area: section.area
      })),
      profitMargin: profitMargin,
      totalCost: 2500.00, // Mock calculation
      totalPrice: 3125.00, // Including profit margin
      category: roofingCategory
    }

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