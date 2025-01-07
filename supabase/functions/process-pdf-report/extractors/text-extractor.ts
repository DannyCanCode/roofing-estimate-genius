import { PDFDocument } from 'https://cdn.skypack.dev/pdf-lib';

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
  flatArea?: number;
  numberOfStories?: number;
  suggestedWaste?: number;
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
        console.log(`Processing page ${i + 1}`);
        const page = pages[i];
        const pageText = await this.extractPageText(page);
        text += pageText + '\n';
      }

      console.log('Raw extracted text sample:', text.substring(0, 500));
      const cleanedText = this.cleanText(text);
      console.log('Cleaned text sample:', cleanedText.substring(0, 500));
      return cleanedText;
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
      const content = await page.getTextContent();
      let text = '';
      
      for (const item of content.items) {
        if (typeof item.str === 'string') {
          text += item.str + ' ';
        }
      }
      
      return text;
    } catch (error) {
      console.error('Error extracting page text:', error);
      return '';
    }
  }

  extractMeasurements(text: string): ExtractedMeasurements {
    console.log('Starting measurement extraction from text');
    
    const measurements: ExtractedMeasurements = {};

    // More flexible patterns for total area
    const totalAreaPatterns = [
      /Total Area[^=\n]*[:=]\s*([\d,\.]+)/i,
      /Total Roof Area[^=\n]*[:=]\s*([\d,\.]+)/i,
      /Roof Area[^=\n]*[:=]\s*([\d,\.]+)/i,
      /Total Square Feet[^=\n]*[:=]\s*([\d,\.]+)/i,
      /Total Squares[^=\n]*[:=]\s*([\d,\.]+)/i,
      /Area[^=\n]*[:=]\s*([\d,\.]+)/i
    ];

    // Try each pattern for total area
    let totalAreaFound = false;
    for (const pattern of totalAreaPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const value = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(value) && value > 0) {
          measurements.totalArea = value;
          measurements.totalSquares = value / 100;
          totalAreaFound = true;
          console.log('Found total area:', value);
          break;
        }
      }
    }

    if (!totalAreaFound) {
      console.error('Could not find total area in text');
      console.log('Text content for debugging:', text);
      throw new Error('Could not extract total area from PDF');
    }

    // Extract pitch with more flexible patterns
    const pitchPatterns = [
      /Predominant Pitch[^=\n]*[:=]\s*(\d+)\/12/i,
      /Primary Pitch[^=\n]*[:=]\s*(\d+)\/12/i,
      /Pitch[^=\n]*[:=]\s*(\d+)\/12/i,
      /(\d+)\/12\s*pitch/i
    ];

    for (const pattern of pitchPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        measurements.pitch = `${match[1]}/12`;
        console.log('Found pitch:', measurements.pitch);
        break;
      }
    }

    // Extract measurements with counts using more flexible patterns
    const measurementPatterns = {
      ridges: /Ridge.*?Length[^=\n]*[:=]\s*([\d,\.]+).*?Count[^=\n]*[:=]\s*(\d+)/is,
      hips: /Hip.*?Length[^=\n]*[:=]\s*([\d,\.]+).*?Count[^=\n]*[:=]\s*(\d+)/is,
      valleys: /Valley.*?Length[^=\n]*[:=]\s*([\d,\.]+).*?Count[^=\n]*[:=]\s*(\d+)/is,
      rakes: /Rake.*?Length[^=\n]*[:=]\s*([\d,\.]+).*?Count[^=\n]*[:=]\s*(\d+)/is,
      eaves: /Eave.*?Length[^=\n]*[:=]\s*([\d,\.]+).*?Count[^=\n]*[:=]\s*(\d+)/is
    };

    for (const [key, pattern] of Object.entries(measurementPatterns)) {
      const match = text.match(pattern);
      if (match && match[1] && match[2]) {
        const length = parseFloat(match[1].replace(/,/g, ''));
        const count = parseInt(match[2]);
        if (!isNaN(length) && !isNaN(count)) {
          measurements[`${key}Length`] = length;
          measurements[`${key}Count`] = count;
          console.log(`Found ${key}:`, { length, count });
        }
      }
    }

    // Extract number of stories
    const storiesPatterns = [
      /Number of Stories[^=\n]*[:=]\s*(\d+)/i,
      /Stories[^=\n]*[:=]\s*(\d+)/i,
      /(\d+)\s*stories?/i
    ];

    for (const pattern of storiesPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        measurements.numberOfStories = parseInt(match[1]);
        console.log('Found number of stories:', measurements.numberOfStories);
        break;
      }
    }

    // Extract suggested waste percentage
    const wastePatterns = [
      /Suggested Waste[^=\n]*[:=]\s*(\d+)/i,
      /Waste Factor[^=\n]*[:=]\s*(\d+)/i,
      /Waste[^=\n]*[:=]\s*(\d+)/i
    ];

    for (const pattern of wastePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        measurements.suggestedWaste = parseInt(match[1]);
        console.log('Found suggested waste:', measurements.suggestedWaste);
        break;
      }
    }

    console.log('Final extracted measurements:', measurements);
    return measurements;
  }
}
