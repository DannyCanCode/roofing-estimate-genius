// Import necessary modules and types
import { useState } from 'react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Loader2, Upload } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { processPdfReport } from '../services/api';

export function PDFUploader() {
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('pdf')) {
      setError('Please upload a PDF file');
      return;
    }

    setStatus('Processing PDF...');
    setError(null);
    setIsLoading(true);
    setResult(null);

    try {
      console.log('Processing PDF file:', file.name);
      const measurements = await processPdfReport(file);

      if (!measurements || !measurements.totalArea) {
        setError('Could not extract measurements from PDF. Please make sure you uploaded a valid EagleView report.');
        setStatus('Error processing PDF');
      } else {
        setResult({ measurements });
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
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Upload EagleView Report</h2>
        </div>
        
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="pdf-upload">Upload PDF</Label>
          <div className="flex gap-2">
            <Input
              id="pdf-upload"
              type="file"
              accept=".pdf"
              onChange={handleUpload}
              disabled={isLoading}
              className="cursor-pointer"
            />
            {isLoading && (
              <Button disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing
              </Button>
            )}
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {status && !error && (
          <Alert>
            <AlertTitle>Status</AlertTitle>
            <AlertDescription>{status}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="mt-4 space-y-2">
            <h3 className="text-lg font-semibold">Extracted Measurements</h3>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto">
              {JSON.stringify(result.measurements, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Card>
  );
}
