export const totalAreaPatterns = [
  /Total Area[^=\n]*[:=]\s*([\d,\.]+)/i,
  /Total Roof Area[^=\n]*[:=]\s*([\d,\.]+)/i,
  /Roof Area[^=\n]*[:=]\s*([\d,\.]+)/i,
  /Total Square Feet[^=\n]*[:=]\s*([\d,\.]+)/i,
  /Total Squares[^=\n]*[:=]\s*([\d,\.]+)/i,
  /Area[^=\n]*[:=]\s*([\d,\.]+)/i,
  /(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:sq\.?\s*ft\.?|square\s*feet)/i,
  /Total Area \(All Pitches\)[^=\n]*[:=]\s*([\d,\.]+)/i,
  /Total Area \(All Pitches\)\s*([\d,\.]+)/i,
  /Total SF[^=\n]*[:=]\s*([\d,\.]+)/i,
  /Total Square Footage[^=\n]*[:=]\s*([\d,\.]+)/i,
  /Total Area\s*=?\s*([\d,\.]+)/i,
  /Total Roof SF[^=\n]*[:=]\s*([\d,\.]+)/i,
  /Total Roof Square Footage[^=\n]*[:=]\s*([\d,\.]+)/i,
  /Total Roof Area \(SF\)[^=\n]*[:=]\s*([\d,\.]+)/i
];

export const generalAreaPattern = /(\d{2,}(?:,\d{3})*(?:\.\d+)?)\s*(?:sq\.?\s*ft\.?|square\s*feet|SF)/i;

export const pitchPatterns = [
  /Predominant Pitch[^=\n]*[:=]\s*(\d+)\/12/i,
  /Primary Pitch[^=\n]*[:=]\s*(\d+)\/12/i,
  /Pitch[^=\n]*[:=]\s*(\d+)\/12/i,
  /(\d+)\/12\s*pitch/i,
  /Main Pitch[^=\n]*[:=]\s*(\d+)\/12/i
];