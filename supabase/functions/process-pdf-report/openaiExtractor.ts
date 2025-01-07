import { ProcessedPdfData } from "./types.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

export async function extractWithOpenAI(text: string): Promise<ProcessedPdfData['measurements']> {
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Log a sample of the text we're processing
  console.log('Processing PDF text sample:', text.substring(0, 500));
  
  // Check if PDF appears to be text-based
  const hasMinimalText = text.length > 1000;
  const containsCommonPdfText = text.includes('endobj') || text.includes('stream');
  const containsTextualContent = /[a-zA-Z]{50,}/.test(text); // Look for substantial text
  
  if (!hasMinimalText || (!containsCommonPdfText && !containsTextualContent)) {
    console.log('PDF Analysis:', {
      textLength: text.length,
      hasCommonPdfMarkers: containsCommonPdfText,
      hasTextualContent: containsTextualContent,
      sample: text.substring(0, 200)
    });
    throw new Error('This appears to be a scanned PDF. Please ensure you are uploading a text-based PDF from EagleView.');
  }

  // Expanded patterns for area measurements
  const areaPatterns = [
    /Total(?:\s+Roof)?\s*Area[^=\n]*[:=]\s*([\d,\.]+)/i,
    /Area\s*\(?(?:All\s*Pitches)?\)?[^=\n]*[:=]\s*([\d,\.]+)/i,
    /Total\s*Square\s*Footage[^=\n]*[:=]\s*([\d,\.]+)/i,
    /(?:Total|Roof)\s*SF[^=\n]*[:=]\s*([\d,\.]+)/i,
    /(\d{2,}(?:,\d{3})*(?:\.\d+)?)\s*(?:sq\.?\s*ft\.?|square\s*feet|SF)/i,
    /All\s*Pitches[^=\n]*[:=]\s*([\d,\.]+)/i
  ];

  let directMatch = null;
  let matchContext = '';
  
  for (const pattern of areaPatterns) {
    // Search for pattern with context (100 chars before and after)
    const contextSearch = new RegExp(`.{0,100}${pattern.source}.{0,100}`, 'i');
    const contextMatch = text.match(contextSearch);
    
    if (contextMatch) {
      const match = contextMatch[0].match(pattern);
      if (match && match[1]) {
        console.log('Found area match:', {
          pattern: pattern.toString(),
          value: match[1],
          fullContext: contextMatch[0].trim()
        });
        directMatch = parseFloat(match[1].replace(/,/g, ''));
        matchContext = contextMatch[0];
        break;
      }
    }
  }

  // Enhanced prompt with examples
  const prompt = `Extract ONLY the exact measurements found in this EagleView roof report. Look for these specific patterns:

  - "Total Area" or "Total Roof Area" followed by a number
  - Area measurements like "2865 SF" or "2865 sq ft"
  - "Area (All Pitches)" followed by measurements
  - Any explicit total area measurement in square feet

  Examples of valid matches:
  "Total Area = 2865 sq ft" → total_area: 2865
  "All Pitches: 2865 SF" → total_area: 2865
  "Total Square Footage: 2,865" → total_area: 2865

  Return ONLY a JSON object with numeric values. Use null ONLY if the measurement is truly not present.
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
    content = content.replace(/^```json\n|\n```$/g, '');
    
    const measurements = JSON.parse(content);
    console.log('Parsed measurements:', measurements);

    // If we found a direct match earlier, use it
    if (directMatch) {
      console.log('Using direct regex match:', {
        value: directMatch,
        context: matchContext.trim()
      });
      measurements.total_area = directMatch;
    }

    // Validate total area - must be present and valid
    if (!measurements.total_area || measurements.total_area <= 0) {
      console.log('No valid total_area found:', {
        measurements,
        textSample: text.substring(0, 500),
        possibleMatches: text.match(/\d+(?:\.\d+)?\s*(?:sq\.?\s*ft\.?|SF)/gi)
      });
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