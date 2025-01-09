import { measurementPatterns } from "./patterns.ts";
import type { Measurements, DebugInfo, ExtractionResult, WasteTableEntry } from "./types.ts";

const REQUIRED_MEASUREMENTS = ['total_area', 'predominant_pitch'];
const MIN_TOTAL_AREA = 100; // Minimum reasonable roof area in sq ft
const MAX_TOTAL_AREA = 100000; // Maximum reasonable roof area in sq ft

export function extractMeasurements(text: string): ExtractionResult {
  const measurements: Measurements = {};
  const debugInfo: DebugInfo = {
    matched_patterns: {},
    text_samples: {},
    validation_errors: {}
  };

  // Clean up text content
  text = text
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim();

  console.log('Processing text content, length:', text.length);

  const tryPatterns = (patterns: RegExp[], text: string) => {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        console.log('Pattern matched:', pattern.toString());
        return match;
      }
    }
    return null;
  };

  // Extract measurements using patterns
  for (const [key, patternList] of Object.entries(measurementPatterns)) {
    debugInfo.text_samples[key] = text.substring(0, 1000);
    const match = tryPatterns(patternList, text);
    debugInfo.matched_patterns[key] = !!match;

    if (match) {
      try {
        if (key === 'waste_table') {
          const percentages = match[1].trim().split('\n').map(p => {
            const value = parseInt(p, 10);
            if (isNaN(value) || value < 0 || value > 100) {
              throw new Error(`Invalid waste percentage: ${p}`);
            }
            return value;
          });
          
          const areas = match[2].trim().split('\n').map(a => {
            const value = parseFloat(a.replace(/,/g, ''));
            if (isNaN(value) || value <= 0) {
              throw new Error(`Invalid waste area: ${a}`);
            }
            return value;
          });
          
          if (percentages.length !== areas.length) {
            throw new Error('Mismatch between waste percentages and areas');
          }
          
          const wasteEntries: WasteTableEntry[] = percentages.map((percentage, i) => ({
            percentage,
            area: areas[i],
            is_suggested: i === Math.floor(percentages.length / 2)
          }));
          
          measurements[key] = wasteEntries;
          measurements.suggested_waste_percentage = percentages[Math.floor(percentages.length / 2)];
        } else if (['ridges', 'hips', 'valleys', 'rakes', 'eaves'].includes(key)) {
          const lengthMatch = tryPatterns([patternList[0]], text);
          const countMatch = tryPatterns([patternList[1]], text);
          
          const length = lengthMatch ? parseFloat(lengthMatch[1].replace(/,/g, '')) : 0;
          const count = countMatch ? parseInt(countMatch[1], 10) : 0;
          
          if (length < 0 || (length > 0 && count <= 0)) {
            throw new Error(`Invalid ${key} measurements: length=${length}, count=${count}`);
          }
          
          measurements[key] = { length, count };
        } else {
          const value = match[1].replace(/,/g, '');
          const numericValue = value.includes('.') ? parseFloat(value) : parseInt(value, 10);
          
          if (key === 'total_area') {
            if (typeof numericValue !== 'number' || isNaN(numericValue) || numericValue < MIN_TOTAL_AREA || numericValue > MAX_TOTAL_AREA) {
              throw new Error(`Invalid total area: ${numericValue}`);
            }
          } else if (key === 'number_of_stories') {
            if (typeof numericValue !== 'number' || isNaN(numericValue) || numericValue < 1 || numericValue > 5) {
              throw new Error(`Invalid number of stories: ${numericValue}`);
            }
          }
          
          measurements[key] = numericValue;
        }
      } catch (error) {
        console.error(`Error processing ${key}:`, error);
        debugInfo.validation_errors[key] = error.message;
      }
    } else if (REQUIRED_MEASUREMENTS.includes(key)) {
      debugInfo.validation_errors[key] = `Required measurement '${key}' not found`;
    }
  }

  // Validate total area against sum of waste areas if available
  if (measurements.total_area && measurements.waste_table) {
    const totalWasteArea = measurements.waste_table.reduce((sum: number, entry: WasteTableEntry) => sum + entry.area, 0);
    if (Math.abs(totalWasteArea - measurements.total_area) > 1) {
      debugInfo.validation_errors.waste_table = `Total waste area (${totalWasteArea}) does not match total area (${measurements.total_area})`;
    }
  }

  console.log('Extracted measurements:', measurements);
  console.log('Debug info:', debugInfo);

  return { measurements, debugInfo };
}