import { PDFDocument } from 'https://cdn.skypack.dev/pdf-lib';

export class TextExtractor {
  async extractText(pdfBytes: Uint8Array): Promise<string> {
    try {
      console.log('Loading PDF document');
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      console.log(`PDF loaded with ${pages.length} pages`);

      // For now, we'll return a mock text since pdf-lib doesn't support text extraction
      // This allows us to test the rest of the pipeline
      return `
        Total Area: 2500
        Predominant Pitch: 6/12
        Waste Factor: 15%
      `;
    } catch (error) {
      console.error('Error extracting text:', error);
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }
}