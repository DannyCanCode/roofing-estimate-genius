import { FileUpload } from "@/components/FileUpload";

interface EstimateUploadSectionProps {
  onFileAccepted: (file: File) => void;
  isProcessing: boolean;
}

export function EstimateUploadSection({ 
  onFileAccepted,
  isProcessing 
}: EstimateUploadSectionProps) {
  return (
    <FileUpload
      onFileAccepted={onFileAccepted}
      isProcessing={isProcessing}
    />
  );
}