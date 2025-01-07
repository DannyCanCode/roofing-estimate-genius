import { ProcessedPdfData } from "./types.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

export async function extractWithOpenAI(text: string): Promise<ProcessedPdfData['measurements']> {
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  console.log('Starting OpenAI extraction with text length:', text.length);

  const prompt = `Extract roofing measurements from this text. Return ONLY a JSON object with these fields:
  - total_area (number): The total roof area in square feet
  - predominant_pitch (string): The main roof pitch in X/12 format (e.g., "4/12")
  - suggested_waste_percentage (number): The suggested waste percentage

  Look for phrases like:
  - "Total Area = X sq ft"
  - "Total Squares = X"
  - "Pitch = X/12"
  - "Waste Factor = X%"

  Here's the text:
  ${text.substring(0, 4000)}

  Return ONLY a raw JSON object with these three fields. No explanations, no markdown.`;

  try {
    console.log('Sending request to OpenAI');
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
            content: 'You are a measurement extractor. Return only raw JSON with total_area (number), predominant_pitch (string), and suggested_waste_percentage (number). No explanations or formatting.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI');
    }

    const content = data.choices[0].message.content.trim();
    console.log('Raw content:', content);

    try {
      const measurements = JSON.parse(content);
      
      // Validate the measurements
      if (typeof measurements.total_area !== 'number' && measurements.total_area !== null) {
        throw new Error('Invalid total_area format');
      }

      return {
        total_area: measurements.total_area || 0,
        predominant_pitch: measurements.predominant_pitch || '4/12',
        suggested_waste_percentage: measurements.suggested_waste_percentage || 15
      };
    } catch (error) {
      console.error('Error parsing measurements:', error);
      console.error('Raw content was:', content);
      throw new Error(`Failed to parse measurements: ${error.message}`);
    }
  } catch (error) {
    console.error('OpenAI extraction error:', error);
    throw error;
  }
}