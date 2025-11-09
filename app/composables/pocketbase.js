import PocketBase from 'pocketbase';

export const usePocketbase = () => {
  if (process.server) {
    const url = import.meta.dev
      ? 'http://localhost:8090'
      : 'http://localhost:8080';
    return new PocketBase(url);
  }

  if (!globalThis._pb) {
    const url = import.meta.dev ? 'http://localhost:8090' : '/';
    globalThis._pb = new PocketBase(url);
  }

  return globalThis._pb;
};