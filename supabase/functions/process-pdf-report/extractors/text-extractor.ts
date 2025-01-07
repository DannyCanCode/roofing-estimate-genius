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
      
      // For development, return mock data until we implement proper PDF parsing
      return `
        Total Area (All Pitches) = 2500 sq ft
        Total Squares = 25
        Predominant Pitch = 6/12
        Ridge Length = 45 ft
        Ridge Count = 3
        Hip Length = 30 ft
        Hip Count = 2
        Valley Length = 25 ft
        Valley Count = 2
        Rake Length = 60 ft
        Rake Count = 4
        Eave Length = 80 ft
        Eave Count = 4
        Number of Stories = 2
        Suggested Waste Factor = 15
      `;
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
    } else {
      console.error('Could not extract total area');
      throw new Error('Could not extract total area from PDF');
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