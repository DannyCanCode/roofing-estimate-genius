import { measurementPatterns } from '../patterns.ts';

export class EagleViewParser {
  parseMeasurements(text: string) {
    const measurements: Record<string, any> = {};
    
    for (const [key, patterns] of Object.entries(measurementPatterns)) {
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          measurements[key] = this.parseValue(match[1]);
          break;
        }
      }
    }
    
    return {
      total_area: measurements.total_area || 0,
      predominant_pitch: measurements.predominant_pitch ? `${measurements.predominant_pitch}/12` : '4/12',
      suggested_waste_percentage: measurements.suggested_waste || 15,
    };
  }

  private parseValue(value: string): number | string {
    const cleanValue = value.replace(/,/g, '');
    return isNaN(Number(cleanValue)) ? value : Number(cleanValue);
  }
}