export const textExtractionPatterns = {
  totalArea: [
    /Total Area[^=\n]*[:=]\s*([\d,\.]+)/i,
    /Total Roof Area[^=\n]*[:=]\s*([\d,\.]+)/i,
    /Total Square Footage[^=\n]*[:=]\s*([\d,\.]+)/i,
    /Total SF[^=\n]*[:=]\s*([\d,\.]+)/i
  ],
  pitch: [
    /Predominant Pitch[^=\n]*[:=]\s*(\d+)\/12/i,
    /Primary Pitch[^=\n]*[:=]\s*(\d+)\/12/i,
    /Main Pitch[^=\n]*[:=]\s*(\d+)\/12/i
  ]
};

export const cleanPdfText = (text: string): string => {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .replace(/[^\x20-\x7E\n]/g, '')
    .trim();
};