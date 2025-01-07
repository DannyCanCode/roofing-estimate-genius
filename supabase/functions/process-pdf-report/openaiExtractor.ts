import { ProcessedPdfData } from "./types.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

export async function extractWithOpenAI(text: string): Promise<ProcessedPdfData['measurements']> {
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // First try to extract measurements directly using regex
  const measurements = {
    total_area: extractNumber(text, /Total Roof Area:\s*([\d,.]+)/i),
    total_area_less_penetrations: 0,
    predominant_pitch: extractPitch(text, /Predominant Pitch:\s*(\d+)\/12/i),
    ridges: {
      length: extractNumber(text, /Ridges Length:\s*([\d,.]+)/i),
      count: extractNumber(text, /Ridges Count:\s*([\d,.]+)/i)
    },
    hips: {
      length: extractNumber(text, /Hips Length:\s*([\d,.]+)/i),
      count: extractNumber(text, /Hips Count:\s*([\d,.]+)/i)
    },
    valleys: {
      length: extractNumber(text, /Valleys Length:\s*([\d,.]+)/i),
      count: extractNumber(text, /Valleys Count:\s*([\d,.]+)/i)
    },
    rakes: {
      length: extractNumber(text, /Rakes Length:\s*([\d,.]+)/i),
      count: extractNumber(text, /Rakes Count:\s*([\d,.]+)/i)
    },
    eaves: {
      length: extractNumber(text, /Eaves Length:\s*([\d,.]+)/i),
      count: extractNumber(text, /Eaves Count:\s*([\d,.]+)/i)
    },
    suggested_waste_percentage: extractNumber(text, /Suggested Waste %?:\s*([\d,.]+)/i)
  };

  // If we found the measurements directly, return them
  if (measurements.total_area > 0) {
    console.log('Found measurements directly:', measurements);
    return measurements;
  }

  // If direct extraction failed, try with OpenAI
  const prompt = `Extract these exact measurements from this EagleView roof report and return ONLY a JSON object (no explanation or markdown):
  {
    "total_area": number,
    "total_area_less_penetrations": number,
    "predominant_pitch": "string in X/12 format",
    "ridges": { "length": number, "count": number },
    "hips": { "length": number, "count": number },
    "valleys": { "length": number, "count": number },
    "rakes": { "length": number, "count": number },
    "eaves": { "length": number, "count": number },
    "suggested_waste_percentage": number
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
            content: 'You are a specialized measurement extractor for EagleView roof reports. Return ONLY the JSON object with measurements, no explanation or markdown.' 
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

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI');
    }

    let content = data.choices[0].message.content.trim();
    
    // Extract JSON from the response, removing any markdown or explanatory text
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in OpenAI response');
    }

    const aiMeasurements = JSON.parse(jsonMatch[0]);
    console.log('AI parsed measurements:', aiMeasurements);

    // Validate the measurements
    if (!aiMeasurements.total_area || aiMeasurements.total_area <= 0) {
      throw new Error('Could not extract total area from PDF');
    }

    // Combine direct measurements with AI measurements, preferring direct measurements
    return {
      ...aiMeasurements,
      ...Object.fromEntries(
        Object.entries(measurements).filter(([_, value]) => 
          typeof value === 'number' ? value > 0 : 
          typeof value === 'object' ? (value.length > 0 || value.count > 0) : 
          value
        )
      )
    };
  } catch (error) {
    console.error('OpenAI extraction error:', error);
    if (measurements.total_area > 0) {
      return measurements;
    }
    throw error;
  }
}

function extractNumber(text: string, pattern: RegExp): number {
  const match = text.match(pattern);
  if (match && match[1]) {
    return parseFloat(match[1].replace(/,/g, ''));
  }
  return 0;
}

function extractPitch(text: string, pattern: RegExp): string {
  const match = text.match(pattern);
  if (match && match[1]) {
    return `${match[1]}/12`;
  }
  return "0/12";
}