const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

export async function extractWithOpenAI(text: string) {
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `Extract the following measurements from this roofing report text. Return ONLY a JSON object with these fields:
  - total_area (number): The total roof area in square feet
  - predominant_pitch (string): The main roof pitch in X/12 format
  - suggested_waste_percentage (number): The suggested waste percentage

  Here's the text:
  ${text.substring(0, 4000)} // Limit text length for token constraints

  Return ONLY the JSON object, no other text.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that extracts roofing measurements from PDF text.' },
        { role: 'user', content: prompt }
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  const extractedText = data.choices[0].message.content;

  try {
    const measurements = JSON.parse(extractedText);
    return {
      total_area: Number(measurements.total_area) || 0,
      predominant_pitch: measurements.predominant_pitch || '4/12',
      suggested_waste_percentage: Number(measurements.suggested_waste_percentage) || 15
    };
  } catch (error) {
    console.error('Error parsing OpenAI response:', error);
    throw new Error('Failed to parse OpenAI response');
  }
}