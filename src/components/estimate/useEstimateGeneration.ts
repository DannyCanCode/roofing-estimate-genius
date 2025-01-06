import { useMutation } from "@tanstack/react-query";
import { generateEstimate } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { RoofMeasurements, EstimateItem } from "@/types/estimate";

interface EstimateGenerationParams {
  measurements: RoofMeasurements;
  profitMargin: number;
  roofingCategory: string;
}

interface EstimateGenerationCallbacks {
  onSuccess: (items: EstimateItem[], totalPrice: number) => void;
}

export const useEstimateGeneration = ({ onSuccess }: EstimateGenerationCallbacks) => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: generateEstimate,
    onSuccess: (data) => {
      const items: EstimateItem[] = [
        ...data.materials.map(material => ({
          description: material.name,
          quantity: material.quantity,
          unit: material.unit,
          unitPrice: material.basePrice,
          total: material.quantity * material.basePrice
        })),
        ...data.labor.map(labor => ({
          description: `Labor for ${labor.pitch} pitch`,
          quantity: labor.area,
          unit: 'sq ft',
          unitPrice: labor.rate,
          total: labor.area * labor.rate
        }))
      ];
      onSuccess(items, data.totalPrice);
    },
    onError: (error) => {
      console.error('Error generating estimate:', error);
      toast({
        title: "Error Generating Estimate",
        description: "Failed to generate the estimate. Please try again.",
        variant: "destructive",
      });
    }
  });
};