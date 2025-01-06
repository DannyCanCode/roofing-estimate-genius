import { useMutation } from "@tanstack/react-query";
import { processPdfReport } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { ProcessedPdfData, RoofMeasurements } from "@/types/estimate";

export const usePdfProcessing = (onSuccess: (measurements: RoofMeasurements) => void) => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: processPdfReport,
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