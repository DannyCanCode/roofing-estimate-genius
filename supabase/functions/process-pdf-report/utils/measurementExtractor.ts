const REGEX_PATTERNS = {
  // Total area patterns with variations
  totalArea: /Total Area \(All Pitches\)\s*=\s*([\d,]+)/i,
  alternativeTotalArea: /Total\s*(?:Roof)?\s*Area\s*[:=]?\s*([\d,]+)/i,
  fallbackTotalArea: /(?:Total|Roof)\s*(?:Area|Surface)\s*[:=]?\s*([\d,]+)/i,
  areaInTable: /Area\s*\(Sq\s*ft\)\s*\n\s*([\d,]+)/i,
  simpleArea: /(\d{2,}(?:,\d{3})*(?:\.\d+)?)\s*(?:sq\.?\s*ft\.?|sqft|sf)/i,
  
  // Pitch patterns
  predominantPitch: /Predominant Pitch\s*=\s*(\d+)\/12/i,
  alternativePitch: /(?:Predominant|Main|Primary)\s*Pitch\s*[:=]?\s*(\d+)\/\d+/i,
  
  // Length measurements
  ridges: /Ridges\s*=\s*(\d+)\s*ft\s*\((\d+)\s*Ridges?\)/i,
  hips: /Hips\s*=\s*(\d+)\s*ft\s*\((\d+)\s*Hips?\)/i,
  valleys: /Valleys\s*=\s*(\d+)\s*ft\s*\((\d+)\s*Valleys?\)/i,
  rakes: /Rakes\s*=\s*(\d+)\s*ft\s*\((\d+)\s*Rakes?\)/i,
  eaves: /Eaves\s*=\s*(\d+)\s*ft\s*\((\d+)\s*Eaves?\)/i,
  
  // Waste table pattern
  wasteTable: /Waste %\s*\n((?:(?:\d+%)\s*\n)+)Area \(Sq ft\)\s*\n((?:[\d,]+\s*\n)+)Squares \*\s*\n((?:[\d.]+\s*\n)+)/,
  
  // Areas per pitch patterns
  areasPerPitch: /Areas per Pitch.*?(\d+\/12.*?(?=\n\n|\Z))/s,
  pitchDetails: /(\d+)\/12\s*=?\s*([\d,]+)(?:\s*sq\s*ft)?\s*\(?(\d+\.?\d*)%\)?/g
};

export const extractNumber = (text: string, pattern: RegExp): number => {
  console.log('Extracting number with pattern:', pattern);
  const match = text.match(pattern);
  if (match && match[1]) {
    const value = parseFloat(match[1].replace(/,/g, ''));
    console.log('Extracted value:', value);
    return value;
  }
  console.log('No match found for pattern');
  return 0;
};

export const extractTotalArea = (text: string): number => {
  console.log('Attempting to extract total area...');
  
  // Try all patterns in sequence
  const patterns = [
    REGEX_PATTERNS.totalArea,
    REGEX_PATTERNS.alternativeTotalArea,
    REGEX_PATTERNS.fallbackTotalArea,
    REGEX_PATTERNS.areaInTable,
    REGEX_PATTERNS.simpleArea
  ];

  for (const pattern of patterns) {
    const area = extractNumber(text, pattern);
    if (area > 0) {
      console.log('Successfully found total area:', area);
      return area;
    }
  }

  console.error('Failed to extract total area with any pattern');
  throw new Error('Could not find total roof area in PDF. Please make sure you are uploading a valid EagleView report. If this is an EagleView report, try selecting and copying all text from the PDF first to ensure it\'s not scanned or image-based.');
};

export const extractMeasurement = (text: string, pattern: RegExp): { length: number; count: number } => {
  const match = text.match(pattern);
  if (match && match[1] && match[2]) {
    return {
      length: parseFloat(match[1]),
      count: parseInt(match[2])
    };
  }
  return { length: 0, count: 0 };
};

export const extractPitchBreakdown = (text: string): { pitch: string; area: number }[] => {
  const breakdown: { pitch: string; area: number }[] = [];
  const areasMatch = text.match(REGEX_PATTERNS.areasPerPitch);
  
  if (areasMatch && areasMatch[1]) {
    const pitchSection = areasMatch[1];
    let match;
    
    while ((match = REGEX_PATTERNS.pitchDetails.exec(pitchSection)) !== null) {
      const pitch = `${match[1]}/12`;
      const area = parseFloat(match[2].replace(/,/g, ''));
      if (!isNaN(area) && area > 0) {
        breakdown.push({ pitch, area });
      }
    }
  }
  
  return breakdown;
};