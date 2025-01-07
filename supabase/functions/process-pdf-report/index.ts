import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { extractWithOpenAI } from "./openaiExtractor.ts";
import { cleanText } from "./utils/text-processing.ts";
import * as pdfjs from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Processing PDF file:', file.name);
    
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Initialize PDF.js worker
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
    
    // Load PDF document
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;
    
    console.log(`PDF loaded successfully with ${pdfDoc.numPages} pages`);
    
    // Extract text from all pages
    let fullText = '';
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
      
      // Log sample of extracted text for debugging
      console.log(`Page ${i} sample:`, pageText.substring(0, 200));
    }

    const cleanedText = cleanText(fullText);
    console.log('Sample of cleaned text:', cleanedText.substring(0, 1000));

    try {
      const measurements = await extractWithOpenAI(cleanedText);
      console.log('Final extracted measurements:', measurements);

      return new Response(
        JSON.stringify({ measurements }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    } catch (error) {
      if (error.name === 'MeasurementNotFoundError') {
        return new Response(
          JSON.stringify({ error: error.message }),
          { 
            status: 422,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Error processing PDF:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});