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
      console.log(`Page ${i + 1} content sample:`, pageContent.text.substring(0, 100));
    }
    
    console.log('Extracted raw text content length:', textContent.length);
    if (textContent.length === 0) {
      throw new Error('No text content extracted from PDF');
    }

    const measurements = await this.parseMeasurements(textContent);
    console.log('Parsed measurements:', measurements);
    
    if (!this.validateMeasurements(measurements)) {
      console.error('Invalid measurements:', measurements);
      throw new Error('Invalid measurements extracted from PDF');
    }

    return measurements;
  }

  private async extractTextFromPage(page: any): Promise<{ text: string }> {
    try {
      // Get all operations from the page
      const operations = page.node.Operations() || [];
      let text = '';
      
      // Extract text from text-showing operations
      for (const op of operations) {
        if (typeof op === 'string' && op.includes('Tj')) {
          text += op.replace(/[()]/g, '') + ' ';
        }
      }
      
      console.log('Extracted text sample:', text.substring(0, 100));
      return { text };
    } catch (error) {
      console.error('Error extracting text from page:', error);
      return { text: '' };
    }
  }

  private async parseMeasurements(text: string): Promise<any> {
    console.log('Parsing measurements from text');
    
    // Try multiple patterns for total area with more variations
    const areaPatterns = [
      /Total Area \(All Pitches\)\s*=\s*([\d,\.]+)/i,
      /Total Area:\s*([\d,\.]+)/i,
      /Total Roof Area:\s*([\d,\.]+)/i,
      /Roof Area:\s*([\d,\.]+)/i,
      /Total Square Footage:\s*([\d,\.]+)/i
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
    
    // Try multiple patterns for pitch with more variations
    const pitchPatterns = [
      /Predominant Pitch\s*=\s*([\d\.]+)/i,
      /Main Pitch:\s*([\d\.]+)/i,
      /Roof Pitch:\s*([\d\.]+)/i,
      /Primary Pitch:\s*([\d\.]+)/i,
      /Average Pitch:\s*([\d\.]+)/i
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
    const pitchPattern = /(\d+(?:\/\d+)?(?:\.\d+)?)\s*(?:pitch|slope|:).*?(\d+(?:,\d+)?(?:\.\d+)?)\s*(?:sq\.?\s*ft\.?|sqft|sf|square\s*feet)/gi;
    let match;
    while ((match = pitchPattern.exec(text)) !== null) {
      const area = parseFloat(match[2].replace(/,/g, ''));
      if (!isNaN(area) && area > 0) {
        pitchBreakdown.push({
          pitch: match[1],
          area: area,
        });
        console.log('Found pitch breakdown entry:', match[1], area);
      }
    }

    // Extract waste percentage with more patterns
    const wastePatterns = [
      /(?:Suggested|Recommended)\s+Waste:\s*(\d+)%/i,
      /Waste\s+Factor:\s*(\d+)%/i,
      /Waste\s+Percentage:\s*(\d+)%/i
    ];
    
    let wastePercentage = 12; // Default
    for (const pattern of wastePatterns) {
      const match = text.match(pattern);
      if (match) {
        wastePercentage = parseInt(match[1]);
        console.log('Found waste percentage:', wastePercentage);
        break;
      }
    }

    // Extract property address with more flexible pattern
    const addressPatterns = [
      /Property\s+Address:\s*([^\n]+)/i,
      /Address:\s*([^\n]+)/i,
      /Location:\s*([^\n]+)/i
    ];

    let propertyAddress;
    for (const pattern of addressPatterns) {
      const match = text.match(pattern);
      if (match) {
        propertyAddress = match[1].trim();
        console.log('Found property address:', propertyAddress);
        break;
      }
    }

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

    // More lenient validation with better error messages
    if (!measurements.total_area) {
      console.error('Total area is missing or zero');
      return false;
    }

    if (isNaN(measurements.total_area) || measurements.total_area <= 0) {
      console.error('Invalid total area value:', measurements.total_area);
      return false;
    }

    // Allow any reasonable positive pitch value
    if (isNaN(measurements.pitch) || measurements.pitch <= 0 || measurements.pitch > 45) {
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