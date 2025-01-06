import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PDFDocument } from 'https://cdn.skypack.dev/pdf-lib';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function extractTextFromPdf(pdfBytes: ArrayBuffer): Promise<string> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  console.log(`Processing PDF with ${pages.length} pages`);

  let textContent = '';
  let textFound = false;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    console.log(`Processing page ${i + 1}`);

    // Try to extract text from form fields
    const form = page.doc.getForm();
    const fields = form.getFields();
    for (const field of fields) {
      const text = field.getText();
      if (text) {
        textContent += text + ' ';
        textFound = true;
      }
    }

    // Try to extract text from page content streams
    try {
      const pageText = await page.doc.getPage(i).getText();
      if (pageText) {
        textContent += pageText + ' ';
        textFound = true;
      }
    } catch (error) {
      console.error(`Error extracting text from page ${i + 1}:`, error);
    }
  }

  if (!textFound) {
    throw new Error('No text content could be extracted. This might be a scanned or image-based PDF.');
  }

  console.log('Extracted text length:', textContent.length);
  console.log('Sample of extracted text:', textContent.substring(0, 200));
  
  return textContent.replace(/\s+/g, ' ').trim();
}

function findTotalArea(text: string): number {
  console.log('Searching for total area in text');
  
  const patterns = [
    /Total\s*Area\s*(?:\(All\s*Pitches\))?\s*[:=]?\s*([\d,]+)/i,
    /Total\s*Roof\s*Area\s*[:=]?\s*([\d,]+)/i,
    /Roof\s*Area\s*[:=]?\s*([\d,]+)/i,
    /Area\s*\(Sq\s*ft\)\s*[:=]?\s*([\d,]+)/i,
    /(\d{2,}(?:,\d{3})*(?:\.\d+)?)\s*(?:sq\.?\s*ft\.?|sqft|sf)/i,
    /Total\s*Square\s*Footage\s*[:=]?\s*([\d,]+)/i,
    /Total\s*Squares\s*[:=]?\s*([\d,]+)/i
  ];

  for (const pattern of patterns) {
    console.log('Trying pattern:', pattern);
    const match = text.match(pattern);
    if (match && match[1]) {
      const area = parseFloat(match[1].replace(/,/g, ''));
      console.log('Found area:', area);
      if (area > 0) {
        return area;
      }
    }
  }

  console.log('No area found with any pattern');
  throw new Error('Could not find total roof area in PDF. Please make sure you are uploading a valid EagleView report.');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting PDF processing...');
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      throw new Error('No file provided');
    }

    console.log('Processing file:', file.name, 'Size:', file.size);
    const arrayBuffer = await file.arrayBuffer();
    
    // Extract text from PDF
    console.log('Extracting text from PDF...');
    const textContent = await extractTextFromPdf(arrayBuffer);
    
    if (textContent.length < 100) {
      console.error('Very little text extracted, might be a scanned PDF');
      throw new Error('Could not extract text from PDF. This might be a scanned or image-based PDF.');
    }

    // Find total area
    const totalArea = findTotalArea(textContent);

    const measurements = {
      totalArea,
      pitchBreakdown: [{
        pitch: "4/12", // Default pitch if not found
        area: totalArea
      }],
      suggestedWaste: 15 // Default waste percentage
    };

    console.log('Successfully processed PDF:', measurements);

    return new Response(
      JSON.stringify(measurements),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error processing PDF:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to process PDF report'
      }),
      { 
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});