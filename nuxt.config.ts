// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: {
    enabled: true,
    timeline: {
      enabled: true,
    },
  },
  runtimeConfig: {
    public: {
      appVersion: process.env.npm_package_version
    }
  },
  future: {
    compatibilityVersion: 4,
  },
  ssr: false,
  modules: ['@nuxtjs/i18n'],
  plugins: [
    '~/plugins/vuetify.js',
  ],
  css: [
    '~/assets/css/main.css',
    'vuetify/lib/styles/main.sass',
    '@mdi/font/css/materialdesignicons.min.css'
  ],
  i18n: {
    vueI18n: '~/plugins/i18n.js',
    detectBrowserLanguage: {
      useCookie: false,
      alwaysRedirect: true,
    },
  },
  build: {
    transpile: ['vuetify', 'echarts'],
  },
  imports: {
    autoImport: true,
  },
  compatibilityDate: '2024-07-24',
})