import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from './app/utils/locales'

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
        github: {
            owner: process.env.GITHUB_OWNER || 'tilalx',
            repo: process.env.GITHUB_REPO || 'verti-grade',
            branch: process.env.GITHUB_BRANCH || 'main',
        },
        public: {
            appVersion:
                process.env.APP_VERSION ||
                process.env.npm_package_version ||
                'dev',
        },
    },
    ssr: true,
    routeRules: {
        '/admin/routes': {
            redirect: { to: '/manage/routes', statusCode: 301 },
        },
        '/admin/inventory': {
            redirect: { to: '/manage/inventory', statusCode: 301 },
        },
        '/admin/comments': {
            redirect: { to: '/manage/comments', statusCode: 301 },
        },
        '/admin/reports': {
            redirect: { to: '/manage/reports', statusCode: 301 },
        },
        '/admin/analytics': {
            redirect: { to: '/manage/analytics', statusCode: 301 },
        },
        '/admin/activity': {
            redirect: { to: '/account/activity', statusCode: 301 },
        },
    },
    app: {
        head: {
            meta: [{ name: 'color-scheme', content: 'light dark' }],
        },
    },
    modules: ['@nuxtjs/i18n', '@nuxt/image', 'vuetify-nuxt-module'],
    css: ['~/assets/css/main.css', '@mdi/font/css/materialdesignicons.min.css'],
    vuetify: {
        moduleOptions: {
            autoimport: true, // Automatically imports Vuetify components
            prefixComposables: ['useLayout'],
            ssrClientHints: {
                reloadOnFirstRequest: false,
                prefersColorScheme: true, // Uses Sec-CH-Prefers-Color-Scheme for theme detection
                viewportSize: true, // Enable Sec-CH-Viewport-Width, Sec-CH-DPR for responsive layout on SSR
                prefersColorSchemeOptions: {
                    cookie: {
                        name: 'color-scheme', // Stores user's preferred color scheme
                    },
                    useBrowserThemeOnly: true,
                },
                prefersReducedMotion: true, // Uses Sec-CH-Prefers-Reduced-Motion for reduced motion detection
            },
        },
        vuetifyOptions: {
            defaults: {
                VBtn: { variant: 'flat', rounded: 'lg' },
                VCardActions: { VBtn: { variant: 'flat' } },
                VCard: { rounded: 'lg' },
                VDialog: { maxWidth: 520 },
                VContainer: { fluid: true },
                VAlert: { variant: 'tonal', density: 'compact', rounded: 'lg' },
                VTextField: {
                    variant: 'outlined',
                    density: 'comfortable',
                    rounded: 'lg',
                },
                VTextarea: {
                    variant: 'outlined',
                    density: 'comfortable',
                    rounded: 'lg',
                },
                VSelect: {
                    variant: 'outlined',
                    density: 'comfortable',
                    rounded: 'lg',
                },
                VCombobox: {
                    variant: 'outlined',
                    density: 'comfortable',
                    rounded: 'lg',
                },
                VAutocomplete: {
                    variant: 'outlined',
                    density: 'comfortable',
                    rounded: 'lg',
                },
                VFileInput: {
                    variant: 'outlined',
                    density: 'comfortable',
                    rounded: 'lg',
                },
                VDataTable: { density: 'comfortable', hover: true },
                VDataTableServer: { density: 'comfortable', hover: true },
            },
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
                            'on-surface-light': '#a0297dff',
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
        defaultLocale: DEFAULT_LOCALE,
        detectBrowserLanguage: {
            useCookie: false,
        },
        vueI18n: './i18n.config.ts',
        locales: SUPPORTED_LOCALES.map(({ code, name }) => ({
            code,
            name,
            file: `${code}.ts`,
        })),
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
})
