import { RoofMeasurements, Estimate } from "@/types/estimate";

const API_BASE_URL = "http://localhost:8000/api";

export async function processPdfReport(file: File): Promise<RoofMeasurements> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/reports/process/`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to process PDF report");
  }

  return response.json();
}

export async function generateEstimate(
  measurements: RoofMeasurements,
  profitMargin: number
): Promise<Estimate> {
  const response = await fetch(`${API_BASE_URL}/estimates/generate/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ measurements, profitMargin }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate estimate");
  }

  return response.json();
}