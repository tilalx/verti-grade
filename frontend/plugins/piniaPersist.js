// ~/plugins/piniaPersist.js
import { defineNuxtPlugin } from '#app';
import { piniaPersist } from '~/stores/main';

export default defineNuxtPlugin((nuxtApp) => {
  const pinia = nuxtApp.$pinia;
  pinia.use(piniaPersist);
});