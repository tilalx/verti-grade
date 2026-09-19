// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  future: {
    compatibilityVersion: 5,
  },
  devtools: {
    enabled: true,
    timeline: {
      enabled: true,
    },
  },
  runtimeConfig: {
    public: {
      appVersion: process.env.APP_VERSION || process.env.npm_package_version
    }
  },
  ssr: true,
  modules: ['@nuxtjs/i18n', '@nuxt/image', 'vuetify-nuxt-module'],
  css: [
    '~/assets/css/main.css',
    '@mdi/font/css/materialdesignicons.min.css'
  ],
  vuetify: {
    moduleOptions: {
      autoimport: true, // Automatically imports Vuetify components
      ssrClientHints: {
        // false: the module's own guard cookie (vuetify-nuxt-client-hints-
        // reloaded) that's supposed to stop repeat reloads isn't reliably
        // surviving the write-then-reload round trip in every browser here
        // (worst in WebKit) — seen reloading the same URL 15-20+ times in a
        // row instead of settling. This only affects the *first* request's
        // SSR theme guess (it may briefly flash the wrong theme before the
        // client corrects it below) — live switching is unaffected, see
        // useBrowserThemeOnly.
        reloadOnFirstRequest: false,
        prefersColorScheme: true, // Uses Sec-CH-Prefers-Color-Scheme for theme detection
        viewportSize: true, // Enable Sec-CH-Viewport-Width, Sec-CH-DPR for responsive layout on SSR
        prefersColorSchemeOptions: {
          cookie: {
            name: 'color-scheme', // Stores user's preferred color scheme
          },
          // Must stay true: this is what makes the module attach a live
          // matchMedia('prefers-color-scheme') listener that flips the
          // theme immediately when the OS/browser preference changes —
          // unrelated to reloadOnFirstRequest above. false removes that
          // listener entirely, so the theme only reflects whatever was set
          // at the last full reload and stops responding to further changes.
          useBrowserThemeOnly: true,
        },
        prefersReducedMotion: true, // Uses Sec-CH-Prefers-Reduced-Motion for reduced motion detection
      }
    },
    vuetifyOptions: {
      theme: {
        defaultTheme: 'light',
        themes: {
          light: {
            colors: {
              background: '#FFFFFF',
              surface: '#F5F5F5',
              primary: '#58ab27',
              secondary: '#3F51B5',
              accent: '#546E7A',
              error: '#F44336',
              info: '#2196F3',
              success: '#4CAF50',
              warning: '#FFC107',
            },
          },
          dark: {
            colors: {
              background: '#0d1117',
              surface: '#161b22',
              primary: '#238636',
              secondary: '#58a6ff',
              error: '#f85149',
              info: '#58a6ff',
              success: '#238636',
              warning: '#e3b341',
              'on-surface': '#dddddd',
              'on-surface-light': '#a0297dff'
            },
          },
        },
      },
    },
  },
  i18n: {
    strategy: 'no_prefix',
    lazy: true,
    langDir: 'locales/',
    defaultLocale: 'en',
    detectBrowserLanguage: {
      useCookie: false
    },
    vueI18n: './i18n.config.ts',
    locales: [
      { code: 'en', file: 'en.ts', name: 'English' },
      { code: 'de', file: 'de.ts', name: 'Deutsch' },
      { code: 'ru', file: 'ru.ts', name: 'Русский' },
      { code: 'tr', file: 'tr.ts', name: 'Türkçe' },
      { code: 'uk', file: 'uk.ts', name: 'Українська' }
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
  vite: {
    build: {
      minify: 'esbuild',
    },
    optimizeDeps: {
      include: [
         'pocketbase',
         'echarts',
         'vue-qrcode-reader',
         '@vue/devtools-core',
         '@vue/devtools-kit',
      ],
    },
  },
});