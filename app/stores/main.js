// ~/stores/main.js
import { defineStore } from 'pinia'

export const useMainStore = defineStore('verti-grade', {
    state: () => {
        return {
            theme: null,
        }
    },
    actions: {
        setColorTheme(newTheme) {
            this.theme = newTheme
        },
    },
    getters: {
        getColorTheme() {
            return this.theme
        },
    },
})