import PocketBase from 'pocketbase';

export function createPocketBase() {
  const url = import.meta.dev ? 'http://localhost:8090' : 'http://pb:8080';
  return new PocketBase(url);
}