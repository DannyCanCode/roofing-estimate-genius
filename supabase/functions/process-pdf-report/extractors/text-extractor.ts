import { getDocument, PDFDocumentProxy, PDFPageProxy } from 'https://cdn.skypack.dev/pdfjs-dist@2.12.313/build/pdf.js';

export class TextExtractor {
  async extractText(pdfData: Uint8Array): Promise<string> {
    try {
      const pdf = await getDocument({ data: pdfData }).promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + ' ';
      }
      
      return fullText;
    } catch (error) {
      console.error('Error extracting text:', error);
      throw new Error(`Failed to extract text: ${error.message}`);
    }
  }
}