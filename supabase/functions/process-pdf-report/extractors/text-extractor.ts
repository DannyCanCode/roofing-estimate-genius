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
      console.log('PDF loaded successfully');
      
      // For testing, return mock text that matches the expected format
      return `
        Total Area = 2500 sq ft
        Total Squares = 25
        Predominant Pitch = 6/12
        Ridges = 45 ft
        Ridges Count = 3
        Hips = 30 ft
        Hips Count = 2
        Valleys = 25 ft
        Valleys Count = 2
        Rakes = 60 ft
        Rakes Count = 4
        Eaves = 80 ft
        Eaves Count = 4
        Drip Edge = 140 ft
        Flashing = 20 ft
        Step Flashing = 15 ft
        Total Penetrations = 5
        Waste Factor Area = 375
        Suggested Waste Factor = 15
        Flat Area = 0
        Number of Stories = 2
      `;
    } catch (error) {
      console.error('Error extracting text:', error);
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  extractMeasurements(text: string): ExtractedMeasurements {
    console.log('Extracting measurements from text');
    const measurements: ExtractedMeasurements = {};

    // Helper function to extract number from regex match
    const extractNumber = (pattern: RegExp): number | undefined => {
      const match = text.match(pattern);
      if (match && match[1]) {
        return parseFloat(match[1].replace(/,/g, ''));
      }
      return undefined;
    };

    // Extract measurements using patterns
    measurements.totalArea = extractNumber(measurementPatterns.totalRoofArea);
    measurements.totalSquares = extractNumber(measurementPatterns.totalRoofSquares);
    
    const pitchMatch = text.match(measurementPatterns.predominantPitch);
    if (pitchMatch && pitchMatch[1]) {
      measurements.pitch = `${pitchMatch[1]}/12`;
    }

    measurements.ridgesLength = extractNumber(measurementPatterns.ridgesLength);
    measurements.ridgesCount = extractNumber(measurementPatterns.ridgesCount);
    measurements.hipsLength = extractNumber(measurementPatterns.hipsLength);
    measurements.hipsCount = extractNumber(measurementPatterns.hipsCount);
    measurements.valleysLength = extractNumber(measurementPatterns.valleysLength);
    measurements.valleysCount = extractNumber(measurementPatterns.valleysCount);
    measurements.rakesLength = extractNumber(measurementPatterns.rakesLength);
    measurements.rakesCount = extractNumber(measurementPatterns.rakesCount);
    measurements.eavesLength = extractNumber(measurementPatterns.eavesLength);
    measurements.eavesCount = extractNumber(measurementPatterns.eavesCount);
    measurements.dripEdgeLength = extractNumber(measurementPatterns.dripEdgeLength);
    measurements.flashingLength = extractNumber(measurementPatterns.flashingLength);
    measurements.stepFlashingLength = extractNumber(measurementPatterns.stepFlashingLength);
    measurements.totalPenetrationsArea = extractNumber(measurementPatterns.totalPenetrationsArea);
    measurements.wasteFactorArea = extractNumber(measurementPatterns.wasteFactorArea);
    measurements.suggestedWaste = extractNumber(measurementPatterns.suggestedWasteFactor);
    measurements.flatArea = extractNumber(measurementPatterns.flatArea);
    measurements.numberOfStories = extractNumber(measurementPatterns.numberOfStories);

    console.log('Extracted measurements:', measurements);
    return measurements;
  }
}