import { useMutation } from "@tanstack/react-query";
import { processPdfReport } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { ProcessedPdfData, RoofMeasurements } from "@/types/estimate";

interface PdfProcessingCallbacks {
  onSuccess: (measurements: RoofMeasurements) => void;
}

export const usePdfProcessing = ({ onSuccess }: PdfProcessingCallbacks) => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (file: File): Promise<ProcessedPdfData> => {
      const data = await processPdfReport(file);
      return {
        totalArea: data.totalArea,
        pitch: data.pitchBreakdown[0]?.pitch || "4/12",
        suggestedWaste: data.suggestedWaste
      };
    },
    onSuccess: (data: ProcessedPdfData) => {
      const formattedMeasurements: RoofMeasurements = {
        totalArea: data.totalArea,
        pitchBreakdown: [{
          pitch: data.pitch,
          area: data.totalArea
        }],
        suggestedWaste: data.suggestedWaste
      };
      onSuccess(formattedMeasurements);
      toast({
        title: "PDF Processed Successfully",
        description: "Your roof measurements have been extracted.",
      });
    },
    onError: () => {
      toast({
        title: "Error Processing PDF",
        description: "Failed to process the PDF report. Please try again.",
        variant: "destructive",
      });
    },
  });
};