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

      const cleanedText = this.cleanText(text);
      console.log('Extracted text sample:', cleanedText.substring(0, 500));
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
      // Get text content from the page
      const content = await page.getTextContent();
      let text = '';
      
      // Process each text item
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

    // Extract measurements using more flexible patterns
    const patterns = {
      totalArea: [
        /Total Area[^=\n]*=\s*([\d,]+)/i,
        /Total Roof Area[^=\n]*=\s*([\d,]+)/i,
        /Roof Area[^=\n]*:\s*([\d,]+)/i,
        /Area[^=\n]*=\s*([\d,]+)/i
      ],
      pitch: [
        /Predominant Pitch[^=\n]*=\s*(\d+)\/12/i,
        /Primary Pitch[^=\n]*=\s*(\d+)\/12/i,
        /Pitch[^=\n]*=\s*(\d+)\/12/i
      ],
      ridges: /Ridge.*?Length[^=\n]*=\s*([\d,]+).*?Count[^=\n]*=\s*(\d+)/is,
      hips: /Hip.*?Length[^=\n]*=\s*([\d,]+).*?Count[^=\n]*=\s*(\d+)/is,
      valleys: /Valley.*?Length[^=\n]*=\s*([\d,]+).*?Count[^=\n]*=\s*(\d+)/is,
      rakes: /Rake.*?Length[^=\n]*=\s*([\d,]+).*?Count[^=\n]*=\s*(\d+)/is,
      eaves: /Eave.*?Length[^=\n]*=\s*([\d,]+).*?Count[^=\n]*=\s*(\d+)/is,
      stories: [
        /Number of Stories[^=\n]*=\s*(\d+)/i,
        /Stories[^=\n]*=\s*(\d+)/i
      ],
      waste: [
        /Suggested Waste[^=\n]*=\s*(\d+)/i,
        /Waste Factor[^=\n]*=\s*(\d+)/i
      ]
    };

    // Try each pattern for total area
    let totalArea: number | undefined;
    for (const pattern of patterns.totalArea) {
      totalArea = extractNumber(pattern);
      if (totalArea) break;
    }

    if (totalArea) {
      measurements.totalArea = totalArea;
      measurements.totalSquares = totalArea / 100;
    } else {
      console.error('Could not extract total area');
      throw new Error('Could not extract total area from PDF');
    }

    // Extract pitch
    for (const pattern of patterns.pitch) {
      const match = text.match(pattern);
      if (match && match[1]) {
        measurements.pitch = `${match[1]}/12`;
        break;
      }
    }

    // Extract measurements with counts
    const extractMeasurementWithCount = (pattern: RegExp): { length?: number; count?: number } => {
      const match = text.match(pattern);
      if (match && match[1] && match[2]) {
        return {
          length: parseFloat(match[1].replace(/,/g, '')),
          count: parseInt(match[2])
        };
      }
      return {};
    };

    // Extract ridge measurements
    const ridges = extractMeasurementWithCount(patterns.ridges);
    measurements.ridgesLength = ridges.length;
    measurements.ridgesCount = ridges.count;

    // Extract hip measurements
    const hips = extractMeasurementWithCount(patterns.hips);
    measurements.hipsLength = hips.length;
    measurements.hipsCount = hips.count;

    // Extract valley measurements
    const valleys = extractMeasurementWithCount(patterns.valleys);
    measurements.valleysLength = valleys.length;
    measurements.valleysCount = valleys.count;

    // Extract rake measurements
    const rakes = extractMeasurementWithCount(patterns.rakes);
    measurements.rakesLength = rakes.length;
    measurements.rakesCount = rakes.count;

    // Extract eave measurements
    const eaves = extractMeasurementWithCount(patterns.eaves);
    measurements.eavesLength = eaves.length;
    measurements.eavesCount = eaves.count;

    // Extract number of stories
    for (const pattern of patterns.stories) {
      measurements.numberOfStories = extractNumber(pattern);
      if (measurements.numberOfStories) break;
    }

    // Extract suggested waste
    for (const pattern of patterns.waste) {
      measurements.suggestedWaste = extractNumber(pattern);
      if (measurements.suggestedWaste) break;
    }

    console.log('Extracted measurements:', measurements);
    return measurements;
  }
}