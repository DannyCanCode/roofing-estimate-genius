import { ProcessedPdfData } from "./types.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

export async function extractWithOpenAI(text: string): Promise<ProcessedPdfData['measurements']> {
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `Extract ONLY these measurements from the provided PDF text. Return ONLY a JSON object with these exact fields (no explanation):
  - Total roof area (in square feet)
  - Total area less penetrations (in square feet)
  - Predominant roof pitch (in X/12 format)
  - Ridges length and count
  - Hips length and count
  - Valleys length and count
  - Rakes length and count
  - Eaves length and count
  - Suggested waste percentage (from the waste calculation table, use the suggested percentage)

  Here's the text to analyze (showing first 2000 chars):
  ${text.substring(0, 2000)}`;

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
            content: 'You are a measurement extractor. Return only the exact JSON structure requested with accurate measurements from the PDF. Format lengths as numbers and counts as integers.' 
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

    return {
      total_area: measurements.total_area,
      total_area_less_penetrations: measurements.total_area_less_penetrations,
      predominant_pitch: measurements.predominant_pitch,
      ridges: measurements.ridges,
      hips: measurements.hips,
      valleys: measurements.valleys,
      rakes: measurements.rakes,
      eaves: measurements.eaves,
      suggested_waste_percentage: measurements.suggested_waste_percentage
    };
  } catch (error) {
    console.error('OpenAI extraction error:', error);
    throw error;
  }
}