import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface ProfitMarginSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function ProfitMarginSlider({ value, onChange }: ProfitMarginSliderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="profit-margin">Profit Margin</Label>
        <span className="text-sm font-medium">{value}%</span>
      </div>
      <Slider
        id="profit-margin"
        min={0}
        max={100}
        step={1}
        value={[value]}
        onValueChange={(values) => onChange(values[0])}
        className="w-full"
      />
    </div>
  );
}