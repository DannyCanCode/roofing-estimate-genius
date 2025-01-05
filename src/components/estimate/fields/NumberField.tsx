import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface NumberFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  min?: string;
  step?: string;
}

export function NumberField({ label, value, onChange, placeholder, min = "0", step }: NumberFieldProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        step={step}
      />
    </div>
  );
}