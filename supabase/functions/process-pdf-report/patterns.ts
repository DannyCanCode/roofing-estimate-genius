export const measurementPatterns = {
  total_area: [
    /Total Area[^=\n]*=\s*([\d,]+)/i,
    /Total Roof Area[^=\n]*=\s*([\d,]+)/i,
  ],
  predominant_pitch: [
    /Predominant Pitch[^=\n]*=\s*(\d+)\/12/i,
    /Primary Pitch[^=\n]*=\s*(\d+)\/12/i,
  ],
  suggested_waste: [
    /Suggested Waste[^=\n]*=\s*(\d+)/i,
    /Recommended Waste[^=\n]*=\s*(\d+)/i,
  ],
};