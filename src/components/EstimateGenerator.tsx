import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { EstimatePreview } from './EstimatePreview';
import { PricingLogic } from './PricingLogic';
import { GAFShinglesPricing } from './GAFShinglesPricing';
import { RoofMeasurements, PricingConfig, UnderlaymentType, AdditionalMaterials, VentType } from '@/types/estimate';

interface EstimateGeneratorProps {
  measurements: RoofMeasurements;
}

const DEFAULT_PRICING: PricingConfig = {
  materials: {
    shingles: {
      price: 152.10,
      cost: 121.68,
      unit: 'per square'
    },
    underlayment: {
      feltbuster: {
        price: 45.00,
        unit: 'per square'
      },
      ice_and_water: {
        price: 65.00,
        unit: 'per square'
      }
    },
    starter: {
      price: 45.00,
      unit: 'per square'
    },
    ridge_caps: {
      price: 12.00,
      unit: 'per linear ft'
    },
    drip_edge: {
      price: 3.50,
      unit: 'per linear ft'
    },
    plywood: {
      price: 85.00,
      unit: 'per square'
    },
    flat_roof_materials: {
      iso: {
        price: 95.00,
        unit: 'per square'
      },
      base_cap: {
        price: 125.00,
        unit: 'per square'
      }
    },
    pipe_flashings: {
      two_inch: {
        price: 25.00,
        unit: 'per piece'
      },
      three_inch: {
        price: 35.00,
        unit: 'per piece'
      }
    },
    vents: {
      gooseneck_4: {
        price: 45.00,
        unit: 'per piece'
      },
      gooseneck_10: {
        price: 65.00,
        unit: 'per piece'
      },
      off_ridge: {
        price: 35.00,
        unit: 'per piece'
      }
    },
    nails: {
      coil_2_3_8: {
        price: 75.00,
        unit: 'per box'
      },
      coil_1_1_4: {
        price: 65.00,
        unit: 'per box'
      },
      plastic_cap: {
        price: 35.00,
        unit: 'per box'
      }
    },
    sealants: {
      geocel: {
        price: 8.50,
        unit: 'per tube'
      },
      roof_tar: {
        price: 45.00,
        unit: 'per bucket'
      }
    }
  },
  labor: {
    base_installation: {
      price: 125.00,
      unit: 'per square'
    },
    steep_slope_factor: {
      price: 35.00,
      unit: 'per square'
    },
    waste_factor: 0.15
  }
};

export function EstimateGenerator({ measurements }: EstimateGeneratorProps) {
  const [selectedShingle] = useState('Timberline HDZ');
  const [underlaymentType, setUnderlaymentType] = useState<UnderlaymentType>(UnderlaymentType.FELTBUSTER);
  const [additionalMaterials, setAdditionalMaterials] = useState<AdditionalMaterials>({
    plywood_replacement: false,
    flat_roof_iso: false,
    base_cap: false,
    pipe_flashings: [],
    vents: []
  });

  const handleUnderlaymentChange = (value: string) => {
    setUnderlaymentType(value as UnderlaymentType);
  };

  const handleAdditionalMaterialChange = (key: keyof AdditionalMaterials) => {
    setAdditionalMaterials(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleAddPipeFlashing = (size: '2"' | '3"') => {
    setAdditionalMaterials(prev => ({
      ...prev,
      pipe_flashings: [...prev.pipe_flashings, { size, quantity: 1 }]
    }));
  };

  const handleAddVent = (type: VentType) => {
    setAdditionalMaterials(prev => ({
      ...prev,
      vents: [...prev.vents, { type, quantity: 1 }]
    }));
  };

  const handleGeneratePDF = async () => {
    try {
      const response = await fetch('/api/generate-estimate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          measurements,
          pricing: DEFAULT_PRICING,
          selectedShingle,
          additionalMaterials,
          underlaymentType
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'estimate.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <div className="space-y-4 w-full max-w-[1600px] mx-auto px-4">
      <Card>
        <CardHeader>
          <CardTitle>Estimate Configuration</CardTitle>
          <p className="text-sm text-gray-500">Configure materials and additional options for your roofing estimate.</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-6">
            {/* Underlayment Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Underlayment Type</Label>
              <Select value={underlaymentType} onValueChange={handleUnderlaymentChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select underlayment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UnderlaymentType.FELTBUSTER}>FeltBuster</SelectItem>
                  <SelectItem value={UnderlaymentType.ICE_AND_WATER}>Ice & Water Shield</SelectItem>
                  <SelectItem value={UnderlaymentType.BOTH}>Both</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Additional Materials */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Additional Materials</Label>
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="plywood"
                    checked={additionalMaterials.plywood_replacement}
                    onCheckedChange={() => handleAdditionalMaterialChange('plywood_replacement')}
                  />
                  <label htmlFor="plywood" className="text-sm">Plywood Replacement</label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="flat-roof"
                    checked={additionalMaterials.flat_roof_iso}
                    onCheckedChange={() => handleAdditionalMaterialChange('flat_roof_iso')}
                  />
                  <label htmlFor="flat-roof" className="text-sm">Flat Roof ISO</label>
                </div>
                {additionalMaterials.flat_roof_iso && (
                  <div className="flex items-center space-x-3 ml-6">
                    <Checkbox
                      id="base-cap"
                      checked={additionalMaterials.base_cap}
                      onCheckedChange={() => handleAdditionalMaterialChange('base_cap')}
                    />
                    <label htmlFor="base-cap" className="text-sm">Base & Cap</label>
                  </div>
                )}
              </div>
            </div>

            {/* Pipe Flashings and Vents */}
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Pipe Flashings</Label>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleAddPipeFlashing('2"')}
                    className="flex-1 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 min-w-[120px]"
                  >
                    Add 2" Flashing
                  </button>
                  <button
                    onClick={() => handleAddPipeFlashing('3"')}
                    className="flex-1 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 min-w-[120px]"
                  >
                    Add 3" Flashing
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">Vents</Label>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleAddVent(VentType.GOOSENECK_4)}
                    className="flex-1 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 min-w-[140px]"
                  >
                    Add 4" Gooseneck
                  </button>
                  <button
                    onClick={() => handleAddVent(VentType.GOOSENECK_10)}
                    className="flex-1 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 min-w-[140px]"
                  >
                    Add 10" Gooseneck
                  </button>
                  <button
                    onClick={() => handleAddVent(VentType.OFF_RIDGE)}
                    className="flex-1 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 min-w-[140px]"
                  >
                    Add Off Ridge
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Selected Items Display */}
          {(additionalMaterials.pipe_flashings.length > 0 || additionalMaterials.vents.length > 0) && (
            <div className="mt-8 border-t pt-6">
              <h3 className="text-base font-semibold mb-4">Selected Items</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {additionalMaterials.pipe_flashings.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Pipe Flashings</h4>
                    <div className="space-y-2">
                      {additionalMaterials.pipe_flashings.map((flashing, index) => (
                        <div key={index} className="text-sm text-gray-600 flex justify-between">
                          <span>{flashing.size} Flashing</span>
                          <span>Qty: {flashing.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {additionalMaterials.vents.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Vents</h4>
                    <div className="space-y-2">
                      {additionalMaterials.vents.map((vent, index) => (
                        <div key={index} className="text-sm text-gray-600 flex justify-between">
                          <span>{vent.type}</span>
                          <span>Qty: {vent.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="w-full">
        <EstimatePreview
          measurements={measurements}
          pricing={DEFAULT_PRICING}
          additionalMaterials={additionalMaterials}
          underlaymentType={underlaymentType}
          onGeneratePDF={handleGeneratePDF}
        />
      </div>
    </div>
  );
} 