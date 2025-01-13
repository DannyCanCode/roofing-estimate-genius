import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RoofMeasurements, PricingConfig, UnderlaymentType, AdditionalMaterials, VentType } from '@/types/estimate';

interface PricingLogicProps {
  measurements: RoofMeasurements;
  pricing: PricingConfig;
  additionalMaterials: AdditionalMaterials;
  underlaymentType: UnderlaymentType;
}

export function PricingLogic({ measurements, pricing, additionalMaterials, underlaymentType }: PricingLogicProps) {
  const calculateMaterialCosts = () => {
    const { total_squares } = measurements;
    const costs = {
      shingles: total_squares * pricing.materials.shingles.price,
      underlayment: 0,
      starter: total_squares * pricing.materials.starter.price,
      ridge_caps: (measurements.length_measurements?.ridges?.length || 0) * pricing.materials.ridge_caps.price,
      drip_edge: (measurements.length_measurements?.drip_edge?.length || 0) * pricing.materials.drip_edge.price,
      additional: 0
    };

    // Calculate underlayment cost based on type
    switch (underlaymentType) {
      case UnderlaymentType.FELTBUSTER:
        costs.underlayment = total_squares * pricing.materials.underlayment.feltbuster.price;
        break;
      case UnderlaymentType.ICE_AND_WATER:
        costs.underlayment = total_squares * pricing.materials.underlayment.ice_and_water.price;
        break;
      case UnderlaymentType.BOTH:
        costs.underlayment = total_squares * (
          pricing.materials.underlayment.feltbuster.price * 0.7 +
          pricing.materials.underlayment.ice_and_water.price * 0.3
        );
        break;
    }

    // Calculate additional materials cost
    if (additionalMaterials.plywood_replacement) {
      costs.additional += total_squares * pricing.materials.plywood.price;
    }

    if (additionalMaterials.flat_roof_iso) {
      costs.additional += total_squares * pricing.materials.flat_roof_materials.iso.price;
      if (additionalMaterials.base_cap) {
        costs.additional += total_squares * pricing.materials.flat_roof_materials.base_cap.price;
      }
    }

    additionalMaterials.pipe_flashings.forEach(flashing => {
      costs.additional += pricing.materials.pipe_flashings[
        flashing.size === '2"' ? 'two_inch' : 'three_inch'
      ].price * flashing.quantity;
    });

    additionalMaterials.vents.forEach(vent => {
      const ventPrice = pricing.materials.vents[
        vent.type === VentType.GOOSENECK_4 ? 'gooseneck_4' :
        vent.type === VentType.GOOSENECK_10 ? 'gooseneck_10' : 'off_ridge'
      ].price;
      costs.additional += ventPrice * vent.quantity;
    });

    return costs;
  };

  const costs = calculateMaterialCosts();
  const totalMaterialCost = Object.values(costs).reduce((sum, cost) => sum + cost, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pricing Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Materials</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>Shingles:</div>
              <div className="text-right">${costs.shingles.toFixed(2)}</div>
              <div>Underlayment:</div>
              <div className="text-right">${costs.underlayment.toFixed(2)}</div>
              <div>Starter:</div>
              <div className="text-right">${costs.starter.toFixed(2)}</div>
              <div>Ridge Caps:</div>
              <div className="text-right">${costs.ridge_caps.toFixed(2)}</div>
              <div>Drip Edge:</div>
              <div className="text-right">${costs.drip_edge.toFixed(2)}</div>
              {costs.additional > 0 && (
                <>
                  <div>Additional Materials:</div>
                  <div className="text-right">${costs.additional.toFixed(2)}</div>
                </>
              )}
              <div className="font-semibold">Total Materials:</div>
              <div className="text-right font-semibold">${totalMaterialCost.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 