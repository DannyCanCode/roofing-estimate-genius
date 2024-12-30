import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { FileUpload } from "@/components/FileUpload";
import { ProfitMarginSlider } from "@/components/ProfitMarginSlider";
import { EstimatePreview } from "@/components/EstimatePreview";
import { DashboardMetrics } from "@/components/DashboardMetrics";
import { RecentEstimates } from "@/components/RecentEstimates";
import { EstimateCharts } from "@/components/EstimateCharts";
import { processPdfReport, generateEstimate } from "@/services/api";
import { RoofMeasurements, Estimate } from "@/types/estimate";
import { useToast } from "@/hooks/use-toast";

export default function Index() {
  const [measurements, setMeasurements] = useState<RoofMeasurements | null>(null);
  const [profitMargin, setProfitMargin] = useState(25);
  const { toast } = useToast();

  const processPdfMutation = useMutation({
    mutationFn: processPdfReport,
    onSuccess: (data) => {
      setMeasurements(data);
      toast({
        title: "PDF Processed Successfully",
        description: "Your roof measurements have been extracted.",
      });
    },
    onError: () => {
      toast({
        title: "Error Processing PDF",
        description: "Failed to process the PDF report. Please try again.",
        variant: "destructive",
      });
    },
  });

  const estimateQuery = useQuery({
    queryKey: ["estimate", measurements, profitMargin],
    queryFn: () => generateEstimate(measurements!, profitMargin),
    enabled: !!measurements,
  });

  const handleFileUpload = (file: File) => {
    processPdfMutation.mutate(file);
  };

  const handleExportPdf = () => {
    toast({
      title: "Export Started",
      description: "Your estimate PDF is being generated...",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              3MG Roofing Dashboard
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Generate and manage roofing estimates
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <DashboardMetrics />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <EstimateCharts />
          </div>

          <div className="space-y-6">
            <RecentEstimates />
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {!measurements && (
                <FileUpload
                  onFileAccepted={handleFileUpload}
                  isProcessing={processPdfMutation.isPending}
                />
              )}

              {measurements && estimateQuery.data && (
                <EstimatePreview
                  items={[
                    ...estimateQuery.data.materials.map((m) => ({
                      description: m.name,
                      quantity: m.quantity,
                      unit: m.unit,
                      unitPrice: m.basePrice * (1 + profitMargin / 100),
                      total: m.basePrice * m.quantity * (1 + profitMargin / 100),
                    })),
                    ...estimateQuery.data.labor.map((l) => ({
                      description: `Labor (${l.pitch})`,
                      quantity: l.area,
                      unit: "SQ",
                      unitPrice: l.rate,
                      total: l.rate * l.area,
                    })),
                  ]}
                  totalPrice={estimateQuery.data.totalPrice}
                  onExportPdf={handleExportPdf}
                />
              )}
            </div>

            <div className="space-y-6">
              {measurements && (
                <ProfitMarginSlider
                  value={profitMargin}
                  onChange={setProfitMargin}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}