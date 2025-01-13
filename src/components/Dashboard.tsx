import React, { useState } from 'react';
import { PDFUploader } from './PDFUploader';
import { DashboardMetrics } from './DashboardMetrics';
import { RecentEstimates } from './RecentEstimates';
import { EstimatesBarGraph } from './EstimatesBarGraph';
import { EstimateGenerator } from './EstimateGenerator';
import { RoofMeasurements } from '@/types/estimate';

export function Dashboard() {
  const [measurements, setMeasurements] = useState<RoofMeasurements | null>(null);

  const handlePDFProcessed = (data: RoofMeasurements) => {
    setMeasurements(data);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="space-y-4">
          <PDFUploader onProcessed={handlePDFProcessed} />
          {measurements && <EstimateGenerator measurements={measurements} />}
        </div>
        <div className="space-y-4">
          <DashboardMetrics />
          <EstimatesBarGraph />
        </div>
      </div>
      <RecentEstimates />
    </div>
  );
} 