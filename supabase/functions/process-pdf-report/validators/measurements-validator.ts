import { RoofMeasurements } from '../types/measurements';

export class MeasurementsValidator {
  validate(measurements: RoofMeasurements): boolean {
    console.log('Validating measurements:', measurements);

    if (!this.validateTotalArea(measurements.total_area)) {
      return false;
    }

    if (!this.validatePitch(measurements.pitch)) {
      return false;
    }

    // Additional validations that don't fail but warn
    this.validatePenetrations(measurements);
    this.validateLengths(measurements);

    console.log('Measurements validation passed');
    return true;
  }

  private validateTotalArea(area: number): boolean {
    if (!area && area !== 0) {
      console.error('Total area is missing');
      return false;
    }

    if (isNaN(area)) {
      console.error('Invalid total area value:', area);
      return false;
    }

    if (area <= 0) {
      console.warn('Warning: Total area is zero or negative:', area);
    }

    return true;
  }

  private validatePitch(pitch: number): boolean {
    if (pitch && isNaN(pitch)) {
      console.error('Invalid pitch value:', pitch);
      return false;
    }

    if (pitch && (pitch <= 0 || pitch > 45)) {
      console.warn('Unusual pitch value:', pitch);
    }

    return true;
  }

  private validatePenetrations(measurements: RoofMeasurements): void {
    if (measurements.total_penetrations && measurements.total_penetrations < 0) {
      console.warn('Warning: Negative number of penetrations');
    }
  }

  private validateLengths(measurements: RoofMeasurements): void {
    const lengths = [
      measurements.ridges_length,
      measurements.valleys_length,
      measurements.rakes_length,
      measurements.eaves_length
    ];

    lengths.forEach(length => {
      if (length && length < 0) {
        console.warn('Warning: Negative length value:', length);
      }
    });
  }
}