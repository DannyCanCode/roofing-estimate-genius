import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Cloud, File, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface FileUploadProps {
  onFileAccepted: (file: File) => void;
  isProcessing?: boolean;
}

export function FileUpload({ onFileAccepted, isProcessing = false }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) {
        console.log("No files accepted");
        return;
      }

      const file = acceptedFiles[0];
      console.log("File received:", file.name, "Type:", file.type, "Size:", file.size);

      if (file.type !== "application/pdf") {
        console.log("Invalid file type:", file.type);
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        console.log("File too large:", file.size);
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      try {
        console.log("Starting file processing:", file.name);
        toast({
          title: "Processing PDF",
          description: "Your file is being processed...",
        });

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error("You must be logged in to upload files");
        }

        // Upload file to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `reports/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('eagleview-reports')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          throw new Error("Failed to upload PDF file");
        }

        // Create report record with user_id
        const { error: dbError } = await supabase
          .from('reports')
          .insert({
            file_path: filePath,
            original_filename: file.name,
            status: 'processing',
            metadata: {},
            user_id: user.id // Add the user_id here
          });

        if (dbError) {
          console.error('Error saving report to database:', dbError);
          throw new Error("Failed to save report information");
        }

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