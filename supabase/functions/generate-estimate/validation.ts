import { EstimateParams } from './types.ts';

export function validateEstimateParams(params: any): EstimateParams {
  console.log('Validating estimate parameters:', params);
  
  if (!params) {
    throw new Error('No parameters provided');
  }

  if (!params.measurements?.totalArea || typeof params.measurements.totalArea !== 'number') {
    throw new Error('Invalid or missing measurements.totalArea');
  }

  if (!params.roofingCategory || typeof params.roofingCategory !== 'string') {
    throw new Error('Invalid or missing roofingCategory');
  }

  if (typeof params.profitMargin !== 'number' || params.profitMargin < 0) {
    throw new Error('Invalid or missing profitMargin');
  }

  if (!Array.isArray(params.measurements.pitchBreakdown)) {
    params.measurements.pitchBreakdown = [{ pitch: '4/12', area: params.measurements.totalArea }];
  }

  return params as EstimateParams;
}