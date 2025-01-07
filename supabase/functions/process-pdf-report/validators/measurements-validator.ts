import { RoofMeasurements } from '../types/measurements.ts';

export class MeasurementsValidator {
  validate(measurements: RoofMeasurements): boolean {
    console.log('Validating measurements:', measurements);

    if (!measurements.total_area || measurements.total_area <= 0) {
      console.error('Invalid total area:', measurements.total_area);
      return false;
    }

    if (!measurements.predominant_pitch) {
      console.error('Missing predominant pitch');
      return false;
    }

    if (typeof measurements.suggested_waste_percentage !== 'number') {
      console.error('Invalid waste percentage:', measurements.suggested_waste_percentage);
      return false;
    }

    console.log('Measurements validation passed');
    return true;
  }
}