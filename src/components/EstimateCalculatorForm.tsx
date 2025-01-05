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
  const [wastePercentage, setWastePercentage] = useState<string>("12"); // Default 12%
  const [plumbingBoots, setPlumbingBoots] = useState<string>("0");
  const [goosenecks4Inch, setGoosenecks4Inch] = useState<string>("0");
  const [goosenecks10Inch, setGoosenecks10Inch] = useState<string>("0");
  const [skylights, setSkylights] = useState<string>("0");
  const [isTwoStory, setIsTwoStory] = useState<boolean>(false);
  const [keepGutters, setKeepGutters] = useState<boolean>(false);
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
        plumbing_boots: parseInt(plumbingBoots),
        goosenecks_4_inch: parseInt(goosenecks4Inch),
        goosenecks_10_inch: parseInt(goosenecks10Inch),
        skylights: parseInt(skylights),
        is_two_story: isTwoStory,
        keep_gutters: keepGutters,
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
            plumbingBoots={plumbingBoots}
            setPlumbingBoots={setPlumbingBoots}
            goosenecks4Inch={goosenecks4Inch}
            setGoosenecks4Inch={setGoosenecks4Inch}
            goosenecks10Inch={goosenecks10Inch}
            setGoosenecks10Inch={setGoosenecks10Inch}
            skylights={skylights}
            setSkylights={setSkylights}
            isTwoStory={isTwoStory}
            setIsTwoStory={setIsTwoStory}
            keepGutters={keepGutters}
            setKeepGutters={setKeepGutters}
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