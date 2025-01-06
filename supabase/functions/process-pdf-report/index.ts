import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import pdfParse from 'npm:pdf-parse@1.1.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const extractMeasurements = (text: string) => {
  console.log('Raw text from PDF:', text.substring(0, 500)); // Log first 500 chars for debugging
  
  const patterns = {
    // Basic Measurements - Updated patterns to be more flexible
    total_area: /(?:Total\s*(?:Roof)?\s*Area|Total Area \(All Pitches\)|Total\s*Area)\s*[=:]\s*([\d,\.]+)/i,
    total_roof_facets: /Total Roof Facets\s*=\s*(\d+)/,
    predominant_pitch: /Predominant Pitch\s*=\s*(\d+)\/12/,
    number_of_stories: /Number of Stories\s*<=\s*(\d+)/,
    
    // Length Measurements
    ridges: /Ridges\s*=\s*(\d+)\s*ft\s*\((\d+)\s*Ridges\)/,
    hips: /Hips\s*=\s*(\d+)\s*ft\s*\((\d+)\s*Hips\)/,
    valleys: /Valleys\s*=\s*(\d+)\s*ft\s*\((\d+)\s*Valleys\)/,
    rakes: /Rakes†?\s*=\s*(\d+)\s*ft\s*\((\d+)\s*Rakes\)/,
    eaves: /Eaves\/Starter‡?\s*=\s*(\d+)\s*ft\s*\((\d+)\s*Eaves\)/,
    drip_edge: /Drip Edge \(Eaves \+ Rakes\)\s*=\s*(\d+)\s*ft\s*\((\d+)\s*Lengths\)/,
    flashing: /Flashing\s*=\s*(\d+)\s*ft\s*\((\d+)\s*Lengths?\)/,
    step_flashing: /Step flashing\s*=\s*(\d+)\s*ft\s*\((\d+)\s*Lengths?\)/,
    parapets: /Parapet Walls\s*=\s*(\d+)\s*(?:ft)?\s*\((\d+)\s*Lengths?\)/,
    
    // Penetrations
    total_penetrations: /Total Penetrations\s*=\s*(\d+)/,
    total_penetrations_area: /Total Penetrations Area\s*=\s*(\d+)\s*sq\s*ft/,
    total_penetrations_perimeter: /Total Penetrations Perimeter\s*=\s*(\d+)\s*ft/,
    total_area_less_penetrations: /Total Roof Area Less Penetrations\s*=\s*([\d,]+)\s*sq\s*ft/,
    
    // Areas per Pitch
    areas_per_pitch: /Areas per Pitch.*?(\d+\/12.*?(?=\n\n|\Z))/s,
    
    // Waste Calculations
    waste_table: /Waste %\s*\n((?:(?:\d+%)\s*\n)+)Area \(Sq ft\)\s*\n((?:[\d,]+\s*\n)+)Squares \*\s*\n((?:[\d.]+\s*\n)+)/s,
    suggested_waste: /Measured\s*\n\s*Suggested/,
    
    // Structure Complexity
    structure_complexity: /Structure Complexity\n(Simple|Normal|Complex)/,
    
    // Location
    longitude: /Longitude\s*=\s*([-\d.]+)/,
    latitude: /Latitude\s*=\s*([-\d.]+)/
  }

  const measurements: any = {}
  
  for (const [key, pattern] of Object.entries(patterns)) {
    const match = text.match(pattern)
    if (match) {
      if (key === 'total_area') {
        const value = match[1].replace(/,/g, '')
        const area = parseFloat(value)
        if (isNaN(area) || area <= 0) {
          console.error('Invalid total area found:', value)
          throw new Error('Invalid total area value extracted from PDF')
        }
        measurements[key] = area
        console.log('Successfully extracted total area:', area)
      } else if (key === 'areas_per_pitch') {
        const pitchText = match[1]
        const pitchPattern = /(\d+)\/12\s*=?\s*([\d,]+)(?:\s*sq\s*ft)?\s*\(?(\d+\.?\d*)%\)?/g
        const pitches = []
        let pitchMatch
        while ((pitchMatch = pitchPattern.exec(pitchText)) !== null) {
          pitches.push({
            pitch: parseInt(pitchMatch[1]),
            area: parseFloat(pitchMatch[2].replace(',', '')),
            percentage: parseFloat(pitchMatch[3])
          })
        }
        measurements[key] = pitches
      } else if (key === 'waste_table') {
        const percentages = match[1].trim().split('\n').map(p => parseInt(p))
        const areas = match[2].trim().split('\n').map(a => parseFloat(a.replace(',', '')))
        const squares = match[3].trim().split('\n').map(s => parseFloat(s))
        
        const wasteEntries = percentages.map((percentage, i) => ({
          percentage,
          area: areas[i],
          squares: squares[i],
          is_suggested: i === Math.floor(percentages.length / 2)
        }))
        
        measurements[key] = wasteEntries
        measurements.suggested_waste_percentage = percentages[Math.floor(percentages.length / 2)]
      } else if (['ridges', 'hips', 'valleys', 'rakes', 'eaves', 'drip_edge', 'flashing', 'step_flashing', 'parapets'].includes(key)) {
        measurements[key] = {
          length: parseFloat(match[1]),
          count: parseInt(match[2])
        }
      } else if (key === 'suggested_waste') {
        measurements[key] = true
      } else {
        const value = match[1].replace(/,/g, '')
        measurements[key] = value.includes('.') || !isNaN(value) ? parseFloat(value) : value
      }
    } else if (key === 'total_area') {
      console.error('Total area pattern not found in text')
      throw new Error('Could not find total area in PDF')
    }
  }

  if (!measurements.total_area) {
    console.error('No total area found in measurements')
    throw new Error('Could not extract roof area from PDF')
  }

  // Calculate combined ridges/hips total
  if (measurements.ridges && measurements.hips) {
    measurements.total_ridges_hips = {
      length: measurements.ridges.length + measurements.hips.length,
      count: measurements.ridges.count + measurements.hips.count
    }
  }

  return measurements
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Processing PDF request...')
    const formData = await req.formData()
    const file = formData.get('file')
    
    if (!file || !(file instanceof File)) {
      console.error('No PDF file provided in request')
      return new Response(
        JSON.stringify({ error: 'No PDF file provided' }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    console.log('Converting file to ArrayBuffer:', file.name, 'Size:', file.size)
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    
    console.log('Parsing PDF content...')
    const data = await pdfParse(uint8Array)
    console.log('PDF parsed successfully, text length:', data.text.length)
    
    console.log('Extracting measurements from text...')
    const measurements = extractMeasurements(data.text)
    console.log('Measurements extracted:', Object.keys(measurements).length, 'fields found')

    return new Response(
      JSON.stringify({
        measurements,
        raw_text: data.text,
        text_length: data.text.length
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    )
  } catch (error) {
    console.error('Error processing PDF:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString(),
        stack: error.stack
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    )
  }
})
