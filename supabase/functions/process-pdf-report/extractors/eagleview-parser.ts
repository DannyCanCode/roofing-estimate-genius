import { RoofMeasurements } from '../types/measurements.ts';

export class EagleViewParser {
  parseMeasurements(text: string): RoofMeasurements {
    console.log('Parsing measurements from text');
    
    // Extract total area
    const areaMatch = text.match(/Total Area:\s*([\d,]+)/i);
    const totalArea = areaMatch ? parseFloat(areaMatch[1].replace(',', '')) : 2500; // Default value

    // Extract pitch
    const pitchMatch = text.match(/Predominant Pitch:\s*([\d/]+)/i);
    const pitch = pitchMatch ? pitchMatch[1] : "4/12"; // Default pitch

    // Extract waste percentage
    const wasteMatch = text.match(/Waste Factor:\s*(\d+)%/i);
    const suggestedWaste = wasteMatch ? parseInt(wasteMatch[1]) : 15; // Default waste

    const measurements = {
      total_area: totalArea,
      predominant_pitch: pitch,
      suggested_waste_percentage: suggestedWaste
    };

    console.log('Parsed measurements:', measurements);
    return measurements;
  }
}