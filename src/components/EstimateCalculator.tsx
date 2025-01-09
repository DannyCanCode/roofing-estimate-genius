import React from 'react';
import { RoofMeasurements } from '../types/estimate';

interface Props {
  measurements: RoofMeasurements;
}

export const EstimateCalculator: React.FC<Props> = ({ measurements }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Roof Measurements</h2>
      
      {/* Main Measurements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-gray-50 rounded">
          <h3 className="font-semibold text-lg mb-2">Total Area</h3>
          <p className="text-xl">{measurements.total_area.toLocaleString()} sq ft</p>
        </div>
        <div className="p-4 bg-gray-50 rounded">
          <h3 className="font-semibold text-lg mb-2">Predominant Pitch</h3>
          <p className="text-xl">{measurements.predominant_pitch}</p>
        </div>
      </div>

      {/* Length Measurements */}
      <div className="mb-6">
        <h3 className="font-semibold text-lg mb-3">Length Measurements</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-gray-50 rounded">
            <p className="font-medium">Ridges</p>
            <p>{measurements.ridges} ft</p>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <p className="font-medium">Hips</p>
            <p>{measurements.hips} ft</p>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <p className="font-medium">Valleys</p>
            <p>{measurements.valleys} ft</p>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <p className="font-medium">Rakes</p>
            <p>{measurements.rakes} ft</p>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <p className="font-medium">Eaves</p>
            <p>{measurements.eaves} ft</p>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <p className="font-medium">Flashing</p>
            <p>{measurements.flashing} ft</p>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <p className="font-medium">Step Flashing</p>
            <p>{measurements.step_flashing} ft</p>
          </div>
        </div>
      </div>

      {/* Pitch Details */}
      {measurements.pitch_details.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-3">Pitch Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {measurements.pitch_details.map((detail, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded">
                <p className="font-medium">{detail.pitch} pitch</p>
                <p>{detail.area.toLocaleString()} sq ft</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Facets */}
      {measurements.facets.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-3">Roof Sections</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {measurements.facets.map((facet) => (
              <div key={facet.number} className="p-3 bg-gray-50 rounded">
                <p className="font-medium">Section {facet.number}</p>
                <p>{facet.area.toLocaleString()} sq ft</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Waste Factor */}
      <div className="mt-6 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold text-lg mb-2">Suggested Waste Factor</h3>
        <p className="text-xl">{measurements.suggested_waste_percentage}%</p>
        <p className="text-sm text-gray-600 mt-1">
          Additional materials needed to account for waste during installation
        </p>
      </div>
    </div>
  );
}; 