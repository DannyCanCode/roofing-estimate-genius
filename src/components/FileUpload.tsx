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

        toast({
          title: "Processing PDF",
          description: "Your file is being processed...",
        });

        await FileUploadService.uploadFile(file);
        await onFileAccepted(file);
        
        console.log("File processing completed:", file.name);
      } catch (error) {
        console.error("Error processing file:", error);
        toast({
          title: "Error processing file",
          description: error instanceof Error ? error.message : "Failed to process file",
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