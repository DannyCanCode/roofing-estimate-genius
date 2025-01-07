import { RoofMeasurements } from '../types/measurements.ts';

export class EagleViewParser {
  parseMeasurements(text: string): RoofMeasurements {
    console.log('Parsing measurements from text');
    
    // Extract total area using regex
    const areaMatch = text.match(/Total Area:\s*([\d,]+)/i) || 
                     text.match(/Roof Area:\s*([\d,]+)/i);
    const totalArea = areaMatch ? parseFloat(areaMatch[1].replace(',', '')) : 0;

    // Extract pitch using regex
    const pitchMatch = text.match(/Pitch:\s*([\d/]+)/i) ||
                      text.match(/Slope:\s*([\d/]+)/i);
    const pitch = pitchMatch ? pitchMatch[1] : "4/12"; // Default pitch if not found

    // Extract waste percentage (default to 15% if not found)
    const wasteMatch = text.match(/Waste:\s*(\d+)%/i);
    const suggestedWaste = wasteMatch ? parseInt(wasteMatch[1]) : 15;

    console.log('Parsed measurements:', { totalArea, pitch, suggestedWaste });

    return {
      total_area: totalArea,
      predominant_pitch: pitch,
      suggested_waste_percentage: suggestedWaste
    };
  }
}