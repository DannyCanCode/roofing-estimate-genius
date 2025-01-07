import { ProcessedPdfData } from "./types.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

export async function extractWithOpenAI(text: string): Promise<ProcessedPdfData['measurements']> {
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Log a sample of the text we're processing
  console.log('Processing PDF text sample:', text.substring(0, 500));
  
  // Check if PDF appears to be text-based
  const hasMinimalText = text.length > 1000; // Basic heuristic
  const containsCommonPdfText = text.includes('endobj') || text.includes('stream');
  
  if (!hasMinimalText || !containsCommonPdfText) {
    console.log('PDF appears to be image-based or scanned:', {
      textLength: text.length,
      hasCommonPdfMarkers: containsCommonPdfText
    });
    throw new Error('This appears to be a scanned PDF. Please ensure you are uploading a text-based PDF from EagleView.');
  }

  // Search for area measurements with various patterns
  const areaPatterns = [
    /Total Area[^=\n]*[:=]\s*([\d,\.]+)/i,
    /Total Roof Area[^=\n]*[:=]\s*([\d,\.]+)/i,
    /Area \(All Pitches\)[^=\n]*[:=]\s*([\d,\.]+)/i,
    /Total Square Footage[^=\n]*[:=]\s*([\d,\.]+)/i,
    /(\d{2,}(?:,\d{3})*(?:\.\d+)?)\s*(?:sq\.?\s*ft\.?|square\s*feet)/i
  ];

  let directMatch = null;
  for (const pattern of areaPatterns) {
    const match = text.match(pattern);
    if (match) {
      console.log('Found direct area match:', {
        pattern: pattern.toString(),
        match: match[1],
        context: match[0]
      });
      directMatch = parseFloat(match[1].replace(/,/g, ''));
      break;
    }
  }

  // If direct regex fails, try with OpenAI
  const prompt = `Extract ONLY the exact measurements found in this EagleView roof report. Look for any of these variations:
  - "Total Area" or "Total Roof Area"
  - Area followed by "sq ft", "square feet", or "SF"
  - Area listed under "All Pitches"
  - Any numeric value explicitly labeled as the total roof area

  Return ONLY a JSON object with numeric values. Use null for any value not explicitly found in the text.
  Do NOT estimate or provide default values.

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
    // Remove markdown code fences if present
    content = content.replace(/^```json\n|\n```$/g, '');
    
    const measurements = JSON.parse(content);
    console.log('Parsed measurements:', measurements);

    // If we found a direct match earlier, use it
    if (directMatch) {
      measurements.total_area = directMatch;
    }

    // Validate total area - must be present and valid
    if (!measurements.total_area || measurements.total_area <= 0) {
      console.log('No valid total_area found in measurements:', measurements);
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