import React from "react";
import { SelectField } from "./fields/SelectField";
import { NumberField } from "./fields/NumberField";
import { CheckboxField } from "./fields/CheckboxField";

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
      <SelectField
        label="Roofing Type"
        value={roofingType}
        onValueChange={setRoofingType}
        options={ROOFING_TYPES}
        placeholder="Select roofing type"
      />

      <SelectField
        label="Roof Pitch"
        value={pitch}
        onValueChange={setPitch}
        options={PITCH_OPTIONS}
        placeholder="Select pitch"
      />

      <NumberField
        label="Total Area (sq ft)"
        value={totalArea}
        onChange={setTotalArea}
        placeholder="Enter total area"
        min="0"
        step="0.01"
      />

      <NumberField
        label="Waste Percentage (%)"
        value={wastePercentage}
        onChange={setWastePercentage}
        placeholder="Enter waste percentage"
        min="12"
        step="0.1"
      />

      <NumberField
        label="Number of Plumbing Boots"
        value={plumbingBoots}
        onChange={setPlumbingBoots}
        placeholder="Enter number of plumbing boots"
      />

      <NumberField
        label="Number of 4&quot; Goosenecks"
        value={goosenecks4Inch}
        onChange={setGoosenecks4Inch}
        placeholder="Enter number of 4&quot; goosenecks"
      />

      <NumberField
        label="Number of 10&quot; Goosenecks"
        value={goosenecks10Inch}
        onChange={setGoosenecks10Inch}
        placeholder="Enter number of 10&quot; goosenecks"
      />

      <NumberField
        label="Number of Skylights"
        value={skylights}
        onChange={setSkylights}
        placeholder="Enter number of skylights"
      />

      <CheckboxField
        id="two-story"
        label="Two Story Building"
        checked={isTwoStory}
        onCheckedChange={setIsTwoStory}
      />

      <CheckboxField
        id="keep-gutters"
        label="Keep Existing Gutters"
        checked={keepGutters}
        onCheckedChange={setKeepGutters}
      />
    </div>
  );
}