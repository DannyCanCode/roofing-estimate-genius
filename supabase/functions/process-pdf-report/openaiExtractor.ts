import { ProcessedPdfData } from "./types.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// Helper to extract and validate measurements with context
const extractWithContext = (text: string, pattern: RegExp, contextWindow: number = 50): { value: number | null; context: string } => {
  const matches = Array.from(text.matchAll(new RegExp(pattern, 'gi')));
  
  for (const match of matches) {
    if (!match.index) continue;
    
    const start = Math.max(0, match.index - contextWindow);
    const end = Math.min(text.length, match.index + match[0].length + contextWindow);
    const context = text.slice(start, end).trim();
    
    // Check if context contains relevant keywords
    const hasRelevantContext = /(?:total|roof|area|pitch|square|sq\.?\s*ft)/i.test(context);
    
    if (hasRelevantContext) {
      const value = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(value) && value > 0) {
        console.log('Found valid measurement with context:', { value, context });
        return { value, context };
      }
    }
  }
  
  return { value: null, context: '' };
};

// Check if PDF appears to be text-based
const isTextBasedPDF = (text: string): boolean => {
  const hasMinimalText = text.length > 1000;
  const containsCommonPdfText = text.includes('endobj') || text.includes('stream');
  const containsTextualContent = /[a-zA-Z]{50,}/.test(text); // Look for substantial text
  
  console.log('PDF Analysis:', {
    textLength: text.length,
    hasCommonPdfMarkers: containsCommonPdfText,
    hasTextualContent: containsTextualContent,
    sample: text.substring(0, 200)
  });
  
  return hasMinimalText && (containsCommonPdfText || containsTextualContent);
};

export async function extractWithOpenAI(text: string): Promise<ProcessedPdfData['measurements']> {
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Log a sample of the text we're processing
  console.log('Processing PDF text sample:', text.substring(0, 500));
  
  // Check if PDF appears to be text-based
  if (!isTextBasedPDF(text)) {
    console.log('PDF Analysis:', {
      textLength: text.length,
      sample: text.substring(0, 200)
    });
    throw new Error('This appears to be a scanned PDF. Please ensure you are uploading a text-based PDF from EagleView.');
  }

  // First try direct regex extraction with context validation
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
    const { value, context } = extractWithContext(text, pattern);
    if (value !== null) {
      console.log('Found direct match:', { value, context });
      directMatch = value;
      matchContext = context;
      break;
    }
  }

  // Enhanced prompt with examples and context
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

  Here's the relevant text context:
  ${matchContext || text.substring(0, 3000)}`;

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

    // If we found a direct match earlier, use it if it has valid context
    if (directMatch && matchContext) {
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