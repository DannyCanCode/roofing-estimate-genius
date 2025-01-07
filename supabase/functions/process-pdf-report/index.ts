import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { TextExtractor } from './extractors/text-extractor.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing PDF request');
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('No file provided');
    }

    console.log('Received file:', file.name);
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const textExtractor = new TextExtractor();
    console.log('Starting text extraction');
    
    try {
      const text = await textExtractor.extractText(uint8Array);
      console.log('Text extracted successfully');
      
      const measurements = textExtractor.extractMeasurements(text);
      console.log('Parsed measurements:', measurements);

      const formattedMeasurements = {
        measurements: {
          total_area: measurements.totalArea || 0,
          predominant_pitch: measurements.pitch || "4/12",
          suggested_waste_percentage: measurements.suggestedWaste || 15,
          number_of_stories: measurements.numberOfStories || 1,
          ridges: {
            length: measurements.ridgesLength || 0,
            count: measurements.ridgesCount || 0
          },
          hips: {
            length: measurements.hipsLength || 0,
            count: measurements.hipsCount || 0
          },
          valleys: {
            length: measurements.valleysLength || 0,
            count: measurements.valleysCount || 0
          },
          rakes: {
            length: measurements.rakesLength || 0,
            count: measurements.rakesCount || 0
          },
          eaves: {
            length: measurements.eavesLength || 0,
            count: measurements.eavesCount || 0
          }
        }
      };

      return new Response(
        JSON.stringify(formattedMeasurements),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } catch (error) {
      console.error('Error extracting text or measurements:', error);
      throw error;
    }

  } catch (error) {
    console.error('Error processing PDF:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error processing PDF',
        debug: { error: error instanceof Error ? error.stack : 'No stack trace available' }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});