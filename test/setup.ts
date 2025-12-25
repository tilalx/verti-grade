import { beforeEach, vi } from 'vitest';
import { ref as vueRef } from 'vue';

type VitestMock = ReturnType<typeof vi.fn>;
type RuntimeConfig = { public?: Record<string, unknown> };

declare global {
  namespace NodeJS {
    interface Process {
      server?: boolean;
    }
  }
  var __POCKETBASE_CLIENT__: unknown | undefined;
  var __NUXT_RUNTIME_CONFIG__: Record<string, unknown> | undefined;
  var $fetch: VitestMock;
  var useRuntimeConfig: () => RuntimeConfig;
  var usePocketbase: () => unknown;
  var useI18n: () => { t: (key: string) => string };
  var ref: typeof vueRef;
}

const defaultRuntimeConfig = {
  public: {
    appVersion: '0.0.0',
  },
};

const runtimeConfigGetter = () =>
  ((globalThis.__NUXT_RUNTIME_CONFIG__ as RuntimeConfig) ??
    defaultRuntimeConfig);
const pocketbaseGetter = () => {
  if (!globalThis.__POCKETBASE_CLIENT__) {
    throw new Error('PocketBase mock not configured');
  }
  return globalThis.__POCKETBASE_CLIENT__;
};
const i18nGetter = () => ({
  t: (key: string) => key,
});

vi.stubGlobal('useRuntimeConfig', runtimeConfigGetter);
vi.stubGlobal('usePocketbase', pocketbaseGetter);
vi.stubGlobal('useI18n', i18nGetter);
if (!('ref' in globalThis)) {
  vi.stubGlobal('ref', vueRef);
} else {
  globalThis.ref = vueRef;
}

beforeEach(() => {
  process.server = false;
  delete (globalThis as Record<string, unknown>)._pb;
  globalThis.__POCKETBASE_CLIENT__ = undefined;
  globalThis.__NUXT_RUNTIME_CONFIG__ = undefined;
  if (!('$fetch' in globalThis)) {
    vi.stubGlobal('$fetch', vi.fn());
  } else {
    globalThis.$fetch.mockReset();
  }
});
