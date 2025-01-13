import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MaterialPrice {
  name: string;
  retailPrice: number;
  unit: string;
}

const GAF_MATERIALS: MaterialPrice[] = [
  { name: "GAF Timberline HDZ SG", retailPrice: 152.10, unit: "SQ" },
  { name: "GAF Seal-A-Ridge (25')", retailPrice: 66.41, unit: "BD" },
  { name: "GAF ProStart Starter Shingle Strip (120')", retailPrice: 63.25, unit: "BD" },
  { name: "GAF Weatherwatch Ice & Water Shield (2sq)", retailPrice: 117.50, unit: "EA" },
  { name: "GAF FeltBuster Synthetic Underlayment (10 sq)", retailPrice: 104.94, unit: "RL" },
  { name: "GAF Liberty SBS SA Base Sheet (2 sq)", retailPrice: 124.48, unit: "RL" },
  { name: "GAF Liberty SBS SA Cap Sheet (1 sq)", retailPrice: 124.48, unit: "RL" }
];

export function GAFShinglesPricing() {
  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold mb-2">GAF Materials Pricing</h3>
      <div className="rounded-md border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Retail Price</th>
              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {GAF_MATERIALS.map((material, index) => (
              <tr key={index}>
                <td className="px-4 py-2 text-sm text-gray-900">{material.name}</td>
                <td className="px-4 py-2 text-sm text-gray-900 text-right">${material.retailPrice.toFixed(2)}</td>
                <td className="px-4 py-2 text-sm text-gray-900 text-center">/{material.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 