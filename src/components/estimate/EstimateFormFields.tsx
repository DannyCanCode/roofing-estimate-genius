import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const PITCH_OPTIONS = [
  "2/12", "3/12", "4/12", "5/12", "6/12",
  "7/12", "8/12", "9/12", "10/12", "11/12", "12/12",
];

const ROOFING_TYPES = ["SHINGLE", "TILE", "METAL"];

interface EstimateFormFieldsProps {
  roofingType: string;
  setRoofingType: (value: string) => void;
  pitch: string;
  setPitch: (value: string) => void;
  totalArea: string;
  setTotalArea: (value: string) => void;
  wastePercentage: string;
  setWastePercentage: (value: string) => void;
}

export function EstimateFormFields({
  roofingType,
  setRoofingType,
  pitch,
  setPitch,
  totalArea,
  setTotalArea,
  wastePercentage,
  setWastePercentage,
}: EstimateFormFieldsProps) {
  return (
    <>
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
    </>
  );
}