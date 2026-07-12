import { beforeEach, vi } from 'vitest';
import {
  ref as vueRef,
  onMounted as vueOnMounted,
  onBeforeUnmount as vueOnBeforeUnmount,
  watch as vueWatch,
} from 'vue';
import { useVersionCheck } from '~/composables/useVersionCheck';

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
  var onMounted: typeof vueOnMounted;
  var onBeforeUnmount: typeof vueOnBeforeUnmount;
  var watch: typeof vueWatch;
  var useState: <T>(key: string, init?: () => T) => { value: T };
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

// Shared key/value store backing the useState() Nuxt auto-import stub;
// cleared each test so state doesn't leak between specs.
const useStateMocks: Record<string, { value: unknown }> = {};
const useStateGetter = <T>(key: string, init?: () => T) => {
  if (!useStateMocks[key]) {
    useStateMocks[key] = vueRef(init ? init() : undefined);
  }
  return useStateMocks[key] as { value: T };
};

vi.stubGlobal('useRuntimeConfig', runtimeConfigGetter);
vi.stubGlobal('usePocketbase', pocketbaseGetter);
vi.stubGlobal('useI18n', i18nGetter);
vi.stubGlobal('useState', useStateGetter);
vi.stubGlobal('useVersionCheck', useVersionCheck);
if (!('ref' in globalThis)) {
  vi.stubGlobal('ref', vueRef);
} else {
  globalThis.ref = vueRef;
}
if (!('onMounted' in globalThis)) {
  vi.stubGlobal('onMounted', vueOnMounted);
} else {
  globalThis.onMounted = vueOnMounted;
}
if (!('onBeforeUnmount' in globalThis)) {
  vi.stubGlobal('onBeforeUnmount', vueOnBeforeUnmount);
} else {
  globalThis.onBeforeUnmount = vueOnBeforeUnmount;
}
if (!('watch' in globalThis)) {
  vi.stubGlobal('watch', vueWatch);
} else {
  globalThis.watch = vueWatch;
}

beforeEach(() => {
  process.server = false;
  delete (globalThis as Record<string, unknown>)._pb;
  globalThis.__POCKETBASE_CLIENT__ = undefined;
  globalThis.__NUXT_RUNTIME_CONFIG__ = undefined;
  for (const key of Object.keys(useStateMocks)) {
    delete useStateMocks[key];
  }
  if (!('$fetch' in globalThis)) {
    vi.stubGlobal('$fetch', vi.fn());
  } else {
    globalThis.$fetch.mockReset();
  }
});
