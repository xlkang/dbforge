import { describe, it, expect } from 'vitest';
import { ApiError } from '../../lib/api';

describe('ApiError', () => {
  it('should create ApiError with message', () => {
    const error = new ApiError('Test error');
    expect(error.message).toBe('Test error');
    expect(error.name).toBe('ApiError');
  });

  it('should create ApiError with status', () => {
    const error = new ApiError('Not found', 404);
    expect(error.status).toBe(404);
  });

  it('should create ApiError with code', () => {
    const error = new ApiError('Error', 500, 'INTERNAL_ERROR');
    expect(error.code).toBe('INTERNAL_ERROR');
  });
});
