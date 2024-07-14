// ~/stores/main.js
import { defineStore } from 'pinia'

export const useMainStore = defineStore('verti-grade', {
    state: () => {
        return {
            token: null,
            theme: 'dark',
            locale: 'de',
        }
    },
    actions: {
        setToken(newToken) {
            this.token = newToken
        },
        resetStore() {
            this.token = null
        },
        setColorTheme(newTheme) {
            this.theme = newTheme
        },
        setLocale(newLocale) {
            this.locale = newLocale
        },
    },
    getters: {
        getToken() {
            return this.token?.token
        },
        isLoggedIn() {
            return this.token !== null
        },
        getColorTheme() {
            return this.theme
        },
        getLocale() {
            return this.locale
        },
    },
})
