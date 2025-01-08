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
  waste_table: [
    /Waste Table[\s\S]*?(\d+(?:\s*\n\s*\d+)*)\s*%[\s\S]*?([\d,.]+(?:\s*\n\s*[\d,.]+)*)\s*sq\s*ft/i
  ],
  ridges: [
    /Ridge Length[^=\n]*=\s*([\d,]+)\s*ft/i,
    /Ridge Count[^=\n]*=\s*(\d+)/i
  ],
  hips: [
    /Hip Length[^=\n]*=\s*([\d,]+)\s*ft/i,
    /Hip Count[^=\n]*=\s*(\d+)/i
  ],
  valleys: [
    /Valley Length[^=\n]*=\s*([\d,]+)\s*ft/i,
    /Valley Count[^=\n]*=\s*(\d+)/i
  ],
  rakes: [
    /Rake Length[^=\n]*=\s*([\d,]+)\s*ft/i,
    /Rake Count[^=\n]*=\s*(\d+)/i
  ],
  eaves: [
    /Eave Length[^=\n]*=\s*([\d,]+)\s*ft/i,
    /Eave Count[^=\n]*=\s*(\d+)/i
  ],
  number_of_stories: [
    /Number of Stories[^=\n]*=\s*(\d+)/i,
    /Stories[^=\n]*=\s*(\d+)/i
  ]
};