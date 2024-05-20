// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: true,
  devtools: {
    enabled: true,
    timeline: {
      enabled: true,
    },
  },
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/i18n'
  ],
  plugins: [
    '~/plugins/vuetify.js',
    { src: '~/plugins/persistStore.server.js', mode: 'client' },
  ],
  css: [
    '~/assets/css/main.css',
    'vuetify/lib/styles/main.sass',
    '@mdi/font/css/materialdesignicons.min.css'
  ],
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
  },
  build: {
    transpile: ['vuetify'],
  },
})