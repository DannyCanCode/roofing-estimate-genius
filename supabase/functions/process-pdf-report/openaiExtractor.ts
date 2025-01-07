import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

export async function extractWithOpenAI(text: string) {
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  console.log('Starting OpenAI extraction');

  // Clean up the text by removing PDF artifacts
  const cleanText = text
    .replace(/%PDF-.*?endobj/gs, '')
    .replace(/<<\/.*?>>/g, '')
    .replace(/endstream/g, '')
    .trim();

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
  ${cleanText.substring(0, 4000)}

  Return ONLY the JSON object, no other text. If you can't find a value, use null. DO NOT use markdown formatting or code blocks in your response.`;

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
            content: 'You are a helpful assistant that extracts roofing measurements from PDF text. Return only a JSON object without any markdown formatting.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3, // Lower temperature for more consistent output
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

    const extractedText = data.choices[0].message.content;
    console.log('Extracted text:', extractedText);

    try {
      // Remove any potential markdown formatting
      const cleanJson = extractedText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      console.log('Cleaned JSON:', cleanJson);
      const measurements = JSON.parse(cleanJson);
      
      // Validate the parsed measurements
      if (typeof measurements.total_area !== 'number' && measurements.total_area !== null) {
        throw new Error('Invalid total_area format');
      }

      return {
        total_area: measurements.total_area || 0,
        predominant_pitch: measurements.predominant_pitch || '4/12',
        suggested_waste_percentage: measurements.suggested_waste_percentage || 15
      };
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      console.error('Response content:', extractedText);
      throw new Error('Failed to parse OpenAI response');
    }
  } catch (error) {
    console.error('OpenAI extraction error:', error);
    throw error;
  }
}