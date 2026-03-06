import { describe, it, expect } from 'vitest';
import { formatSQL } from '../../lib/sqlFormatter';

describe('sqlFormatter', () => {
  it('should format simple SELECT', () => {
    const result = formatSQL('select * from users');
    expect(result).toContain('SELECT');
  });

  it('should format INSERT statement', () => {
    const result = formatSQL('insert into users(name,email) values("test","test@test.com")');
    expect(result).toContain('INSERT INTO');
  });

  it('should handle empty string', () => {
    const result = formatSQL('');
    expect(result).toBe('');
  });
});
