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

        if (!data.measurements?.total_area) {
          console.error('Invalid or missing total area in response:', data);
          throw new Error(data.error || 'Could not extract roof area from PDF');
        }

        // Get the pitch from either pitchBreakdown or the direct pitch field
        const defaultPitch = "4/12";
        const pitch = data.measurements.predominant_pitch || defaultPitch;

        const processedData: ProcessedPdfData = {
          measurements: {
            total_area: data.measurements.total_area,
            predominant_pitch: pitch,
            suggested_waste_percentage: data.measurements.suggested_waste_percentage || 15,
            // Add all the raw data fields
            ...data.measurements
          }
        };

        console.log('Processed data:', processedData);
        return processedData;
      } catch (error) {
        console.error('Error processing PDF:', error);
        throw error;
      }
    },
    onSuccess: (data: ProcessedPdfData) => {
      console.log('Mutation succeeded with data:', data);
      const formattedMeasurements: RoofMeasurements = {
        totalArea: data.measurements.total_area,
        pitchBreakdown: [{
          pitch: data.measurements.predominant_pitch || "4/12",
          area: data.measurements.total_area
        }],
        suggestedWaste: data.measurements.suggested_waste_percentage
      };
      onSuccess(formattedMeasurements, data.measurements);
      toast({
        title: "PDF Processed Successfully",
        description: "Your roof measurements have been extracted.",
      });
    },
    onError: (error: Error) => {
      console.error('Mutation error:', error);
      toast({
        title: "Error Processing PDF",
        description: error.message || "Failed to process the PDF report",
        variant: "destructive",
      });
    },
  });
};