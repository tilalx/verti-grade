import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from './app/utils/locales'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2026-09-26',
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
            repoUrl: `https://github.com/${process.env.GITHUB_OWNER || 'tilalx'}/${process.env.GITHUB_REPO || 'verti-grade'}`,
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
    experimental: {
        viewTransition: true,
    },
    app: {
        head: {
            meta: [
                { name: 'color-scheme', content: 'light dark' },
                { name: 'theme-color', content: '#38741C' },
                { name: 'mobile-web-app-capable', content: 'yes' },
                { name: 'apple-mobile-web-app-title', content: 'Verti-Grade' },
            ],
            link: [
                { rel: 'manifest', href: '/manifest.webmanifest' },
                { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
            ],
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
                            background: '#F8FAF3',
                            surface: '#FFFFFF',
                            'surface-bright': '#FFFFFF',
                            'surface-light': '#EDF1E6',
                            primary: '#38741C',
                            secondary: '#38656A',
                            accent: '#56624C',
                            error: '#BA1A1A',
                            info: '#0061A4',
                            success: '#2E7D32',
                            warning: '#9A5B00',
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
                '@vue/devtools-core',
                '@vue/devtools-kit',
            ],
        },
    },
})
