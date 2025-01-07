export const cleanText = (text: string): string => {
  if (!text) {
    console.warn('Empty text received for cleaning');
    return '';
  }
  
  const cleaned = text
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .replace(/[^\x20-\x7E\n]/g, '') // Remove non-printable characters
    .trim();
    
  console.log('Cleaned text length:', cleaned.length);
  return cleaned;
};

export const logTextChunks = (text: string, chunkSize: number = 500) => {
  if (!text) {
    console.warn('Empty text received for chunk logging');
    return;
  }
  
  console.log('Total text length:', text.length);
  const chunks = text.match(new RegExp(`.{1,${chunkSize}}`, 'g')) || [];
  chunks.forEach((chunk, index) => {
    console.log(`Text chunk ${index + 1}:`, chunk);
  });
};

export const extractNumber = (text: string, pattern: RegExp): number | null => {
  if (!text || !pattern) {
    console.warn('Invalid input for number extraction:', { hasText: !!text, hasPattern: !!pattern });
    return null;
  }

  const match = text.match(pattern);
  if (match && match[1]) {
    const cleanedValue = match[1].replace(/,/g, '').trim();
    const value = parseFloat(cleanedValue);
    if (!isNaN(value) && value > 0) {
      console.log(`Found number ${value} using pattern ${pattern}`);
      return value;
    } else {
      console.log(`Invalid or zero value found: ${cleanedValue}`);
    }
  } else {
    console.log(`No match found for pattern: ${pattern}`);
  }
  return null;
};