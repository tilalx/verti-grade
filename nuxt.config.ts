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
  modules: ['@nuxtjs/i18n', '@nuxt/image'],
  plugins: [
    '~/plugins/vuetify.js',
  ],
  css: [
    '~/assets/css/main.css',
    'vuetify/lib/styles/main.sass',
    '@mdi/font/css/materialdesignicons.min.css'
  ],
  i18n: {
    strategy: 'no_prefix',
    defaultLocale: 'en',
    langDir: 'locales',
    detectBrowserLanguage: {
      useCookie: false,
    },
    locales: [
      { code: 'en', iso: 'en-US', file: 'en.json', isCatchallLocale: true  },
      { code: 'de', iso: 'de-DE', file: 'de.json'},
    ],
  },
  image: {
    formats: ['avif', 'webp'],
  },
  build: {
    transpile: ['vuetify'],
  },
  imports: {
    autoImport: true,
  },
  compatibilityDate: '2024-07-24',
  vite: {
    build: {
      minify: 'esbuild',
    },
    optimizeDeps: {
      include: ['vuetify'],
    },
  },
});