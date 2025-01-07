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
  console.log("PDF Extraction Data:", data); // Debug log

  const measurements = data?.measurements || {};
  
  const extractionFields: ExtractionField[] = [
    { name: "Total Roof Area", value: measurements.total_area || 0, isExtracted: !!measurements.total_area },
    { name: "Predominant Pitch", value: measurements.predominant_pitch || "", isExtracted: !!measurements.predominant_pitch },
    { name: "Number of Stories", value: measurements.number_of_stories || 1, isExtracted: !!measurements.number_of_stories },
    { name: "Suggested Waste %", value: measurements.suggested_waste_percentage || 0, isExtracted: !!measurements.suggested_waste_percentage },
    { name: "Ridges Length", value: measurements.ridges?.length || 0, isExtracted: !!measurements.ridges?.length },
    { name: "Ridges Count", value: measurements.ridges?.count || 0, isExtracted: !!measurements.ridges?.count },
    { name: "Hips Length", value: measurements.hips?.length || 0, isExtracted: !!measurements.hips?.length },
    { name: "Hips Count", value: measurements.hips?.count || 0, isExtracted: !!measurements.hips?.count },
    { name: "Valleys Length", value: measurements.valleys?.length || 0, isExtracted: !!measurements.valleys?.length },
    { name: "Valleys Count", value: measurements.valleys?.count || 0, isExtracted: !!measurements.valleys?.count },
    { name: "Rakes Length", value: measurements.rakes?.length || 0, isExtracted: !!measurements.rakes?.length },
    { name: "Rakes Count", value: measurements.rakes?.count || 0, isExtracted: !!measurements.rakes?.count },
    { name: "Eaves Length", value: measurements.eaves?.length || 0, isExtracted: !!measurements.eaves?.length },
    { name: "Eaves Count", value: measurements.eaves?.count || 0, isExtracted: !!measurements.eaves?.count }
  ];

  return (
    <Card className="w-full mt-4">
      <CardHeader>
        <CardTitle>PDF Extraction Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {extractionFields.map((field, index) => (
            <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md">
              {field.isExtracted ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Square className="h-4 w-4 text-gray-300" />
              )}
              <span className="font-medium">{field.name}:</span>
              <span className="text-gray-600">
                {typeof field.value === 'number' ? field.value.toFixed(2) : field.value.toString()}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}