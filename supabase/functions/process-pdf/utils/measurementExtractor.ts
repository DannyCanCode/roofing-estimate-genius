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
  const areasMatch = text.match(/Areas per Pitch.*?(\d+\/12.*?(?=\n\n|\Z))/s);
  
  if (areasMatch && areasMatch[1]) {
    const pitchSection = areasMatch[1];
    const pitchPattern = /(\d+)\/12\s*=?\s*([\d,]+)(?:\s*sq\s*ft)?\s*\(?(\d+\.?\d*)%\)?/g;
    let match;
    
    while ((match = pitchPattern.exec(pitchSection)) !== null) {
      const pitch = `${match[1]}/12`;
      const area = parseFloat(match[2].replace(/,/g, ''));
      if (!isNaN(area) && area > 0) {
        breakdown.push({ pitch, area });
      }
    }
  }
  
  return breakdown;
};