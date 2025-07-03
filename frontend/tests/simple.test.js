import { describe, it, expect } from 'vitest';

describe('Simple Working Test', () => {
  it('should pass basic arithmetic', () => {
    expect(2 + 2).toBe(4);
  });

  it('should handle string concatenation', () => {
    expect('hello' + ' world').toBe('hello world');
  });
});
