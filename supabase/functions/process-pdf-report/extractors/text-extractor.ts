import { PageContent } from '../types/measurements.ts';
import { PDFPage } from 'https://cdn.skypack.dev/pdf-lib@1.17.1';

export class TextExtractor {
  async extractTextFromPage(page: PDFPage): Promise<PageContent> {
    try {
      // Get all text operations from the page
      const text = await this.extractText(page);
      console.log('Extracted text from page:', text.substring(0, 200) + '...');
      return { text };
    } catch (error) {
      console.error('Error extracting text from page:', error);
      throw new Error(`Failed to extract text from page: ${error.message}`);
    }
  }

  private async extractText(page: PDFPage): Promise<string> {
    try {
      // Get the content stream for the page
      const content = await page.doc.getForm();
      const fields = content.getFields();
      
      // Extract text from form fields
      let text = fields
        .map(field => field.getText() || '')
        .filter(text => text.length > 0)
        .join(' ');

      // If no form fields, try to get text directly
      if (!text) {
        const { width, height } = page.getSize();
        const textLines = [];
        
        // Extract text by scanning the page
        for (let y = 0; y < height; y += 12) {
          for (let x = 0; x < width; x += 12) {
            try {
              const position = { x, y };
              const extractedText = page.getTextContent(position);
              if (extractedText) {
                textLines.push(extractedText);
              }
            } catch (e) {
              // Ignore errors for individual positions
            }
          }
        }
        
        text = textLines.join(' ');
      }

      return text.replace(/\s+/g, ' ').trim();
    } catch (error) {
      console.error('Error in text extraction:', error);
      throw error;
    }
  }
}