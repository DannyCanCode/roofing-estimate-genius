import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { calculateEstimate } from "@/services/estimateApi";
import { EstimateFormFields } from "./estimate/EstimateFormFields";

export function EstimateCalculatorForm() {
  const [roofingType, setRoofingType] = useState<string>("");
  const [pitch, setPitch] = useState<string>("");
  const [totalArea, setTotalArea] = useState<string>("");
  const [wastePercentage, setWastePercentage] = useState<string>("10"); // Default 10%
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await calculateEstimate({
        roofing_type: roofingType,
        pitch,
        total_area: parseFloat(totalArea),
        waste_percentage: parseFloat(wastePercentage),
      });

      toast({
        title: "Estimate Calculated",
        description: `Estimated cost: $${result.estimate.toFixed(2)}`,
      });

      if (result.special_requirements.length > 0) {
        toast({
          title: "Special Requirements",
          description: result.special_requirements.join(", "),
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to calculate estimate",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calculate Roof Estimate</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <EstimateFormFields
            roofingType={roofingType}
            setRoofingType={setRoofingType}
            pitch={pitch}
            setPitch={setPitch}
            totalArea={totalArea}
            setTotalArea={setTotalArea}
            wastePercentage={wastePercentage}
            setWastePercentage={setWastePercentage}
          />

          <Button 
            type="submit" 
            disabled={isLoading || !roofingType || !pitch || !totalArea || !wastePercentage}
          >
            {isLoading ? "Calculating..." : "Calculate Estimate"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}