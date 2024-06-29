// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: {
    enabled: false,
    timeline: {
      enabled: true,
    },
  },
  modules: ['@pinia/nuxt', '@nuxtjs/i18n', "@nuxtjs/supabase", "nuxt-echarts"],
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
    url: 'http://192.168.178.110:8000',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzE2MTU2MDAwLAogICJleHAiOiAxODczOTIyNDAwCn0.S4IjH9EnarNccAnzOB4TdVRoDnM8QZalGozd6kdWvtY',
    redirect: false,
  },
  i18n: {
    vueI18n: '~/plugins/i18n.js',
  },
  build: {
    transpile: ['vuetify', 'echarts'],
  },
})
