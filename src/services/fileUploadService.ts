import { supabase } from "@/integrations/supabase/client";

export class FileUploadService {
  static async validateFile(file: File): Promise<void> {
    console.log("Validating file:", file.type, file.size);
    
    if (file.type !== "application/pdf") {
      throw new Error("Please upload a PDF file");
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new Error("Please upload a file smaller than 10MB");
    }
  }

  static async uploadFile(file: File): Promise<{ filePath: string }> {
    console.log("Starting file upload process");
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `reports/${fileName}`;

    // Create FormData for the edge function
    const formData = new FormData();
    formData.append('file', file);

    console.log("Uploading to storage bucket");
    const { error: uploadError } = await supabase.storage
      .from('eagleview-reports')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      throw new Error("Failed to upload PDF file");
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
      throw new Error("Failed to save report information");
    }

    return { filePath };
  }
}