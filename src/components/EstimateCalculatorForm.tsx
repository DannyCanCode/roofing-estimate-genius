import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useToast } from "@/hooks/use-toast";
import { calculateEstimate } from "@/services/estimateApi";

const PITCH_OPTIONS = [
  "2/12",
  "3/12",
  "4/12",
  "5/12",
  "6/12",
  "7/12",
  "8/12",
  "9/12",
  "10/12",
  "11/12",
  "12/12",
];

const ROOFING_TYPES = ["SHINGLE", "TILE", "METAL"];

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
          <div className="space-y-2">
            <label className="text-sm font-medium">Roofing Type</label>
            <Select value={roofingType} onValueChange={setRoofingType}>
              <SelectTrigger>
                <SelectValue placeholder="Select roofing type" />
              </SelectTrigger>
              <SelectContent>
                {ROOFING_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Roof Pitch</label>
            <Select value={pitch} onValueChange={setPitch}>
              <SelectTrigger>
                <SelectValue placeholder="Select pitch" />
              </SelectTrigger>
              <SelectContent>
                {PITCH_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Total Area (sq ft)</label>
            <Input
              type="number"
              value={totalArea}
              onChange={(e) => setTotalArea(e.target.value)}
              placeholder="Enter total area"
              min="0"
              step="0.01"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Waste Percentage (%)</label>
            <Input
              type="number"
              value={wastePercentage}
              onChange={(e) => setWastePercentage(e.target.value)}
              placeholder="Enter waste percentage"
              min="0"
              max="100"
              step="0.1"
            />
          </div>

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