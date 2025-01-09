export const extractTextContent = (fileContent: string): string => {
  // Clean up the text content
  return fileContent
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim();
};

export const logTextContent = (text: string) => {
  console.log('Content length:', text.length);
  console.log('First 1000 chars:', text.substring(0, 1000));
  
  // Log text in chunks for better debugging
  const chunks = text.match(/.{1,1000}/g) || [];
  chunks.forEach((chunk, index) => {
    console.log(`Content chunk ${index + 1}:`, chunk);
  });
};