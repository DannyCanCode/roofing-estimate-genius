import { PDFDocument } from 'https://cdn.skypack.dev/pdf-lib';
import { cleanText, logTextChunks, extractNumber } from '../utils/text-processing.ts';
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

      console.log('Raw extracted text sample (first 1000 chars):', text.substring(0, 1000));
      const cleanedText = cleanText(text);
      console.log('Cleaned text sample (first 1000 chars):', cleanedText.substring(0, 1000));
      return cleanedText;
    } catch (error) {
      console.error('Error extracting text:', error);
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  private async extractPageText(page: any): Promise<string> {
    try {
      const content = await page.getTextContent();
      const text = content.items
        .map((item: any) => typeof item.str === 'string' ? item.str : '')
        .join(' ')
        .trim();
      
      if (!text) {
        console.warn('No text content found on page');
        return '';
      }
      
      console.log('Extracted page text sample:', text.substring(0, 200));
      return text;
    } catch (error) {
      console.error('Error extracting page text:', error);
      return '';
    }
  }

  extractMeasurements(text: string): ExtractedMeasurements {
    console.log('Starting measurement extraction from text');
    logTextChunks(text);
    
    const measurements: ExtractedMeasurements = {};
    let totalAreaFound = false;

    // Try each pattern for total area
    for (const pattern of totalAreaPatterns) {
      console.log('Trying pattern:', pattern);
      const value = extractNumber(text, pattern);
      if (value !== null && value > 0) {
        measurements.totalArea = value;
        measurements.totalSquares = value / 100;
        totalAreaFound = true;
        console.log('Found total area:', value, 'using pattern:', pattern);
        break;
      }
    }

    // Try general area pattern as fallback
    if (!totalAreaFound) {
      console.log('Trying general area pattern:', generalAreaPattern);
      const value = extractNumber(text, generalAreaPattern);
      if (value !== null && value > 0) {
        measurements.totalArea = value;
        measurements.totalSquares = value / 100;
        totalAreaFound = true;
        console.log('Found total area using general pattern:', value);
      }
    }

    // Log the entire text if no area was found
    if (!totalAreaFound) {
      console.error('Could not find total area. Full text content:', text);
      throw new Error('Could not extract total area from PDF. Please ensure the PDF contains valid measurements.');
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