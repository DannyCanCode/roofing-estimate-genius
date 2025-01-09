// Import necessary modules and types
import { useState } from 'react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { processPdfReport } from '../services/api';
import { PdfExtractionDetails } from './PdfExtractionDetails';
import { ProcessedPdfData } from '@/types/estimate';

export function PDFUploader() {
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<ProcessedPdfData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('pdf')) {
      setError('Please upload a PDF file');
      return;
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setStatus('Processing PDF...');
    setError(null);
    setIsLoading(true);
    setResult(null);

    try {
      console.log('Processing PDF file:', file.name);
      const data = await processPdfReport(file);

      if (!data?.measurements?.total_area) {
        setError('Could not extract measurements from PDF. Please make sure you uploaded a valid EagleView report.');
        setStatus('Error processing PDF');
      } else {
        setResult(data);
        setStatus('PDF processed successfully');
      }
    } catch (error: any) {
      console.error('Error processing PDF:', error);
      setError(error.message || 'Error processing PDF');
      setStatus('Error processing PDF');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="pdf-upload">Upload EagleView PDF Report</Label>
          <Input
            id="pdf-upload"
            type="file"
            accept=".pdf"
            onChange={handleUpload}
            disabled={isLoading}
            className="mt-2"
          />
        </div>

        {isLoading && (
          <div className="flex items-center space-x-2 text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Processing PDF...</span>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && <PdfExtractionDetails data={result} />}
      </div>
    </Card>
  );
}
