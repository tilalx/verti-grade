import pkg from './package.json'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: {
    enabled: false,
    timeline: {
      enabled: true,
    },
  },
  future: {
    compatibilityVersion: 4,
  },
  ssr: false,
  srcDir: 'src',
  modules: ['@pinia/nuxt', '@nuxtjs/i18n', "@nuxtjs/supabase"],

  plugins: [
    '~/plugins/vuetify.js',
    { src: '~/plugins/persistStore.server.js', mode: 'client' },
  ],

  css: [
    '~/assets/css/main.css',
    'vuetify/lib/styles/main.sass',
    '@mdi/font/css/materialdesignicons.min.css'
  ],

  supabase: {
    redirect: false,
  },

  i18n: {
    vueI18n: '~/plugins/i18n.js',
  },

  build: {
    transpile: ['vuetify', 'echarts'],
  },

  imports: {
    autoImport: true,
  },

  compatibilityDate: '2024-07-05',
})