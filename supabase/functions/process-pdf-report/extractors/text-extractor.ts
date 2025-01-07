import { textExtractionPatterns } from '../utils/pdf-patterns.ts';
import { PdfParser } from './pdf-parser.ts';
import type { ExtractedMeasurements } from '../types/measurements.ts';

export class TextExtractor {
  private pdfParser: PdfParser;

  constructor() {
    this.pdfParser = new PdfParser();
  }

  async extractText(pdfBytes: Uint8Array): Promise<string> {
    return this.pdfParser.extractText(pdfBytes);
  }

  async extractMeasurements(text: string): Promise<ExtractedMeasurements> {
    console.log('Starting measurement extraction');
    console.log('Text length:', text.length);
    
    const measurements: ExtractedMeasurements = {
      totalArea: 0,
      totalSquares: 0,
      pitch: "4/12" // Default pitch
    };

    // Try to extract total area
    const totalArea = this.pdfParser.findMeasurement(text, textExtractionPatterns.totalArea);
    if (totalArea) {
      measurements.totalArea = totalArea;
      measurements.totalSquares = totalArea / 100;
      console.log('Found total area:', totalArea);
    } else {
      console.log('No total area found, attempting OpenAI extraction');
      try {
        const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
        if (!openAIApiKey) {
          throw new Error('OpenAI API key not configured');
        }

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
                content: 'Extract the total roof area in square feet from this text. Return only the number.'
              },
              {
                role: 'user',
                content: text
              }
            ],
          }),
        });

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;
        console.log('AI response:', aiResponse);

        const numberMatch = aiResponse.match(/\d[\d,]*/);
        if (numberMatch) {
          const value = parseFloat(numberMatch[0].replace(/,/g, ''));
          if (!isNaN(value) && value > 0) {
            measurements.totalArea = value;
            measurements.totalSquares = value / 100;
            console.log('Found total area using OpenAI:', value);
          }
        }
      } catch (error) {
        console.error('OpenAI extraction error:', error);
      }
    }

    // Extract pitch
    const pitchValue = this.pdfParser.findMeasurement(text, textExtractionPatterns.pitch);
    if (pitchValue) {
      measurements.pitch = `${pitchValue}/12`;
      console.log('Found pitch:', measurements.pitch);
    }

    if (!measurements.totalArea) {
      throw new Error('Could not extract total area from PDF');
    }

    console.log('Final measurements:', measurements);
    return measurements;
  }
}