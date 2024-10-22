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
  ssr: true,
  modules: ['@nuxtjs/i18n', '@nuxt/image', 'vuetify-nuxt-module'],
  css: [
    '~/assets/css/main.css',
    '@mdi/font/css/materialdesignicons.min.css'
  ],
  vuetify: {
    moduleOptions: {
      ssrClientHints: {
        reloadOnFirstRequest: true, // Reloads the page on first request to apply the theme
        prefersColorScheme: true, // Uses Sec-CH-Prefers-Color-Scheme for theme detection
        viewportSize: true, // Enable Sec-CH-Viewport-Width, Sec-CH-DPR for responsive layout on SSR
        prefersColorSchemeOptions: {
          cookieName: 'color-scheme', // Stores user's preferred color scheme
          useBrowserThemeOnly: true, // Strictly uses the browser theme without relying on cookies
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
              background: '#0f172a',
              surface: '#1e293b',
              primary: '#58ab27',
              secondary: '#1A237E',
              accent: '#263238',
              error: '#D32F2F',
              info: '#2979FF',
              success: '#2E7D32',
              warning: '#FF6F00',
            },
          },
        },
      },
    },
  },
  i18n: {
    locales: [ 'de', 'en', 'ru', 'tr', 'uk' ],
    vueI18n: './app/config/i18n.config.ts',
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: false,
    },
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
  compatibilityDate: '2024-10-13',
  vite: {
    build: {
      minify: 'esbuild',
    },
    optimizeDeps: {
      include: ['vuetify'],
    },
  },
});