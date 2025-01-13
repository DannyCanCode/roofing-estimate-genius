import { RoofMeasurements } from "@/types/estimate";

export const processPdfFile = async (
  file: File,
  profitMargin: number,
  roofingType: string
): Promise<{ measurements: RoofMeasurements }> => {
  console.log('Processing PDF file:', file.name);

  try {
    // Create form data
    const formData = new FormData();
    formData.append('file', file);

    // Send to Python backend
    const response = await fetch('http://localhost:3001/api/process-pdf', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to process PDF');
    }

    const data = await response.json();
    return { measurements: data };
  } catch (error) {
    console.error('Error in processPdfFile:', error);
    throw error;
  }
};