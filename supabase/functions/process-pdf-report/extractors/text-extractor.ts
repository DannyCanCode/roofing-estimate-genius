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

  extractMeasurements(text: string): ExtractedMeasurements {
    console.log('Starting measurement extraction from text');
    
    const measurements: ExtractedMeasurements = {
      totalArea: 0,
      totalSquares: 0,
      pitch: "4/12" // Default pitch
    };

    // Try each pattern for total area
    let totalAreaFound = false;
    
    // First try specific patterns
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

    // If no specific pattern matched, try general area pattern
    if (!totalAreaFound) {
      console.log('Trying general area pattern:', generalAreaPattern);
      const match = text.match(generalAreaPattern);
      if (match && match[1]) {
        const value = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(value) && value > 0) {
          measurements.totalArea = value;
          measurements.totalSquares = value / 100;
          totalAreaFound = true;
          console.log('Found total area using general pattern:', value);
        }
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