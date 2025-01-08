import React from 'react';
import { ProfitMarginSlider } from "@/components/ProfitMarginSlider";
import { RoofMeasurements } from "@/types/estimate";
import { RoofingCategory } from "@/components/RoofingCategorySelector";

interface EstimateSidebarProps {
  measurements: RoofMeasurements | null;
  selectedCategory: RoofingCategory | null;
  profitMargin: number;
  onProfitMarginChange: (value: number) => void;
}

export function EstimateSidebar({
  measurements,
  selectedCategory,
  profitMargin,
  onProfitMarginChange,
}: EstimateSidebarProps) {
  return (
    <div className="space-y-6">
      {measurements && selectedCategory && (
        <ProfitMarginSlider
          value={profitMargin}
          onChange={onProfitMarginChange}
        />
      )}
    </div>
  );
}