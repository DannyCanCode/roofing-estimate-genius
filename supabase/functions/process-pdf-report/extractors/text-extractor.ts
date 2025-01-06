import { PageContent } from '../types/measurements.ts';

export class TextExtractor {
  async extractTextFromPage(page: any): Promise<PageContent> {
    try {
      const operations = page.node.Operations() || [];
      let text = '';
      
      for (const op of operations) {
        if (typeof op === 'string') {
          const cleanText = op.replace(/[()]/g, '').trim();
          if (cleanText) {
            text += cleanText + ' ';
          }
        }
      }
      
      console.log('Extracted text from page:', text);
      return { text };
    } catch (error) {
      console.error('Error extracting text from page:', error);
      return { text: '' };
    }
  }
}