// Stub for Nuxt's `#imports` virtual module.
// Only exports what is actually used in production code under test.
// Delegates to the globals already set up in test/setup.ts so that
// per-test configuration (e.g. __POCKETBASE_CLIENT__) is respected.

export const usePocketbase = (): unknown => (globalThis as any).usePocketbase()
