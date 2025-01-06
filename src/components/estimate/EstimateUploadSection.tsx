import { FileUpload } from "@/components/FileUpload";
import { RoofMeasurements } from "@/types/estimate";

interface EstimateUploadSectionProps {
  onMeasurementsExtracted: (measurements: RoofMeasurements) => void;
  isProcessing: boolean;
}

export function EstimateUploadSection({ 
  onMeasurementsExtracted,
  isProcessing 
}: EstimateUploadSectionProps) {
  return (
    <FileUpload
      onFileAccepted={onMeasurementsExtracted}
      isProcessing={isProcessing}
    />
  );
}