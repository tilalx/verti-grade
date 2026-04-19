import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const pocketbaseInstances: Array<{ url: string }> = [];
const PocketBaseMock = vi.fn(function (url: string) {
  const instance = { url };
  pocketbaseInstances.push(instance);
  return instance;
});

vi.mock('pocketbase', () => ({
  default: PocketBaseMock,
}));

const originalNodeEnv = process.env.NODE_ENV;

describe('usePocketbase', () => {
  beforeEach(() => {
    vi.resetModules();
    PocketBaseMock.mockClear();
    pocketbaseInstances.length = 0;
    delete (globalThis as Record<string, unknown>)._pb;
    process.server = false;
    process.env.NODE_ENV = 'development';
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('creates a new PocketBase instance on the server in development', async () => {
    process.server = true;
    const { usePocketbase } = await import('~/composables/pocketbase.js');

    const instance = usePocketbase();

    expect(PocketBaseMock).toHaveBeenCalledTimes(1);
    expect(PocketBaseMock).toHaveBeenCalledWith('http://localhost:8090');
    expect(instance).toEqual({ url: 'http://localhost:8090' });
    expect((globalThis as Record<string, unknown>)._pb).toBeUndefined();
  });

  it('creates a new PocketBase instance on the server in production', async () => {
    process.server = true;
    process.env.NODE_ENV = 'production';
    const { usePocketbase } = await import('~/composables/pocketbase.js');

    usePocketbase();

    expect(PocketBaseMock).toHaveBeenCalledWith('http://localhost:8080');
  });

  it('reuses the same client-side instance after the first call', async () => {
    const { usePocketbase } = await import('~/composables/pocketbase.js');

    const first = usePocketbase();
    const second = usePocketbase();

    expect(PocketBaseMock).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
    expect(first).toEqual({ url: 'http://localhost:8090' });
  });

  it('uses the public root url on the client in production builds', async () => {
    process.env.NODE_ENV = 'production';
    const { usePocketbase } = await import('~/composables/pocketbase.js');

    usePocketbase();

    expect(PocketBaseMock).toHaveBeenCalledWith('/');
  });
});
