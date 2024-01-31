// ~/stores/main.js
import { defineStore } from 'pinia';
import piniaPersistedstate from 'pinia-plugin-persistedstate';

export const useMainStore = defineStore('verti-grade', {
  state: () => ({
    token: null,
    theme: 'dark',
    locale: 'de',
  }),
  actions: {
    setToken(newToken) {
      this.token = newToken;
    },
    resetStore() {
      this.token = null;
    },
    getToken() {
      return this.token?.token;
    },

    isLoggedIn() { 
      return this.token !== null;
    },
    setColorTheme(newTheme) {
      this.theme = newTheme;
    },
    getColorTheme() {
      return this.theme;
    },
    setLocale(newLocale) {
      this.locale = newLocale;
    },
    getLocale() {
      return this.locale;
    }
  },
  
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'verti-grade',
      },
    ],
  },
});

export const piniaPersist = piniaPersistedstate;
