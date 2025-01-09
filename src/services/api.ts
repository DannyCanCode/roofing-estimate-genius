// Import necessary modules and types
import { RoofMeasurements } from '../types/estimate';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function processPdfReport(fileUrl: string): Promise<RoofMeasurements> {
  try {
    const response = await fetch(`${API_URL}/api/process-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ file_url: fileUrl }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to process PDF report');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error processing PDF report:', error);
    throw error;
  }
}

// Other existing functions remain unchanged...
