import { PDFDocument } from 'https://cdn.skypack.dev/pdf-lib';

export class MeasurementExtractor {
  private static readonly VALID_ROOF_TYPES = ['SHINGLE', 'METAL', 'TILE'];
  private static readonly DEFAULT_PITCH = 4.0;

  async extractMeasurements(pdfBytes: ArrayBuffer): Promise<any> {
    console.log('Starting measurement extraction');
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    console.log(`Processing PDF with ${pages.length} pages`);

    // Extract text content from PDF
    let textContent = '';
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      console.log(`Processing page ${i + 1}`);
      
      // Get text content from page operations
      const pageContent = await this.extractTextFromPage(page);
      textContent += pageContent.text + ' ';
      console.log(`Extracted text from page ${i + 1}:`, pageContent.text.substring(0, 100) + '...');
    }
    
    console.log('Extracted raw text content length:', textContent.length);
    if (textContent.length === 0) {
      throw new Error('No text content extracted from PDF');
    }

    const measurements = await this.parseMeasurements(textContent);
    console.log('Parsed measurements:', measurements);
    
    if (!this.validateMeasurements(measurements)) {
      throw new Error('Invalid measurements extracted from PDF');
    }

    return measurements;
  }

  private async extractTextFromPage(page: any): Promise<{ text: string }> {
    try {
      // Get all operations from the page
      const operations = page.getOperations();
      let text = '';
      
      // Extract text from text-showing operations
      for (const op of operations) {
        if (op.operator === 'Tj' || op.operator === 'TJ') {
          const content = Array.isArray(op.args[0]) 
            ? op.args[0].join('') 
            : op.args[0].toString();
          text += content + ' ';
        }
      }
      
      return { text };
    } catch (error) {
      console.error('Error extracting text from page:', error);
      return { text: '' };
    }
  }

  private async parseMeasurements(text: string): Promise<any> {
    console.log('Parsing measurements from text');
    
    // Try multiple patterns for total area
    const areaPatterns = [
      /Total Area \(All Pitches\)\s*=\s*([\d,]+)/i,
      /Total Area:\s*([\d,]+)/i,
      /Total Roof Area:\s*([\d,]+)/i
    ];

    let totalArea = 0;
    for (const pattern of areaPatterns) {
      const match = text.match(pattern);
      if (match) {
        totalArea = parseFloat(match[1].replace(/,/g, ''));
        console.log('Found total area:', totalArea, 'using pattern:', pattern);
        break;
      }
    }
    
    // Try multiple patterns for pitch
    const pitchPatterns = [
      /Predominant Pitch\s*=\s*([\d.]+)/i,
      /Main Pitch:\s*([\d.]+)/i,
      /Roof Pitch:\s*([\d.]+)/i
    ];

    let pitch = MeasurementExtractor.DEFAULT_PITCH;
    for (const pattern of pitchPatterns) {
      const match = text.match(pattern);
      if (match) {
        pitch = parseFloat(match[1]);
        console.log('Found pitch:', pitch, 'using pattern:', pattern);
        break;
      }
    }

    // Extract pitch breakdown with more flexible pattern
    const pitchBreakdown: { pitch: string; area: number }[] = [];
    const pitchPattern = /(\d+\/\d+|[\d.]+)\s*(?:pitch|slope).*?(\d+(?:,\d+)?)\s*(?:sq\.?\s*ft\.?|sqft|sf)/gi;
    let match;
    while ((match = pitchPattern.exec(text)) !== null) {
      const area = parseFloat(match[2].replace(/,/g, ''));
      pitchBreakdown.push({
        pitch: match[1],
        area: area,
      });
      console.log('Found pitch breakdown entry:', match[1], area);
    }

    // Extract waste percentage with fallback
    const wasteMatch = text.match(/(?:Suggested|Recommended)\s+Waste:\s*(\d+)%/i);
    const wastePercentage = wasteMatch ? parseInt(wasteMatch[1]) : 12;
    console.log('Waste percentage:', wastePercentage);

    // Extract property address
    const addressMatch = text.match(/Property\s+Address:\s*([^\n]+)/i);
    const propertyAddress = addressMatch ? addressMatch[1].trim() : undefined;
    console.log('Property address:', propertyAddress);

    const measurements = {
      total_area: totalArea,
      pitch,
      roof_type: 'SHINGLE', // Default to shingle, can be updated based on user selection
      waste_percentage: wastePercentage,
      property_address: propertyAddress,
      pitch_breakdown: pitchBreakdown,
    };

    console.log('Final parsed measurements:', measurements);
    return measurements;
  }

  private validateMeasurements(measurements: any): boolean {
    console.log('Validating measurements:', measurements);

    // More lenient validation
    if (!measurements.total_area) {
      console.error('Total area is missing');
      return false;
    }

    if (measurements.total_area <= 0) {
      console.error('Total area must be greater than 0');
      return false;
    }

    // Allow any positive pitch value
    if (measurements.pitch <= 0) {
      console.error('Invalid pitch value:', measurements.pitch);
      return false;
    }

    if (!MeasurementExtractor.VALID_ROOF_TYPES.includes(measurements.roof_type)) {
      console.error('Invalid roof type:', measurements.roof_type);
      return false;
    }

    console.log('Measurements validation passed');
    return true;
  }
}