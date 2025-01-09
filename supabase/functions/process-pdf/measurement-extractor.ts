import { PDFDocument } from 'https://cdn.skypack.dev/pdf-lib@1.17.1';
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
    
    try {
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      console.log(`Processing PDF with ${pages.length} pages`);

      let allText = '';
      for (let i = 0; i < pages.length; i++) {
        console.log(`Processing page ${i + 1} of ${pages.length}`);
        try {
          const pageContent = await this.textExtractor.extractTextFromPage(pages[i]);
          allText += pageContent.text + ' ';
          console.log(`Page ${i + 1} text length: ${pageContent.text.length}`);
        } catch (error) {
          console.error(`Error processing page ${i + 1}:`, error);
          throw new Error(`Failed to process page ${i + 1}: ${error.message}`);
        }
      }

      if (!allText.trim()) {
        console.error('No text content extracted from PDF');
        throw new Error('No text content could be extracted from the PDF');
      }

      console.log('Total extracted text length:', allText.length);
      console.log('Sample of extracted text:', allText.substring(0, 500));

      const measurements = this.parser.parseMeasurements(allText);
      console.log('Parsed measurements:', measurements);

      if (!measurements.total_area) {
        console.error('No total area found in measurements');
        throw new Error('Could not extract roof area from PDF. Please ensure this is an EagleView report.');
      }

      if (!this.validator.validate(measurements)) {
        console.error('Measurements validation failed');
        throw new Error('Invalid measurements extracted from PDF');
      }

      return measurements;
    } catch (error) {
      console.error('Error in measurement extraction:', error);
      throw error;
    }
  }
}