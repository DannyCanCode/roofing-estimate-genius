import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

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
  plumbingBoots: string;
  setPlumbingBoots: (value: string) => void;
  goosenecks4Inch: string;
  setGoosenecks4Inch: (value: string) => void;
  goosenecks10Inch: string;
  setGoosenecks10Inch: (value: string) => void;
  skylights: string;
  setSkylights: (value: string) => void;
  isTwoStory: boolean;
  setIsTwoStory: (value: boolean) => void;
  keepGutters: boolean;
  setKeepGutters: (value: boolean) => void;
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
  plumbingBoots,
  setPlumbingBoots,
  goosenecks4Inch,
  setGoosenecks4Inch,
  goosenecks10Inch,
  setGoosenecks10Inch,
  skylights,
  setSkylights,
  isTwoStory,
  setIsTwoStory,
  keepGutters,
  setKeepGutters,
}: EstimateFormFieldsProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Roofing Type</Label>
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
        <Label>Roof Pitch</Label>
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
        <Label>Total Area (sq ft)</Label>
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
        <Label>Waste Percentage (%)</Label>
        <Input
          type="number"
          value={wastePercentage}
          onChange={(e) => setWastePercentage(e.target.value)}
          placeholder="Enter waste percentage"
          min="12"
          step="0.1"
        />
      </div>

      <div className="space-y-2">
        <Label>Number of Plumbing Boots</Label>
        <Input
          type="number"
          value={plumbingBoots}
          onChange={(e) => setPlumbingBoots(e.target.value)}
          placeholder="Enter number of plumbing boots"
          min="0"
        />
      </div>

      <div className="space-y-2">
        <Label>Number of 4" Goosenecks</Label>
        <Input
          type="number"
          value={goosenecks4Inch}
          onChange={(e) => setGoosenecks4Inch(e.target.value)}
          placeholder="Enter number of 4&quot; goosenecks"
          min="0"
        />
      </div>

      <div className="space-y-2">
        <Label>Number of 10" Goosenecks</Label>
        <Input
          type="number"
          value={goosenecks10Inch}
          onChange={(e) => setGoosenecks10Inch(e.target.value)}
          placeholder="Enter number of 10&quot; goosenecks"
          min="0"
        />
      </div>

      <div className="space-y-2">
        <Label>Number of Skylights</Label>
        <Input
          type="number"
          value={skylights}
          onChange={(e) => setSkylights(e.target.value)}
          placeholder="Enter number of skylights"
          min="0"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="two-story"
          checked={isTwoStory}
          onCheckedChange={(checked) => setIsTwoStory(checked as boolean)}
        />
        <Label htmlFor="two-story">Two Story Building</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="keep-gutters"
          checked={keepGutters}
          onCheckedChange={(checked) => setKeepGutters(checked as boolean)}
        />
        <Label htmlFor="keep-gutters">Keep Existing Gutters</Label>
      </div>
    </div>
  );
}