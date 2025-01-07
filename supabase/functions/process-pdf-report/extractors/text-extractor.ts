import { PDFDocument } from 'https://cdn.skypack.dev/pdf-lib';
import { measurementPatterns } from '../patterns/measurement-patterns.ts';

export interface ExtractedMeasurements {
  totalArea?: number;
  totalSquares?: number;
  pitch?: string;
  ridgesLength?: number;
  ridgesCount?: number;
  hipsLength?: number;
  hipsCount?: number;
  valleysLength?: number;
  valleysCount?: number;
  rakesLength?: number;
  rakesCount?: number;
  eavesLength?: number;
  eavesCount?: number;
  dripEdgeLength?: number;
  flashingLength?: number;
  stepFlashingLength?: number;
  totalPenetrationsArea?: number;
  wasteFactorArea?: number;
  suggestedWaste?: number;
  flatArea?: number;
  numberOfStories?: number;
}

export class TextExtractor {
  async extractText(pdfBytes: Uint8Array): Promise<string> {
    try {
      console.log('Loading PDF document');
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      console.log(`PDF loaded successfully with ${pages.length} pages`);
      
      let text = '';
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const pageText = await this.extractPageText(page);
        text += pageText + '\n';
      }
      
      return this.cleanText(text);
    } catch (error) {
      console.error('Error extracting text:', error);
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  private cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private async extractPageText(page: any): Promise<string> {
    try {
      const text = await page.getTextContent();
      return text.items.map((item: any) => item.str).join(' ');
    } catch (error) {
      console.error('Error extracting page text:', error);
      return '';
    }
  }

  extractMeasurements(text: string): ExtractedMeasurements {
    console.log('Extracting measurements from text');
    const measurements: ExtractedMeasurements = {};

    // Helper function to extract number from text
    const extractNumber = (pattern: RegExp): number | undefined => {
      const match = text.match(pattern);
      if (match && match[1]) {
        return parseFloat(match[1].replace(/,/g, ''));
      }
      return undefined;
    };

    // Extract total area
    const totalArea = extractNumber(/Total Area[^=\n]*=\s*([\d,]+)/i);
    if (totalArea) {
      measurements.totalArea = totalArea;
      measurements.totalSquares = totalArea / 100;
    }

    // Extract pitch
    const pitchMatch = text.match(/Predominant Pitch[^=\n]*=\s*(\d+)\/12/i);
    if (pitchMatch && pitchMatch[1]) {
      measurements.pitch = `${pitchMatch[1]}/12`;
    }

    // Extract ridge measurements
    measurements.ridgesLength = extractNumber(/Ridge Length[^=\n]*=\s*([\d,]+)/i);
    measurements.ridgesCount = extractNumber(/Ridge Count[^=\n]*=\s*(\d+)/i) || 1;

    // Extract hip measurements
    measurements.hipsLength = extractNumber(/Hip Length[^=\n]*=\s*([\d,]+)/i);
    measurements.hipsCount = extractNumber(/Hip Count[^=\n]*=\s*(\d+)/i) || 1;

    // Extract valley measurements
    measurements.valleysLength = extractNumber(/Valley Length[^=\n]*=\s*([\d,]+)/i);
    measurements.valleysCount = extractNumber(/Valley Count[^=\n]*=\s*(\d+)/i) || 1;

    // Extract rake measurements
    measurements.rakesLength = extractNumber(/Rake Length[^=\n]*=\s*([\d,]+)/i);
    measurements.rakesCount = extractNumber(/Rake Count[^=\n]*=\s*(\d+)/i) || 1;

    // Extract eave measurements
    measurements.eavesLength = extractNumber(/Eave Length[^=\n]*=\s*([\d,]+)/i);
    measurements.eavesCount = extractNumber(/Eave Count[^=\n]*=\s*(\d+)/i) || 1;

    // Extract number of stories
    measurements.numberOfStories = extractNumber(/Number of Stories[^=\n]*=\s*(\d+)/i);

    // Extract suggested waste
    measurements.suggestedWaste = extractNumber(/Suggested Waste[^=\n]*=\s*(\d+)/i);

    console.log('Extracted measurements:', measurements);
    return measurements;
  }
}