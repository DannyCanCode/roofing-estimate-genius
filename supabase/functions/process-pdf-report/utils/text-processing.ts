export const cleanText = (text: string): string => {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim();
};

export const logTextChunks = (text: string, chunkSize: number = 500) => {
  const chunks = text.match(new RegExp(`.{1,${chunkSize}}`, 'g')) || [];
  chunks.forEach((chunk, index) => {
    console.log(`Text chunk ${index + 1}:`, chunk);
  });
};

export const extractNumber = (text: string, pattern: RegExp): number | null => {
  const match = text.match(pattern);
  if (match && match[1]) {
    const value = parseFloat(match[1].replace(/,/g, ''));
    return !isNaN(value) ? value : null;
  }
  return null;
};