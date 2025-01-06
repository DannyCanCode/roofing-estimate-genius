import { useMutation } from "@tanstack/react-query";
import { processPdfReport } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { ProcessedPdfData, RoofMeasurements } from "@/types/estimate";

interface PdfProcessingCallbacks {
  onSuccess: (measurements: RoofMeasurements, rawData: Record<string, any>) => void;
}

export const usePdfProcessing = ({ onSuccess }: PdfProcessingCallbacks) => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (file: File): Promise<ProcessedPdfData> => {
      try {
        console.log('Processing PDF file:', file.name);
        const data = await processPdfReport(file);
        console.log('Received data from API:', data);

        if (!data.totalArea || data.totalArea <= 0) {
          throw new Error('Invalid or missing total area in PDF');
        }

        // Get the pitch from either pitchBreakdown or the direct pitch field
        const defaultPitch = "4/12";
        const pitch = data.pitchBreakdown?.[0]?.pitch || defaultPitch;

        // Ensure we have the required data with fallbacks
        const processedData: ProcessedPdfData = {
          totalArea: data.totalArea,
          pitchBreakdown: [{
            pitch: pitch,
            area: data.totalArea
          }],
          suggestedWaste: data.suggestedWaste || 15,
          // Add all the raw data fields
          ...data
        };

        console.log('Processed data:', processedData);
        return processedData;
      } catch (error) {
        console.error('Error processing PDF:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to process PDF');
      }
    },
    onSuccess: (data: ProcessedPdfData) => {
      console.log('Mutation succeeded with data:', data);
      const formattedMeasurements: RoofMeasurements = {
        totalArea: data.totalArea,
        pitchBreakdown: [{
          pitch: data.pitchBreakdown[0].pitch,
          area: data.totalArea
        }],
        suggestedWaste: data.suggestedWaste
      };
      onSuccess(formattedMeasurements, data);
      toast({
        title: "PDF Processed Successfully",
        description: "Your roof measurements have been extracted.",
      });
    },
    onError: (error: Error) => {
      console.error('Mutation error:', error);
      toast({
        title: "Error Processing PDF",
        description: error.message || "Failed to process the PDF report. Please try again.",
        variant: "destructive",
      });
    },
  });
};