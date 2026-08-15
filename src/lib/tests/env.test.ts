import { describe, it, expect, vi } from 'vitest';
import { getEnvironment } from '../env';

describe('Environment Detection Logic', () => {
  const originalWindow = global.window;

  it('should detect production for the custom domain', () => {
    vi.stubGlobal('window', { location: { hostname: 'customzparadisebd.com' } });
    expect(getEnvironment()).toBe('production');
  });

  it('should detect production for the www custom domain', () => {
    vi.stubGlobal('window', { location: { hostname: 'www.customzparadisebd.com' } });
    expect(getEnvironment()).toBe('production');
  });

  it('should detect production when VITE_APP_ENV is production', () => {
    vi.stubGlobal('window', { location: { hostname: 'localhost' } });
    // @ts-ignore
    import.meta.env.VITE_APP_ENV = 'production';
    expect(getEnvironment()).toBe('production');
    // Reset
    // @ts-ignore
    import.meta.env.VITE_APP_ENV = undefined;
  });

  it('should detect staging for localhost', () => {
    vi.stubGlobal('window', { location: { hostname: 'localhost' } });
    expect(getEnvironment()).toBe('staging');
  });

  it('should detect staging for lovable preview domains', () => {
    vi.stubGlobal('window', { location: { hostname: 'id-preview--53ff4892.lovable.app' } });
    expect(getEnvironment()).toBe('staging');
  });

  it('should default to staging for unknown domains', () => {
    vi.stubGlobal('window', { location: { hostname: 'random-test-domain.com' } });
    expect(getEnvironment()).toBe('staging');
  });
});
