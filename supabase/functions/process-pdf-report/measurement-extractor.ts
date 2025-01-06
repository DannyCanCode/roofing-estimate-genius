import { PDFDocument } from 'https://cdn.skypack.dev/pdf-lib';
import { TextExtractor } from './extractors/text-extractor.ts';
import { EagleViewParser } from './extractors/eagleview-parser.ts';
import { MeasurementsValidator } from './validators/measurements-validator.ts';
import { RoofMeasurements } from './types/measurements.ts';

export class MeasurementExtractor {
  private textExtractor: TextExtractor;
  private parser: EagleViewParser;
  private validator: MeasurementsValidator;

  constructor() {
    this.textExtractor = new TextExtractor();
    this.parser = new EagleViewParser();
    this.validator = new MeasurementsValidator();
  }

  async extractMeasurements(pdfBytes: ArrayBuffer): Promise<RoofMeasurements> {
    console.log('Starting measurement extraction');
    
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    console.log(`Processing PDF with ${pages.length} pages`);

    let textContent = '';
    for (let i = 0; i < pages.length; i++) {
      console.log(`Processing page ${i + 1}`);
      try {
        const pageContent = await this.textExtractor.extractTextFromPage(pages[i]);
        textContent += pageContent.text + ' ';
      } catch (error) {
        console.error(`Error processing page ${i + 1}:`, error);
      }
    }

    if (textContent.length === 0) {
      throw new Error('No text content extracted from PDF');
    }

    const measurements = this.parser.parseMeasurements(textContent);
    
    if (!this.validator.validate(measurements)) {
      throw new Error('Invalid measurements extracted from PDF');
    }

    return measurements;
  }
}