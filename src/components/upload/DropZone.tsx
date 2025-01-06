import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Cloud, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropZoneProps {
  onFileAccepted: (file: File) => void;
  isProcessing?: boolean;
}

export function DropZone({ onFileAccepted, isProcessing = false }: DropZoneProps) {
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileAccepted(acceptedFiles[0]);
      }
    },
    [onFileAccepted]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative rounded-lg border-2 border-dashed border-gray-300 p-12 text-center transition-all",
        "hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        dragActive && "border-primary bg-primary/5",
        "cursor-pointer"
      )}
      onDragEnter={() => setDragActive(true)}
      onDragLeave={() => setDragActive(false)}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center space-y-4">
        {isProcessing ? (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
            <p className="text-sm text-gray-500">Processing your PDF...</p>
          </>
        ) : (
          <>
            <Cloud className="h-12 w-12 text-gray-400" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Drop your EagleView PDF report here
              </p>
              <p className="text-xs text-gray-500">PDF files only, up to 10MB</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}