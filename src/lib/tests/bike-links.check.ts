/**
 * Note: This file contains logic used by automated Playwright scripts 
 * to verify bike model links. It is not a standard Vitest file to avoid 
 * conflicts with @playwright/test in the main build graph.
 */
export const BIKE_MODEL_BASE_PATH = '/bike-models/';
export const NOT_FOUND_TEXT = 'Bike model not found';

export interface LinkCheckResult {
  href: string;
  passed: boolean;
  error?: string;
}
