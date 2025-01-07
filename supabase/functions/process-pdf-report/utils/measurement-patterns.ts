export const totalAreaPatterns = [
  /Total Area[^=\n]*[:=]\s*([\d,\.]+)/i,
  /Total Roof Area[^=\n]*[:=]\s*([\d,\.]+)/i,
  /Total Square Footage[^=\n]*[:=]\s*([\d,\.]+)/i,
  /Total SF[^=\n]*[:=]\s*([\d,\.]+)/i,
  /Area[^=\n]*[:=]\s*([\d,\.]+)/i,
  /Total:\s*([\d,\.]+)\s*(?:sq\.?\s*ft\.?|square\s*feet|SF)/i,
  /TOTAL\s*([\d,\.]+)\s*(?:sq\.?\s*ft\.?|square\s*feet|SF)/i,
  /Grand Total:\s*([\d,\.]+)\s*(?:sq\.?\s*ft\.?|square\s*feet|SF)/i,
  /Total All Pitches[^=\n]*[:=]\s*([\d,\.]+)/i,
  /Total Area \(All Pitches\)[^=\n]*[:=]\s*([\d,\.]+)/i
];

export const generalAreaPattern = /(\d{2,}(?:,\d{3})*(?:\.\d+)?)\s*(?:sq\.?\s*ft\.?|square\s*feet|SF)/i;

export const pitchPatterns = [
  /Predominant Pitch[^=\n]*[:=]\s*(\d+)\/12/i,
  /Primary Pitch[^=\n]*[:=]\s*(\d+)\/12/i,
  /Main Pitch[^=\n]*[:=]\s*(\d+)\/12/i,
  /Pitch:\s*(\d+)\/12/i,
  /(\d+)\/12\s*pitch/i,
  /Slope[^=\n]*[:=]\s*(\d+)\/12/i,
  /Roof Slope[^=\n]*[:=]\s*(\d+)\/12/i
];