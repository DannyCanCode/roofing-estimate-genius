import { supabase } from "@/integrations/supabase/client";

export class FileUploadService {
  static async validateFile(file: File): Promise<void> {
    console.log("Validating file:", file.type, file.size);
    
    if (file.type !== "application/pdf") {
      throw new Error("Please upload a PDF file");
    }

    // Reduce max file size to prevent timeouts
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("Please upload a file smaller than 5MB to prevent processing timeouts");
    }
  }

  static async uploadFile(file: File): Promise<{ filePath: string }> {
    console.log("Starting file upload process");
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `reports/${fileName}`;

    try {
      console.log("Uploading to storage bucket");
      const { error: uploadError, data } = await supabase.storage
        .from('eagleview-reports')
        .upload(filePath, file, {
          contentType: 'application/pdf',
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw new Error("Failed to upload PDF file: " + uploadError.message);
      }

      if (!data?.path) {
        throw new Error("No file path returned from upload");
      }

      console.log("Creating report record in database");
      const { error: dbError } = await supabase
        .from('reports')
        .insert({
          file_path: filePath,
          original_filename: file.name,
          status: 'processing',
          metadata: {}
        });

      if (dbError) {
        console.error('Error saving report to database:', dbError);
        // If database insert fails, try to clean up the uploaded file
        await supabase.storage
          .from('eagleview-reports')
          .remove([filePath]);
        throw new Error("Failed to save report information");
      }

      return { filePath };
    } catch (error) {
      console.error("File upload process failed:", error);
      throw error;
    }
  }
}