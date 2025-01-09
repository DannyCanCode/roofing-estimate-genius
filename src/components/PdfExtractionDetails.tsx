import { Check, Square, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Measurement {
  length?: number;
  count?: number;
}

interface Measurements {
  total_area?: number;
  predominant_pitch?: string;
  number_of_stories?: number;
  suggested_waste_percentage?: number;
  ridges?: Measurement;
  hips?: Measurement;
  valleys?: Measurement;
  rakes?: Measurement;
  eaves?: Measurement;
}

interface ExtractionField {
  name: string;
  value: string | number;
  isExtracted: boolean;
  error?: string;
}

interface PdfExtractionDetailsProps {
  data: {
    measurements: Measurements;
    debugInfo?: {
      matched_patterns: Record<string, boolean>;
      text_samples: Record<string, string>;
      waste_table_error?: string;
    };
  };
}

export function PdfExtractionDetails({ data }: PdfExtractionDetailsProps) {
  console.log("PDF Extraction Data:", data);

  const measurements = data?.measurements || {};
  const hasErrors = !measurements.total_area || measurements.total_area <= 0;
  
  const extractionFields: ExtractionField[] = [
    { 
      name: "Total Roof Area", 
      value: measurements.total_area || 0, 
      isExtracted: !!measurements.total_area,
      error: !measurements.total_area ? "Required measurement missing" : measurements.total_area <= 0 ? "Invalid area value" : undefined
    },
    { 
      name: "Predominant Pitch", 
      value: measurements.predominant_pitch || "", 
      isExtracted: !!measurements.predominant_pitch,
      error: !measurements.predominant_pitch ? "Missing pitch value" : undefined
    },
    { 
      name: "Number of Stories", 
      value: measurements.number_of_stories || 1, 
      isExtracted: !!measurements.number_of_stories 
    },
    { 
      name: "Suggested Waste %", 
      value: measurements.suggested_waste_percentage || 0, 
      isExtracted: !!measurements.suggested_waste_percentage,
      error: measurements.suggested_waste_percentage === 0 ? "Missing waste percentage" : undefined
    },
    { 
      name: "Ridges Length", 
      value: measurements.ridges?.length || 0, 
      isExtracted: !!measurements.ridges?.length 
    },
    { 
      name: "Ridges Count", 
      value: measurements.ridges?.count || 0, 
      isExtracted: !!measurements.ridges?.count 
    },
    { 
      name: "Hips Length", 
      value: measurements.hips?.length || 0, 
      isExtracted: !!measurements.hips?.length 
    },
    { 
      name: "Hips Count", 
      value: measurements.hips?.count || 0, 
      isExtracted: !!measurements.hips?.count 
    },
    { 
      name: "Valleys Length", 
      value: measurements.valleys?.length || 0, 
      isExtracted: !!measurements.valleys?.length 
    },
    { 
      name: "Valleys Count", 
      value: measurements.valleys?.count || 0, 
      isExtracted: !!measurements.valleys?.count 
    },
    { 
      name: "Rakes Length", 
      value: measurements.rakes?.length || 0, 
      isExtracted: !!measurements.rakes?.length 
    },
    { 
      name: "Rakes Count", 
      value: measurements.rakes?.count || 0, 
      isExtracted: !!measurements.rakes?.count 
    },
    { 
      name: "Eaves Length", 
      value: measurements.eaves?.length || 0, 
      isExtracted: !!measurements.eaves?.length 
    },
    { 
      name: "Eaves Count", 
      value: measurements.eaves?.count || 0, 
      isExtracted: !!measurements.eaves?.count 
    }
  ];

  return (
    <Card className="w-full mt-4">
      <CardHeader>
        <CardTitle>PDF Extraction Details</CardTitle>
      </CardHeader>
      <CardContent>
        {hasErrors && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Some required measurements could not be extracted. Please check the PDF file and try again.
            </AlertDescription>
          </Alert>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {extractionFields.map((field, index) => (
            <div 
              key={index} 
              className={`flex items-center space-x-2 p-2 rounded-md ${
                field.error ? 'bg-red-50' : 'bg-gray-50'
              }`}
            >
              {field.isExtracted ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Square className="h-4 w-4 text-gray-300" />
              )}
              <span className="font-medium">{field.name}:</span>
              <span className={`${field.error ? 'text-red-600' : 'text-gray-600'}`}>
                {typeof field.value === 'number' ? field.value.toFixed(2) : field.value.toString()}
              </span>
              {field.error && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{field.error}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}