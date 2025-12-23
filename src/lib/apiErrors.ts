import { NextResponse } from 'next/server';

/**
 * API Error Codes for consistent error tracking
 */
export enum ApiErrorCode {
  VALIDATION_ERROR = 'E001',
  NOT_FOUND = 'E002',
  RATE_LIMITED = 'E003',
  EXTERNAL_API_ERROR = 'E004',
  AUTH_REQUIRED = 'E005',
  CONFIG_MISSING = 'E006',
  INTERNAL_ERROR = 'E500'
}

/**
 * Standard API error response structure
 */
interface ApiErrorResponse {
  success: false;
  error: string;
  code: ApiErrorCode;
}

/**
 * Standard API success response structure
 */
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  message: string,
  code: ApiErrorCode,
  status: number = 500
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    { success: false, error: message, code },
    { status }
  );
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(data: T): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ success: true, data });
}

/**
 * Validation error helper
 */
export function validationError(message: string): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, ApiErrorCode.VALIDATION_ERROR, 400);
}

/**
 * Not found error helper
 */
export function notFoundError(message: string): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, ApiErrorCode.NOT_FOUND, 404);
}

/**
 * External API error helper
 */
export function externalApiError(service: string): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    `Unable to fetch data from ${service}. Please try again later.`,
    ApiErrorCode.EXTERNAL_API_ERROR,
    503
  );
}

/**
 * Internal error helper
 */
export function internalError(message: string = 'An unexpected error occurred. Please try again.'): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, ApiErrorCode.INTERNAL_ERROR, 500);
}

// ============ Validation Helpers ============

/**
 * Validate that a required field is present
 */
export function validateRequired(value: unknown, fieldName: string): string | null {
  if (value === null || value === undefined || value === '') {
    return `${fieldName} is required.`;
  }
  return null;
}

/**
 * Validate that a value is a positive number within range
 */
export function validatePositiveNumber(
  value: unknown,
  fieldName: string,
  min: number = 1,
  max: number = Infinity
): string | null {
  const num = Number(value);
  if (isNaN(num)) {
    return `${fieldName} must be a valid number.`;
  }
  if (num < min || num > max) {
    if (max === Infinity) {
      return `${fieldName} must be at least ${min}.`;
    }
    return `${fieldName} must be between ${min} and ${max}.`;
  }
  return null;
}

/**
 * Validate that a value is one of the allowed values
 */
export function validateEnum(
  value: unknown,
  validValues: readonly string[],
  fieldName: string
): string | null {
  if (!validValues.includes(value as string)) {
    return `Invalid ${fieldName}. Valid options: ${validValues.join(', ')}`;
  }
  return null;
}

/**
 * Validate that a value is a non-empty array
 */
export function validateArray(
  value: unknown,
  fieldName: string,
  minLength: number = 1
): string | null {
  if (!Array.isArray(value)) {
    return `${fieldName} must be an array.`;
  }
  if (value.length < minLength) {
    return `${fieldName} must have at least ${minLength} item${minLength > 1 ? 's' : ''}.`;
  }
  return null;
}

/**
 * Run multiple validations and return the first error, or null if all pass
 */
export function runValidations(...validations: (string | null)[]): string | null {
  for (const error of validations) {
    if (error !== null) {
      return error;
    }
  }
  return null;
}

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

/**
 * Parse and validate a numeric query parameter
 */
export function parseNumericParam(
  value: string | null,
  defaultValue: number,
  min?: number,
  max?: number
): number {
  if (!value) return defaultValue;
  const num = parseInt(value, 10);
  if (isNaN(num)) return defaultValue;
  if (min !== undefined && num < min) return min;
  if (max !== undefined && num > max) return max;
  return num;
}
