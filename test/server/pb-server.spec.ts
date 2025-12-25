import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const PocketBaseMock = vi.fn(function (url: string) {
  return { url };
});

vi.mock('pocketbase', () => ({
  default: PocketBaseMock,
}));

const originalNodeEnv = process.env.NODE_ENV;

describe('createPocketBase', () => {
  beforeEach(() => {
    vi.resetModules();
    PocketBaseMock.mockClear();
    process.env.NODE_ENV = 'development';
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('uses the local development URL', async () => {
    const { createPocketBase } = await import('../../server/utils/pb-server.js');

    const instance = createPocketBase();

    expect(PocketBaseMock).toHaveBeenCalledWith('http://localhost:8090');
    expect(instance).toEqual({ url: 'http://localhost:8090' });
  });

  it('points to the container URL in production', async () => {
    process.env.NODE_ENV = 'production';
    const { createPocketBase } = await import('../../server/utils/pb-server.js');

    createPocketBase();

    expect(PocketBaseMock).toHaveBeenCalledWith('http://pb:8080');
  });
});
