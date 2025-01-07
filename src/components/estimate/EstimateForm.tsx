import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface EstimateFormProps {
  profitMargin: number;
  onProfitMarginChange: (value: number) => void;
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

export function EstimateForm({
  profitMargin,
  onProfitMarginChange,
  onFileSelect,
  isLoading
}: EstimateFormProps) {
  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <Label htmlFor="profitMargin">Profit Margin (%)</Label>
          <Input
            id="profitMargin"
            type="number"
            value={profitMargin}
            onChange={(e) => onProfitMarginChange(Number(e.target.value))}
            className="w-32"
            min="0"
            max="100"
            disabled={isLoading}
          />
        </div>

        <div>
          <Label htmlFor="pdfUpload">Upload EagleView PDF</Label>
          <Input
            id="pdfUpload"
            type="file"
            accept=".pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFileSelect(file);
            }}
            disabled={isLoading}
          />
        </div>
      </div>
    </Card>
  );
}