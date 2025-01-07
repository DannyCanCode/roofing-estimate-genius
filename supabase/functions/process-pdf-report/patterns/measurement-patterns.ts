export const measurementPatterns = {
  totalArea: /Total Area[^=\n]*=\s*([\d,]+)/i,
  totalSquares: /Total Squares[^=\n]*=\s*([\d.]+)/i,
  predominantPitch: /Predominant Pitch[^=\n]*=\s*(\d+)\/12/i,
  ridgesLength: /Ridge Length[^=\n]*=\s*([\d,]+)\s*ft/i,
  ridgesCount: /Ridge Count[^=\n]*=\s*(\d+)/i,
  hipsLength: /Hip Length[^=\n]*=\s*([\d,]+)\s*ft/i,
  hipsCount: /Hip Count[^=\n]*=\s*(\d+)/i,
  valleysLength: /Valley Length[^=\n]*=\s*([\d,]+)\s*ft/i,
  valleysCount: /Valley Count[^=\n]*=\s*(\d+)/i,
  rakesLength: /Rake Length[^=\n]*=\s*([\d,]+)\s*ft/i,
  rakesCount: /Rake Count[^=\n]*=\s*(\d+)/i,
  eavesLength: /Eave Length[^=\n]*=\s*([\d,]+)\s*ft/i,
  eavesCount: /Eave Count[^=\n]*=\s*(\d+)/i,
  numberOfStories: /Number of Stories[^=\n]*=\s*(\d+)/i,
  suggestedWaste: /Suggested Waste[^=\n]*=\s*(\d+)/i,
  areasPerPitch: /Areas per Pitch:(.*?)(?=\n\n|\Z)/si
};