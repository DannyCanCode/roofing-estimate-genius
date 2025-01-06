export const measurementPatterns = {
  total_area: [
    /Total Area \(All Pitches\)\s*=\s*([\d,]+)/i,
    /Total Roof Area\s*=\s*([\d,]+)/i,
    /Total Area\s*=\s*([\d,]+)/i,
    /Roof Area\s*=\s*([\d,]+)/i
  ],
  total_roof_facets: [
    /Total Roof Facets\s*=\s*(\d+)/i,
    /Roof Facets\s*=\s*(\d+)/i,
    /Total Facets\s*=\s*(\d+)/i
  ],
  predominant_pitch: [
    /Predominant Pitch\s*=\s*(\d+)\/12/i,
    /Primary Pitch\s*=\s*(\d+)\/12/i,
    /Main Pitch\s*=\s*(\d+)\/12/i
  ],
  number_of_stories: [
    /Number of Stories\s*<=\s*(\d+)/i,
    /Stories\s*=\s*(\d+)/i,
    /Building Height\s*=\s*(\d+)\s*stories/i
  ],
  ridges: [
    /Ridges\s*=\s*(\d+)\s*ft\s*\((\d+)\s*Ridges?\)/i,
    /Ridge Length\s*=\s*(\d+)\s*ft\s*\((\d+)\)/i
  ],
  hips: [
    /Hips\s*=\s*(\d+)\s*ft\s*\((\d+)\s*Hips?\)/i,
    /Hip Length\s*=\s*(\d+)\s*ft\s*\((\d+)\)/i
  ],
  valleys: [
    /Valleys\s*=\s*(\d+)\s*ft\s*\((\d+)\s*Valleys?\)/i,
    /Valley Length\s*=\s*(\d+)\s*ft\s*\((\d+)\)/i
  ],
  rakes: [
    /Rakes†?\s*=\s*(\d+)\s*ft\s*\((\d+)\s*Rakes?\)/i,
    /Rake Length\s*=\s*(\d+)\s*ft\s*\((\d+)\)/i
  ],
  eaves: [
    /Eaves\/Starter‡?\s*=\s*(\d+)\s*ft\s*\((\d+)\s*Eaves?\)/i,
    /Eave Length\s*=\s*(\d+)\s*ft\s*\((\d+)\)/i
  ],
  total_penetrations: [
    /Total Penetrations\s*=\s*(\d+)/i,
    /Number of Penetrations\s*=\s*(\d+)/i
  ],
  total_penetrations_area: [
    /Total Penetrations Area\s*=\s*(\d+)\s*sq\s*ft/i,
    /Penetrations Area\s*=\s*(\d+)\s*sq\s*ft/i
  ],
  waste_table: [
    /Waste %\s*\n((?:(?:\d+%)\s*\n)+)Area \(Sq ft\)\s*\n((?:[\d,]+\s*\n)+)Squares \*\s*\n((?:[\d.]+\s*\n)+)/s,
    /Waste[^\n]*\n((?:\d+%\s*)+)(?:Area|Square Feet)[^\n]*\n((?:[\d,]+\s*)+)/s
  ]
};