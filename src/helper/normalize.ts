import { BadRequestException } from '@nestjs/common';

export function normalizeRequiredText(
  value: unknown,
  field: string,
  maxLength: number,
): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new BadRequestException(`${field} is required`);
  }

  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new BadRequestException(
      `${field} must be at most ${maxLength} characters`,
    );
  }

  return normalized;
}

export function normalizeOptionalText(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    throw new BadRequestException('Optional text fields must be strings');
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function normalizeDisplayOrder(value: unknown): number {
  if (value === undefined || value === null) {
    return 0;
  }

  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new BadRequestException('displayOrder must be an integer');
  }

  return value;
}

export function normalizePrice(value: unknown): string {
  const numericValue =
    typeof value === 'string' && value.trim() !== '' ? Number(value) : value;

  if (
    typeof numericValue !== 'number' ||
    !Number.isFinite(numericValue) ||
    numericValue < 0
  ) {
    throw new BadRequestException('price must be a non-negative number');
  }

  return numericValue.toFixed(2);
}

export function normalizeBoolean(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') {
    throw new BadRequestException(`${field} must be a boolean`);
  }

  return value;
}

export function normalizeValidHours(value: unknown): number | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new BadRequestException('validHours must be a positive integer');
  }

  return value;
}

export function normalizeNullablePositiveInteger(
  value: unknown,
  field: string,
): number | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new BadRequestException(`${field} must be a positive integer`);
  }

  return value;
}
