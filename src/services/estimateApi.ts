const API_BASE_URL = "http://localhost:8000"; // Update this with your Django backend URL

export interface EstimateRequest {
  roofing_type: string;
  pitch: string;
  total_area: number;
}

export interface EstimateResponse {
  estimate: number;
  special_requirements: string[];
}

export async function calculateEstimate(params: EstimateRequest): Promise<EstimateResponse> {
  const response = await fetch(`${API_BASE_URL}/api/calculate-estimate/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to calculate estimate");
  }

  return response.json();
}