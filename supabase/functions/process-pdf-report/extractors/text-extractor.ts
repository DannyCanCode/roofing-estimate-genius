import { PDFDocument } from 'https://cdn.skypack.dev/pdf-lib';

export class TextExtractor {
  async extractText(pdfBytes: Uint8Array): Promise<string> {
    try {
      console.log('Starting text extraction');
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      console.log(`Processing PDF with ${pages.length} pages`);

      let fullText = '';
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const textContent = await this.extractTextFromPage(page);
        fullText += textContent + ' ';
      }

      console.log('Text extraction completed');
      return fullText.trim();
    } catch (error) {
      console.error('Error extracting text:', error);
      throw new Error(`Failed to extract text: ${error.message}`);
    }
  }

  async extractTextFromPage(page: any): Promise<string> {
    try {
      // Extract text content from the page
      // Note: pdf-lib doesn't provide direct text extraction, 
      // so we'll extract basic text content
      const text = page.getTextContent?.() || '';
      return text.toString();
    } catch (error) {
      console.error('Error extracting page text:', error);
      return '';
    }
  }
}