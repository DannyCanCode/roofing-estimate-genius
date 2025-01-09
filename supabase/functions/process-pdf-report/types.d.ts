declare module 'pdfjs' {
  export function getDocument(params: { data: ArrayBuffer }): {
    promise: Promise<{
      numPages: number;
      getPage(pageNum: number): Promise<{
        getTextContent(): Promise<{
          items: Array<{ str: string }>;
        }>;
      }>;
    }>;
  };
} 