import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileUpload } from "@/components/FileUpload";

export interface EstimateFormProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

export function EstimateForm({
  onFileSelect,
  isLoading,
}: EstimateFormProps) {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Upload PDF Report</h2>
      <FileUpload
        onFileAccepted={onFileSelect}
        isProcessing={isLoading}
      />
    </Card>
  );
}