interface Measurements {
  total_area: number;
  predominant_pitch: string;
  suggested_waste_percentage: number;
}

export class MeasurementsValidator {
  validate(measurements: Measurements): boolean {
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

    return true;
  }
}