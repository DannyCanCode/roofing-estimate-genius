import { ProcessedPdfData } from "./types.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

export async function extractWithOpenAI(text: string): Promise<ProcessedPdfData['measurements']> {
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Log a sample of the text we're processing
  console.log('Processing PDF text sample:', text.substring(0, 500));
  
  // First try direct regex extraction
  const totalAreaMatch = text.match(/Total Area[^=\n]*[:=]\s*([\d,\.]+)/i);
  console.log('Direct regex match for total area:', totalAreaMatch?.[1] || 'not found');

  if (totalAreaMatch && totalAreaMatch[1]) {
    const totalArea = parseFloat(totalAreaMatch[1].replace(/,/g, ''));
    if (totalArea > 0) {
      console.log('Found total area directly:', totalArea);
      // Continue with other direct extractions...
    }
  }

  // If direct extraction failed, try with OpenAI
  const prompt = `Extract ONLY the exact measurements found in this EagleView roof report. Return ONLY a JSON object with numeric values. Use null for any value not explicitly found in the text. Do not invent or estimate values.

  Required format:
  {
    "total_area": number or null,
    "predominant_pitch": "string in X/12 format" or null,
    "ridges": { "length": number or null, "count": number or null },
    "hips": { "length": number or null, "count": number or null },
    "valleys": { "length": number or null, "count": number or null },
    "rakes": { "length": number or null, "count": number or null },
    "eaves": { "length": number or null, "count": number or null },
    "suggested_waste_percentage": number or null
  }

  Here's the report text:
  ${text.substring(0, 3000)}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a precise measurement extractor. Only return measurements explicitly found in the text. Use null for missing values. Never guess or provide default values.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${await response.text()}`);
    }

    const data = await response.json();
    console.log('OpenAI raw response:', data);

    let content = data.choices[0].message.content.trim();
    content = content.replace(/^```json\n|\n```$/g, '');
    
    const measurements = JSON.parse(content);
    console.log('Parsed measurements:', measurements);

    // Validate total area - must be present and valid
    if (!measurements.total_area || measurements.total_area <= 0) {
      const error = new Error('Could not find valid total_area in the PDF');
      error.name = 'MeasurementNotFoundError';
      throw error;
    }

    return measurements;
  } catch (error) {
    console.error('Extraction error:', error);
    
    if (error.name === 'MeasurementNotFoundError') {
      throw error;
    }
    
    throw new Error(`Failed to extract measurements: ${error.message}`);
  }
}

function extractNumber(text: string, pattern: RegExp): number | null {
  const match = text.match(pattern);
  if (match && match[1]) {
    const value = parseFloat(match[1].replace(/,/g, ''));
    return !isNaN(value) && value > 0 ? value : null;
  }
  return null;
}

function extractPitch(text: string, pattern: RegExp): string | null {
  const match = text.match(pattern);
  if (match && match[1]) {
    return `${match[1]}/12`;
  }
  return null;
}