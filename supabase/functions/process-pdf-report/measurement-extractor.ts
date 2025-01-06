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
    
    // Extract total area
    const areaMatch = text.match(/Total Area \(All Pitches\)\s*=\s*([\d,]+)/i);
    const totalArea = areaMatch 
      ? parseFloat(areaMatch[1].replace(',', ''))
      : 0;
    console.log('Extracted total area:', totalArea);

    // Extract predominant pitch
    const pitchMatch = text.match(/Predominant Pitch\s*=\s*([\d.]+)/i);
    const pitch = pitchMatch
      ? parseFloat(pitchMatch[1])
      : MeasurementExtractor.DEFAULT_PITCH;
    console.log('Extracted pitch:', pitch);

    // Extract pitch breakdown
    const pitchBreakdown: { pitch: string; area: number }[] = [];
    const pitchPattern = /(\d+\/\d+)\s*pitch.*?(\d+(?:,\d+)?)\s*(?:sq\.?\s*ft\.?|sqft)/gi;
    let match;
    while ((match = pitchPattern.exec(text)) !== null) {
      pitchBreakdown.push({
        pitch: match[1],
        area: parseFloat(match[2].replace(',', '')),
      });
    }
    console.log('Extracted pitch breakdown:', pitchBreakdown);

    // Extract waste percentage
    const wasteMatch = text.match(/(?:Suggested|Recommended)\s+Waste:\s*(\d+)%/i);
    const wastePercentage = wasteMatch ? parseInt(wasteMatch[1]) : 12;
    console.log('Extracted waste percentage:', wastePercentage);

    // Extract property address
    const addressMatch = text.match(/Property\s+Address:\s*([^\n]+)/i);
    const propertyAddress = addressMatch ? addressMatch[1].trim() : undefined;
    console.log('Extracted property address:', propertyAddress);

    return {
      total_area: totalArea,
      pitch,
      roof_type: 'SHINGLE', // Default to shingle, can be updated based on user selection
      waste_percentage: wastePercentage,
      property_address: propertyAddress,
      pitch_breakdown: pitchBreakdown,
    };
  }

  private validateMeasurements(measurements: any): boolean {
    console.log('Validating measurements:', measurements);

    if (!measurements.total_area || measurements.total_area <= 0) {
      console.error('Total area must be greater than 0');
      return false;
    }

    if (!(0 < measurements.pitch && measurements.pitch <= 45)) {
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