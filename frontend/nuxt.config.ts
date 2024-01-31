// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: {
    enabled: true,

    timeline: {
      enabled: true,
    },
  },
  modules: [
    '@pinia/nuxt',
    '@pinia-plugin-persistedstate/nuxt',
    '@nuxtjs/i18n',
  ],
  plugins: [
    '~/plugins/vuetify.js',
     '~/plugins/piniaPersist.js',],
  css: [
    '~/assets/css/main.css',
    'vuetify/lib/styles/main.sass',
    '@mdi/font/css/materialdesignicons.min.css'
  ],
  build: {
    transpile: ['vuetify'],
  },
  ssr: true,
  nitro: {
    devProxy: {
      '/api': 
      {
        target: 'http://localhost:3001/api',
      },
    }
  },
  routeRules: {
    '/api/**': { proxy: 'http://localhost:3001/api/**' },
  },
  i18n: {
    vueI18n: '~/plugins/i18n.js',
  }
})