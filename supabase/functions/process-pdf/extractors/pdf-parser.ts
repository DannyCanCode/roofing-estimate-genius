import { PDFDocument } from 'https://cdn.skypack.dev/pdf-lib';
import { textExtractionPatterns, cleanPdfText } from '../utils/pdf-patterns.ts';

export class PdfParser {
  async extractText(pdfBytes: Uint8Array): Promise<string> {
    try {
      console.log('Loading PDF document');
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      console.log(`PDF loaded successfully with ${pages.length} pages`);
      
      let text = '';
      for (let i = 0; i < pages.length; i++) {
        const pageText = await this.extractPageText(pages[i]);
        if (pageText) {
          console.log(`Page ${i + 1} text extracted, length: ${pageText.length}`);
          console.log('Sample:', pageText.substring(0, 100));
          text += pageText + '\n';
        }
      }

      if (!text.trim()) {
        throw new Error('No text content extracted from PDF');
      }

      const cleanedText = cleanPdfText(text);
      console.log('Cleaned text length:', cleanedText.length);
      return cleanedText;
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error(`Failed to extract text: ${error.message}`);
    }
  }

  private async extractPageText(page: any): Promise<string> {
    try {
      const textContent = await page.getTextContent();
      if (!textContent?.items?.length) {
        console.log('No text content found in page');
        return '';
      }

      return textContent.items
        .map((item: any) => typeof item.str === 'string' ? item.str : '')
        .join(' ')
        .trim();
    } catch (error) {
      console.error('Page text extraction error:', error);
      return '';
    }
  }

  findMeasurement(text: string, patterns: RegExp[]): number | null {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const value = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(value) && value > 0) {
          console.log(`Found measurement: ${value} using pattern: ${pattern}`);
          return value;
        }
      }
    }
    return null;
  }
}