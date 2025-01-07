import { ProcessedPdfData } from "./types.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

export async function extractWithOpenAI(text: string): Promise<ProcessedPdfData['measurements']> {
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `You are analyzing an EagleView roof measurement report. Extract these measurements and return them in a JSON format:
  - total_area (number in square feet)
  - total_area_less_penetrations (number in square feet)
  - predominant_pitch (string in X/12 format)
  - ridges: { length: number, count: number }
  - hips: { length: number, count: number }
  - valleys: { length: number, count: number }
  - rakes: { length: number, count: number }
  - eaves: { length: number, count: number }
  - suggested_waste_percentage (number)

  Look for patterns like:
  - "Total Area: X sq ft" or "Total Roof Area: X"
  - "Pitch: X/12" or "Predominant Pitch: X/12"
  - "Ridge Length: X ft" and "Ridge Count: Y"
  - "Waste Factor: X%" or "Suggested Waste: X%"

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
        model: 'gpt-4',
        messages: [
          { 
            role: 'system', 
            content: 'You are a specialized measurement extractor for EagleView roof reports. Extract measurements precisely and return them in the exact JSON format requested. If you cannot find a measurement, use 0 for numbers and "0/12" for pitch.' 
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

    if (!measurements.total_area) {
      console.log('Full text sample:', text.substring(0, 1000));
      throw new Error('Could not extract total area from PDF. Please ensure this is an EagleView report.');
    }

    return measurements;
  } catch (error) {
    console.error('OpenAI extraction error:', error);
    throw error;
  }
}