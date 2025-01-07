export const measurementPatterns = {
  total_area: [
    /Total Area[^=\n]*=\s*([\d,]+)/i,
    /Total Roof Area[^=\n]*=\s*([\d,]+)/i,
    /Total Square Footage[^=\n]*=\s*([\d,]+)/i,
    /Total SF[^=\n]*=\s*([\d,]+)/i,
    /Area[^=\n]*=\s*([\d,]+)/i
  ],
  predominant_pitch: [
    /Predominant Pitch[^=\n]*=\s*(\d+)\/12/i,
    /Primary Pitch[^=\n]*=\s*(\d+)\/12/i,
    /Main Pitch[^=\n]*=\s*(\d+)\/12/i
  ],
  suggested_waste: [
    /Suggested Waste[^=\n]*=\s*(\d+)/i,
    /Recommended Waste[^=\n]*=\s*(\d+)/i
  ],
  waste_table: /Waste Table[\s\S]*?(\d+(?:\s*\n\s*\d+)*)\s*%[\s\S]*?([\d,.]+(?:\s*\n\s*[\d,.]+)*)\s*sq\s*ft/i
};