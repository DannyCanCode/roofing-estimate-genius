import { PDFDocument } from 'https://cdn.skypack.dev/pdf-lib';
import { cleanText, logTextChunks } from '../utils/text-processing.ts';
import { totalAreaPatterns, generalAreaPattern, pitchPatterns } from '../utils/measurement-patterns.ts';
import type { ExtractedMeasurements } from '../types/measurements.ts';

export class TextExtractor {
  async extractText(pdfBytes: Uint8Array): Promise<string> {
    try {
      console.log('Loading PDF document');
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      console.log(`PDF loaded successfully with ${pages.length} pages`);
      
      let text = '';
      for (let i = 0; i < pages.length; i++) {
        console.log(`Processing page ${i + 1}`);
        const page = pages[i];
        const pageText = await this.extractPageText(page);
        text += pageText + '\n';
      }

      console.log('Raw extracted text:', text);
      const cleanedText = cleanText(text);
      console.log('Cleaned text:', cleanedText);
      
      return cleanedText;
    } catch (error) {
      console.error('Error extracting text:', error);
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  private async extractPageText(page: any): Promise<string> {
    try {
      const content = await page.getTextContent();
      return content.items
        .map((item: any) => typeof item.str === 'string' ? item.str : '')
        .join(' ')
        .trim();
    } catch (error) {
      console.error('Error extracting page text:', error);
      return '';
    }
  }

  async extractMeasurements(text: string): Promise<ExtractedMeasurements> {
    console.log('Starting measurement extraction from text');
    
    const measurements: ExtractedMeasurements = {
      totalArea: 0,
      totalSquares: 0,
      pitch: "4/12" // Default pitch
    };

    // Try regex patterns first
    let totalAreaFound = false;
    
    for (const pattern of totalAreaPatterns) {
      console.log('Trying pattern:', pattern);
      const match = text.match(pattern);
      if (match && match[1]) {
        const value = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(value) && value > 0) {
          measurements.totalArea = value;
          measurements.totalSquares = value / 100;
          totalAreaFound = true;
          console.log('Found total area:', value, 'using pattern:', pattern);
          break;
        }
      }
    }

    // If regex patterns fail, try OpenAI
    if (!totalAreaFound) {
      console.log('Attempting to extract measurements using OpenAI');
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
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are a helpful assistant that extracts roof measurements from text. Return only the number for total roof area in square feet.'
              },
              {
                role: 'user',
                content: `Extract the total roof area in square feet from this text: ${text}`
              }
            ],
          }),
        });

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;
        console.log('OpenAI response:', aiResponse);

        // Try to extract a number from the AI response
        const numberMatch = aiResponse.match(/\d[\d,]*/);
        if (numberMatch) {
          const value = parseFloat(numberMatch[0].replace(/,/g, ''));
          if (!isNaN(value) && value > 0) {
            measurements.totalArea = value;
            measurements.totalSquares = value / 100;
            totalAreaFound = true;
            console.log('Found total area using OpenAI:', value);
          }
        }
      } catch (error) {
        console.error('Error using OpenAI:', error);
      }
    }

    // Extract pitch
    for (const pattern of pitchPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        measurements.pitch = `${match[1]}/12`;
        console.log('Found pitch:', measurements.pitch);
        break;
      }
    }

    console.log('Final extracted measurements:', measurements);
    return measurements;
  }
}