// plugins/persistStore.server.js
import { watch } from 'vue';
import { useMainStore } from '~/stores/main';

export default defineNuxtPlugin(nuxtApp => {
  const mainStore = useMainStore();
  const cookie = useCookie('verti-grade');

  nuxtApp.hook('app:beforeMount', () => {
    loadStore();
    watch(() => mainStore.$state, saveStore, { deep: true });
  });


  function saveStore() {
    const state = JSON.stringify(mainStore.$state);
    cookie.value = state;
  }

  function loadStore() {
    const cookieValue = JSON.stringify(cookie.value)
    if (cookieValue) {
      try {
        const parsedState = JSON.parse(cookieValue);
        mainStore.$patch(parsedState);
      } catch (error) {
        console.error('Error parsing state from cookie:', error);
      }
    }
  }
});
