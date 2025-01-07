import { ProcessedPdfData } from "./types.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

export async function extractWithOpenAI(text: string): Promise<ProcessedPdfData['measurements']> {
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `You are a PDF measurement extractor. Extract ONLY these measurements from the provided PDF text:
  - Total roof area (in square feet)
  - Predominant roof pitch (in X/12 format)
  - Suggested waste percentage
  - Ridge length and count
  - Hip length and count
  - Valley length and count
  - Rake length and count
  - Eave length and count
  - Number of stories

  Return ONLY a JSON object with these exact fields (no explanation, no markdown):
  {
    "total_area": number,
    "predominant_pitch": "string (X/12 format)",
    "suggested_waste_percentage": number,
    "ridges": { "length": number, "count": number },
    "hips": { "length": number, "count": number },
    "valleys": { "length": number, "count": number },
    "rakes": { "length": number, "count": number },
    "eaves": { "length": number, "count": number },
    "number_of_stories": number
  }

  Here's the text to analyze:
  ${text.substring(0, 4000)}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: 'You are a measurement extractor. Return only the exact JSON structure requested with accurate measurements from the PDF. No explanations or additional formatting.' 
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
    content = content.replace(/```json\n?|\n?```/g, '');

    const measurements = JSON.parse(content);
    console.log('Parsed measurements:', measurements);

    // Validate all required fields are present and in correct format
    if (typeof measurements.total_area !== 'number' || measurements.total_area <= 0) {
      throw new Error('Invalid or missing total area');
    }

    if (!measurements.predominant_pitch?.match(/^\d+\/12$/)) {
      throw new Error('Invalid pitch format');
    }

    return {
      total_area: measurements.total_area,
      predominant_pitch: measurements.predominant_pitch,
      suggested_waste_percentage: measurements.suggested_waste_percentage || 15,
      ridges: measurements.ridges || { length: 0, count: 0 },
      hips: measurements.hips || { length: 0, count: 0 },
      valleys: measurements.valleys || { length: 0, count: 0 },
      rakes: measurements.rakes || { length: 0, count: 0 },
      eaves: measurements.eaves || { length: 0, count: 0 },
      number_of_stories: measurements.number_of_stories || 1
    };
  } catch (error) {
    console.error('OpenAI extraction error:', error);
    throw error;
  }
}