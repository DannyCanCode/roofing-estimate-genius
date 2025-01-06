import { RoofMeasurements } from '../types/measurements.ts';

export class EagleViewParser {
  private static readonly DEFAULT_WASTE_PERCENTAGE = 15;

  parseMeasurements(text: string): RoofMeasurements {
    console.log('Parsing measurements from text');
    
    const measurements: RoofMeasurements = {
      total_area: this.extractTotalArea(text),
      pitch: this.extractPitch(text),
      roof_type: 'SHINGLE', // Default type
      waste_percentage: this.extractWastePercentage(text),
      property_address: this.extractAddress(text),
      pitch_breakdown: this.extractPitchBreakdown(text),
      ridges_length: this.extractLength(text, 'Ridges'),
      valleys_length: this.extractLength(text, 'Valleys'),
      rakes_length: this.extractLength(text, 'Rakes'),
      eaves_length: this.extractLength(text, 'Eaves'),
      number_of_stories: this.extractStories(text),
      total_facets: this.extractFacets(text),
      total_penetrations: this.extractPenetrations(text),
      penetrations_perimeter: this.extractPenetrationsPerimeter(text),
      penetrations_area: this.extractPenetrationsArea(text)
    };

    console.log('Parsed measurements:', measurements);
    return measurements;
  }

  private extractTotalArea(text: string): number {
    const areaMatch = text.match(/Total\s*(?:Roof)?\s*Area\s*[=:]?\s*([\d,\.]+)/i);
    return areaMatch ? parseFloat(areaMatch[1].replace(/,/g, '')) : 0;
  }

  private extractPitch(text: string): number {
    const pitchMatch = text.match(/Predominant\s*Pitch\s*[=:]?\s*(\d+)\/(\d+)/i);
    if (pitchMatch) {
      return parseInt(pitchMatch[1]) / parseInt(pitchMatch[2]);
    }
    return 4/12; // Default pitch
  }

  private extractWastePercentage(text: string): number {
    const wasteMatch = text.match(/(?:Suggested|Recommended)\s*Waste\s*[=:]?\s*(\d+)%/i);
    return wasteMatch ? parseInt(wasteMatch[1]) : this.DEFAULT_WASTE_PERCENTAGE;
  }

  private extractAddress(text: string): string {
    const addressMatch = text.match(/(?:Property\s*Address|Location)\s*[=:]?\s*([^\n]+)/i);
    return addressMatch ? addressMatch[1].trim() : '';
  }

  private extractPitchBreakdown(text: string): { pitch: string; area: number }[] {
    const breakdown: { pitch: string; area: number }[] = [];
    const pitchPattern = /(\d+\/\d+)\s*(?:pitch|slope).*?(\d+(?:,\d+)?(?:\.\d+)?)\s*(?:sq\.?\s*ft\.?|sqft|sf)/gi;
    let match;
    
    while ((match = pitchPattern.exec(text)) !== null) {
      const area = parseFloat(match[2].replace(/,/g, ''));
      if (!isNaN(area) && area > 0) {
        breakdown.push({ pitch: match[1], area });
      }
    }
    
    return breakdown;
  }

  private extractLength(text: string, type: string): number {
    const lengthMatch = text.match(new RegExp(`${type}\\s*[=:]\\s*(\\d+(?:\\.\\d+)?)`));
    return lengthMatch ? parseFloat(lengthMatch[1]) : 0;
  }

  private extractStories(text: string): number {
    const storiesMatch = text.match(/Number\s*of\s*Stories\s*[=<:]?\s*(\d+)/i);
    return storiesMatch ? parseInt(storiesMatch[1]) : 1;
  }

  private extractFacets(text: string): number {
    const facetsMatch = text.match(/Total\s*(?:Roof)?\s*Facets\s*[=:]?\s*(\d+)/i);
    return facetsMatch ? parseInt(facetsMatch[1]) : 0;
  }

  private extractPenetrations(text: string): number {
    const penetrationsMatch = text.match(/Total\s*Penetrations\s*[=:]?\s*(\d+)/i);
    return penetrationsMatch ? parseInt(penetrationsMatch[1]) : 0;
  }

  private extractPenetrationsPerimeter(text: string): number {
    const perimeterMatch = text.match(/Total\s*Penetrations\s*Perimeter\s*[=:]?\s*(\d+)/i);
    return perimeterMatch ? parseInt(perimeterMatch[1]) : 0;
  }

  private extractPenetrationsArea(text: string): number {
    const areaMatch = text.match(/Total\s*Penetrations\s*Area\s*[=:]?\s*(\d+)/i);
    return areaMatch ? parseInt(areaMatch[1]) : 0;
  }
}