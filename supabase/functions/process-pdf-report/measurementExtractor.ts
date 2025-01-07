import { measurementPatterns } from "./patterns.ts";
import type { Measurements, DebugInfo, ExtractionResult } from "./types.ts";

export function extractMeasurements(text: string): ExtractionResult {
  const measurements: Measurements = {};
  const debugInfo: DebugInfo = {
    matched_patterns: {},
    text_samples: {}
  };

  const tryPatterns = (patterns: RegExp[], text: string) => {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match;
    }
    return null;
  };

  // Clean up text content
  text = text
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim();

  console.log('Processing text content, length:', text.length);
  console.log('Sample text:', text.substring(0, 500));

  for (const [key, patternList] of Object.entries(measurementPatterns)) {
    debugInfo.text_samples[key] = text.substring(0, 1000);
    const match = tryPatterns(patternList, text);
    debugInfo.matched_patterns[key] = !!match;

    if (match) {
      if (key === 'waste_table') {
        try {
          const percentages = match[1].trim().split('\n').map(p => parseInt(p));
          const areas = match[2].trim().split('\n').map(a => parseFloat(a.replace(',', '')));
          const squares = match[3]?.trim().split('\n').map(s => parseFloat(s)) || [];
          
          const wasteEntries = percentages.map((percentage, i) => ({
            percentage,
            area: areas[i],
            squares: squares[i] || areas[i] / 100,
            is_suggested: i === Math.floor(percentages.length / 2)
          }));
          
          measurements[key] = wasteEntries;
          measurements.suggested_waste_percentage = percentages[Math.floor(percentages.length / 2)];
        } catch (e) {
          debugInfo.waste_table_error = e.message;
        }
      } else if (['ridges', 'hips', 'valleys', 'rakes', 'eaves'].includes(key)) {
        measurements[key] = {
          length: parseFloat(match[1]),
          count: parseInt(match[2])
        };
      } else {
        const value = match[1].replace(',', '');
        measurements[key] = value.includes('.') || !isNaN(value) ? parseFloat(value) : value;
      }
    }
  }

  return { measurements, debugInfo };
}