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
    redirect: false,
  },
  i18n: {
    vueI18n: '~/plugins/i18n.js',
  },
  build: {
    transpile: ['vuetify', 'echarts'],
  },
})
