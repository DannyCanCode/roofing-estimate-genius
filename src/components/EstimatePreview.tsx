import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RoofMeasurements, PricingConfig, AdditionalMaterials, UnderlaymentType } from '@/types/estimate';
import { Slider } from '@/components/ui/slider';

interface EstimatePreviewProps {
  measurements: RoofMeasurements;
  pricing: PricingConfig;
  additionalMaterials: AdditionalMaterials;
  underlaymentType: UnderlaymentType;
  onGeneratePDF: () => Promise<void>;
}

type LengthMeasurementKey = keyof NonNullable<RoofMeasurements['length_measurements']>;

export function EstimatePreview({ measurements, pricing, additionalMaterials, underlaymentType, onGeneratePDF }: EstimatePreviewProps) {
  const formatLengthMeasurement = (key: LengthMeasurementKey) => {
    const measurement = measurements.length_measurements?.[key];
    if (measurement) {
      return `${measurement.length} ft (${measurement.count} ${measurement.count > 1 ? 'pieces' : 'piece'})`;
    }
    return `${measurements[key as keyof RoofMeasurements] || 0} ft`;
  };

  // Calculate material quantities
  const totalSquares = measurements.total_squares || (measurements.total_area / 100);
  const ridgeLength = measurements.length_measurements?.ridges?.length || 0;
  const valleyLength = measurements.length_measurements?.valleys?.length || 0;
  const eaveLength = measurements.length_measurements?.eaves?.length || 0;
  const rakeLength = measurements.length_measurements?.rakes?.length || 0;
  const flashingLength = measurements.length_measurements?.flashing?.length || 0;
  const stepFlashingLength = measurements.length_measurements?.step_flashing?.length || 0;

  // Calculate costs
  const shinglesCost = totalSquares * pricing.materials.shingles.price;
  const underlaymentCost = totalSquares * (
    underlaymentType === UnderlaymentType.FELTBUSTER ? pricing.materials.underlayment.feltbuster.price :
    underlaymentType === UnderlaymentType.ICE_AND_WATER ? pricing.materials.underlayment.ice_and_water.price :
    pricing.materials.underlayment.feltbuster.price + pricing.materials.underlayment.ice_and_water.price
  );
  const ridgeCapsCost = ridgeLength * pricing.materials.ridge_caps.price;
  const dripEdgeCost = eaveLength * pricing.materials.drip_edge.price;

  // Calculate labor based on pitch
  const pitch = measurements.predominant_pitch ? parseInt(measurements.predominant_pitch.split('/')[0]) : 6;
  const laborMultiplier = pitch <= 7 ? 1 : pitch <= 9 ? 1.2 : pitch <= 12 ? 1.5 : 2;
  const laborCost = totalSquares * pricing.labor.base_installation.price * laborMultiplier;

  // Total cost
  const totalCost = shinglesCost + underlaymentCost + ridgeCapsCost + dripEdgeCost + laborCost;

  const [profitMargin, setProfitMargin] = useState(20);

  return (
    <div className="space-y-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Estimate Preview</CardTitle>
          <p className="text-sm text-gray-500">Review extracted measurements, material costs, and labor charges for your roofing project.</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Extracted Measurements Table */}
            <div>
              <h3 className="text-base font-semibold mb-4">Extracted Measurements</h3>
              <div className="bg-white border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Measurement Type</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Value</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {/* Area Measurements */}
                    <tr>
                      <td className="px-4 py-3 text-sm">Total Area</td>
                      <td className="px-4 py-3 text-sm font-medium">{measurements.total_area} sq ft</td>
                      <td className="px-4 py-3 text-sm">
                        {measurements.total_area ? '✅ Complete' : '❌ Missing'}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm">Total Squares</td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {measurements.total_squares || (measurements.total_area / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm">✅ Complete</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm">Predominant Pitch</td>
                      <td className="px-4 py-3 text-sm font-medium">{measurements.predominant_pitch || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm">
                        {measurements.predominant_pitch ? '✅ Complete' : '❌ Missing'}
                      </td>
                    </tr>

                    {/* Length Measurements */}
                    {/* Check for ridges */}
                    <tr>
                      <td className="px-4 py-3 text-sm">Ridges</td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {measurements.length_measurements?.ridges 
                          ? `${measurements.length_measurements.ridges.length} ft (${measurements.length_measurements.ridges.count} ${measurements.length_measurements.ridges.count > 1 ? 'pieces' : 'piece'})`
                          : measurements.ridges
                          ? `${measurements.ridges} ft`
                          : 'N/A'
                        }
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {(measurements.length_measurements?.ridges || measurements.ridges) ? '✅ Complete' : '❌ Missing'}
                      </td>
                    </tr>

                    {/* Check for valleys */}
                    <tr>
                      <td className="px-4 py-3 text-sm">Valleys</td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {measurements.length_measurements?.valleys 
                          ? `${measurements.length_measurements.valleys.length} ft (${measurements.length_measurements.valleys.count} ${measurements.length_measurements.valleys.count > 1 ? 'pieces' : 'piece'})`
                          : measurements.valleys
                          ? `${measurements.valleys} ft`
                          : 'N/A'
                        }
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {(measurements.length_measurements?.valleys || measurements.valleys) ? '✅ Complete' : '❌ Missing'}
                      </td>
                    </tr>

                    {/* Check for eaves */}
                    <tr>
                      <td className="px-4 py-3 text-sm">Eaves</td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {measurements.length_measurements?.eaves 
                          ? `${measurements.length_measurements.eaves.length} ft (${measurements.length_measurements.eaves.count} ${measurements.length_measurements.eaves.count > 1 ? 'pieces' : 'piece'})`
                          : measurements.eaves
                          ? `${measurements.eaves} ft`
                          : 'N/A'
                        }
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {(measurements.length_measurements?.eaves || measurements.eaves) ? '✅ Complete' : '❌ Missing'}
                      </td>
                    </tr>

                    {/* Check for rakes */}
                    <tr>
                      <td className="px-4 py-3 text-sm">Rakes</td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {measurements.length_measurements?.rakes 
                          ? `${measurements.length_measurements.rakes.length} ft (${measurements.length_measurements.rakes.count} ${measurements.length_measurements.rakes.count > 1 ? 'pieces' : 'piece'})`
                          : measurements.rakes
                          ? `${measurements.rakes} ft`
                          : 'N/A'
                        }
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {(measurements.length_measurements?.rakes || measurements.rakes) ? '✅ Complete' : '❌ Missing'}
                      </td>
                    </tr>

                    {/* Check for flashing */}
                    <tr>
                      <td className="px-4 py-3 text-sm">Flashing</td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {measurements.length_measurements?.flashing 
                          ? `${measurements.length_measurements.flashing.length} ft (${measurements.length_measurements.flashing.count} ${measurements.length_measurements.flashing.count > 1 ? 'pieces' : 'piece'})`
                          : measurements.flashing
                          ? `${measurements.flashing} ft`
                          : 'N/A'
                        }
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {(measurements.length_measurements?.flashing || measurements.flashing) ? '✅ Complete' : '❌ Missing'}
                      </td>
                    </tr>

                    {/* Check for step flashing */}
                    <tr>
                      <td className="px-4 py-3 text-sm">Step Flashing</td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {measurements.length_measurements?.step_flashing 
                          ? `${measurements.length_measurements.step_flashing.length} ft (${measurements.length_measurements.step_flashing.count} ${measurements.length_measurements.step_flashing.count > 1 ? 'pieces' : 'piece'})`
                          : measurements.step_flashing
                          ? `${measurements.step_flashing} ft`
                          : 'N/A'
                        }
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {(measurements.length_measurements?.step_flashing || measurements.step_flashing) ? '✅ Complete' : '❌ Missing'}
                      </td>
                    </tr>

                    {/* Penetrations */}
                    {measurements.penetrations !== undefined && (
                      <tr>
                        <td className="px-4 py-3 text-sm">Total Penetrations</td>
                        <td className="px-4 py-3 text-sm font-medium">{measurements.penetrations}</td>
                        <td className="px-4 py-3 text-sm">✅ Complete</td>
                      </tr>
                    )}
                    {measurements.penetrations_area !== undefined && (
                      <tr>
                        <td className="px-4 py-3 text-sm">Penetrations Area</td>
                        <td className="px-4 py-3 text-sm font-medium">{measurements.penetrations_area} sq ft</td>
                        <td className="px-4 py-3 text-sm">✅ Complete</td>
                      </tr>
                    )}
                    {measurements.penetrations_perimeter !== undefined && (
                      <tr>
                        <td className="px-4 py-3 text-sm">Penetrations Perimeter</td>
                        <td className="px-4 py-3 text-sm font-medium">{measurements.penetrations_perimeter} ft</td>
                        <td className="px-4 py-3 text-sm">✅ Complete</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Material Costs Table */}
            <div>
              <h3 className="text-base font-semibold mb-4">Material Costs</h3>
              <div className="bg-white border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Material</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Quantity Needed</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Price per Unit</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3 text-sm">GAF Timberline HDZ Shingles</td>
                      <td className="px-4 py-3 text-sm">{totalSquares.toFixed(2)} SQ</td>
                      <td className="px-4 py-3 text-sm">${pricing.materials.shingles.price.toFixed(2)}/SQ</td>
                      <td className="px-4 py-3 text-sm text-right font-medium">${shinglesCost.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm">Underlayment ({underlaymentType})</td>
                      <td className="px-4 py-3 text-sm">{totalSquares.toFixed(2)} SQ</td>
                      <td className="px-4 py-3 text-sm">
                        ${(underlaymentType === UnderlaymentType.FELTBUSTER 
                          ? pricing.materials.underlayment.feltbuster.price 
                          : pricing.materials.underlayment.ice_and_water.price).toFixed(2)}/SQ
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium">${underlaymentCost.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm">Ridge Caps</td>
                      <td className="px-4 py-3 text-sm">{ridgeLength.toFixed(2)} ft</td>
                      <td className="px-4 py-3 text-sm">${pricing.materials.ridge_caps.price.toFixed(2)}/ft</td>
                      <td className="px-4 py-3 text-sm text-right font-medium">${ridgeCapsCost.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm">Drip Edge</td>
                      <td className="px-4 py-3 text-sm">{eaveLength.toFixed(2)} ft</td>
                      <td className="px-4 py-3 text-sm">${pricing.materials.drip_edge.price.toFixed(2)}/ft</td>
                      <td className="px-4 py-3 text-sm text-right font-medium">${dripEdgeCost.toFixed(2)}</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td colSpan={3} className="px-4 py-3 text-sm font-semibold">Total Material Cost</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold">
                        ${(shinglesCost + underlaymentCost + ridgeCapsCost + dripEdgeCost).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Labor Costs Table */}
            <div>
              <h3 className="text-base font-semibold mb-4">Labor Costs</h3>
              <div className="bg-white border rounded-lg overflow-hidden">
                <table className="w-full table-fixed">
                  <colgroup>
                    <col className="w-[40%]" />
                    <col className="w-[20%]" />
                    <col className="w-[20%]" />
                    <col className="w-[20%]" />
                  </colgroup>
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Task</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Rate per Unit</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Units Needed</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3 text-sm truncate">Base Installation ({measurements.predominant_pitch} pitch)</td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">${pricing.labor.base_installation.price.toFixed(2)}/SQ</td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">{totalSquares.toFixed(2)} SQ</td>
                      <td className="px-4 py-3 text-sm text-right font-medium whitespace-nowrap pr-6">${laborCost.toFixed(2)}</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td colSpan={3} className="px-4 py-3 text-sm font-semibold">Total Labor Cost</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold whitespace-nowrap pr-6">${laborCost.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Project Summary */}
            <div className="border-t pt-8">
              <h3 className="text-base font-semibold mb-4">Project Summary</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Total Material Cost</span>
                      <span className="text-lg font-semibold">
                        ${(shinglesCost + underlaymentCost + ridgeCapsCost + dripEdgeCost).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Total Labor Cost</span>
                      <span className="text-lg font-semibold">${laborCost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Profit Margin Slider */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Profit Margin</span>
                      <span className="text-lg font-semibold text-blue-600">{profitMargin}%</span>
                    </div>
                    <Slider
                      defaultValue={[20]}
                      max={50}
                      step={1}
                      className="w-full"
                      onValueChange={(values: number[]) => setProfitMargin(values[0])}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>0%</span>
                      <span>25%</span>
                      <span>50%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-6 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-lg font-semibold text-blue-900">Grand Total</span>
                      <span className="text-sm text-blue-700 ml-2">(with {profitMargin}% margin)</span>
                    </div>
                    <span className="text-3xl font-bold text-blue-900">
                      ${(totalCost * (1 + profitMargin / 100)).toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={onGeneratePDF}
                  className="w-full mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
                >
                  Generate PDF Estimate
                </button>
              </div>
            </div>

            {/* PDF Parsing Details */}
            {measurements.debug_info && (
              <div className="border-t pt-8">
                <h3 className="text-base font-semibold mb-4">PDF Parsing Details</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div>
                    <span className="text-sm font-medium">Method: </span>
                    <span className="text-sm text-gray-600">{measurements.debug_info.extraction_method}</span>
                  </div>
                  {measurements.debug_info.error && (
                    <div className="text-red-600 text-sm">
                      <span className="font-medium">Error: </span>
                      {measurements.debug_info.error}
                    </div>
                  )}
                  {measurements.debug_info.tables_found !== undefined && (
                    <div>
                      <span className="text-sm font-medium">Tables Found: </span>
                      <span className="text-sm text-gray-600">{measurements.debug_info.tables_found}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Areas by Pitch */}
            {measurements.areas_per_pitch && measurements.areas_per_pitch.length > 0 && (
              <div className="border-t pt-8">
                <h3 className="text-base font-semibold mb-4">Areas by Pitch</h3>
                <div className="bg-white border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Pitch</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Area</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Percentage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {measurements.areas_per_pitch.map((detail, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm font-medium">{detail.pitch} pitch</td>
                          <td className="px-4 py-3 text-sm">{detail.area} sq ft</td>
                          <td className="px-4 py-3 text-sm text-right">{detail.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 