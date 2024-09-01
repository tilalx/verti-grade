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
  modules: ['@nuxtjs/i18n', '@nuxt/image', '@vite-pwa/nuxt'],
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
      { code: 'en', language: 'en-US', file: 'en.json', isCatchallLocale: true  },
      { code: 'de', language: 'de-DE', file: 'de.json'},
    ],
  },
  pwa: {
    manifest: {
      name: 'Verti-Grade',
      short_name: 'Verti-Grade',
      description: 'Tool for Documenting and Rating of Climbing Routes',
      theme_color: '#0f172a',
      background_color: '#0f172a',
      display: 'standalone',
      start_url: '/',
      lang: 'en',
      icons: [
        {
          src: 'icon.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,jpg}'],
      runtimeCaching: [
        {
          urlPattern: /\/api\/.*/,
          handler: 'NetworkFirst', 
          options: {
            cacheName: 'api-cache',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24,
            },
            networkTimeoutSeconds: 10,
          },
        },
      ],
    },
    devOptions: {
      enabled: true, 
      type: "module"
    }
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