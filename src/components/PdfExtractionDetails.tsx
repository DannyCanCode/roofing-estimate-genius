import { Check, Square } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ExtractionField {
  name: string;
  value: string | number;
  isExtracted: boolean;
}

interface PdfExtractionDetailsProps {
  data: Record<string, any>;
}

export function PdfExtractionDetails({ data }: PdfExtractionDetailsProps) {
  const extractionFields: ExtractionField[] = [
    { name: "Total Roof Area", value: data.totalArea || 0, isExtracted: !!data.totalArea },
    { name: "Total Roof Squares", value: data.totalSquares || 0, isExtracted: !!data.totalSquares },
    { name: "Predominant Pitch", value: data.pitch || "", isExtracted: !!data.pitch },
    { name: "Ridges Length", value: data.ridgesLength || 0, isExtracted: !!data.ridgesLength },
    { name: "Ridges Count", value: data.ridgesCount || 0, isExtracted: !!data.ridgesCount },
    { name: "Hips Length", value: data.hipsLength || 0, isExtracted: !!data.hipsLength },
    { name: "Hips Count", value: data.hipsCount || 0, isExtracted: !!data.hipsCount },
    { name: "Valleys Length", value: data.valleysLength || 0, isExtracted: !!data.valleysLength },
    { name: "Valleys Count", value: data.valleysCount || 0, isExtracted: !!data.valleysCount },
    { name: "Rakes Length", value: data.rakesLength || 0, isExtracted: !!data.rakesLength },
    { name: "Rakes Count", value: data.rakesCount || 0, isExtracted: !!data.rakesCount },
    { name: "Eaves Length", value: data.eavesLength || 0, isExtracted: !!data.eavesLength },
    { name: "Eaves Count", value: data.eavesCount || 0, isExtracted: !!data.eavesCount },
    { name: "Drip Edge Length", value: data.dripEdgeLength || 0, isExtracted: !!data.dripEdgeLength },
    { name: "Flashing Length", value: data.flashingLength || 0, isExtracted: !!data.flashingLength },
    { name: "Flashing Count", value: data.flashingCount || 0, isExtracted: !!data.flashingCount },
    { name: "Step Flashing Length", value: data.stepFlashingLength || 0, isExtracted: !!data.stepFlashingLength },
    { name: "Step Flashing Count", value: data.stepFlashingCount || 0, isExtracted: !!data.stepFlashingCount },
    { name: "Total Penetrations Area", value: data.totalPenetrationsArea || 0, isExtracted: !!data.totalPenetrationsArea },
    { name: "Suggested Waste Factor", value: data.suggestedWaste || 0, isExtracted: !!data.suggestedWaste },
    { name: "Waste Factor Area", value: data.wasteFactorArea || 0, isExtracted: !!data.wasteFactorArea },
    { name: "Waste Factor Squares", value: data.wasteFactorSquares || 0, isExtracted: !!data.wasteFactorSquares },
    { name: "Roofing Type", value: data.roofingType || "", isExtracted: !!data.roofingType },
    { name: "Structure Complexity", value: data.structureComplexity || "", isExtracted: !!data.structureComplexity },
    { name: "Waste Note", value: data.wasteNote || "", isExtracted: !!data.wasteNote }
  ];

  return (
    <Card className="w-full mt-4">
      <CardHeader>
        <CardTitle>PDF Extraction Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {extractionFields.map((field, index) => (
            <div key={index} className="flex items-center space-x-2">
              {field.isExtracted ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Square className="h-4 w-4 text-gray-300" />
              )}
              <span className="font-medium">{field.name}:</span>
              <span className="text-gray-600">
                {field.value.toString()}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}