import { useCallback, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { FileUploadService } from "@/services/fileUploadService";
import { DropZone } from "./upload/DropZone";

interface FileUploadProps {
  onFileAccepted: (file: File) => void;
  isProcessing?: boolean;
}

export function FileUpload({ onFileAccepted, isProcessing = false }: FileUploadProps) {
  const { toast } = useToast();

  const handleFileAccepted = useCallback(
    async (file: File) => {
      console.log("File received:", file.name, "Type:", file.type, "Size:", file.size);

      try {
        await FileUploadService.validateFile(file);

        // Create a blob from the file to ensure proper data transfer
        const blob = new Blob([await file.arrayBuffer()], { type: 'application/pdf' });
        const pdfFile = new File([blob], file.name, { type: 'application/pdf' });

        toast({
          title: "Processing PDF",
          description: "Your file is being processed...",
        });

        await FileUploadService.uploadFile(pdfFile);
        await onFileAccepted(pdfFile);
        
        console.log("File processing completed:", file.name);
      } catch (error) {
        console.error("Error processing file:", error);
        
        let errorMessage = error instanceof Error ? error.message : "Failed to process file";
        if (errorMessage.includes('text-based PDF')) {
          errorMessage = "This appears to be a scanned PDF. Please ensure you are uploading a text-based PDF from EagleView.";
        }
        
        toast({
          title: "Error processing file",
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
    [onFileAccepted, toast]
  );

  return (
    <DropZone
      onFileAccepted={handleFileAccepted}
      isProcessing={isProcessing}
    />
  );
}