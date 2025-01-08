import React from 'react';
import Header from '@/components/Header';
import { DashboardMetrics } from '@/components/DashboardMetrics';
import { RecentEstimates } from '@/components/RecentEstimates';
import { EstimateCharts } from '@/components/EstimateCharts';
import { EstimateCalculatorForm } from '@/components/EstimateCalculatorForm';
import EstimateGenerator from '@/components/EstimateGenerator';
import { PDFUploader } from '@/components/PDFUploader';

export default function Index() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <Header />

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <DashboardMetrics />
          </div>

          <div className="space-y-6">
            <PDFUploader />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <EstimateCharts />
          </div>

          <div className="space-y-6">
            <RecentEstimates />
          </div>

          <EstimateGenerator />

          <div className="space-y-6">
            <EstimateCalculatorForm />
          </div>
        </div>
      </div>
    </div>
  );
}