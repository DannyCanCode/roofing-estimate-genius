import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RoofMeasurements } from '@/types/estimate';
import { processPdfFile } from '@/services/pdfProcessingService';

interface PDFUploaderProps {
  onProcessed: (data: RoofMeasurements) => void;
  profitMargin?: number;
  roofingType?: string;
}

export function PDFUploader({ onProcessed, profitMargin = 0.3, roofingType = 'asphalt' }: PDFUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const data = await processPdfFile(file, profitMargin, roofingType);
      onProcessed(data.measurements);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process PDF. Please try again.';
      setError(errorMessage);
      console.error('Error processing PDF:', err);
    } finally {
      setIsUploading(false);
    }
  }, [onProcessed, profitMargin, roofingType]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    multiple: false,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload EagleView PDF</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-primary'
          }`}
        >
          <input {...getInputProps()} />
          {isUploading ? (
            <p className="text-gray-600">Processing PDF...</p>
          ) : isDragActive ? (
            <p className="text-primary">Drop the PDF here</p>
          ) : (
            <p className="text-gray-600">
              Drag and drop an EagleView PDF here, or click to select
            </p>
          )}
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
      </CardContent>
    </Card>
  );
} 