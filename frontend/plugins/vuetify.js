// plugins/vuetify.js
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

export default defineNuxtPlugin((nuxtApp) => {

    const theme = {
        default: 'dark',
        theme: {
            themes: {
                dark: {
                    colors: {
                        background: '#0f172a', // default dark background
                        surface: '#1e293b', // default dark surface
                        primary: '#58ab27', // DAV dark primary color (Teal)
                        secondary: '#1A237E', //t DAV dark secondary color (Indigo)
                        accent: '#263238',
                        error: '#D32F2F', // Error color (Red)
                        info: '#2979FF', // Info color (Blue)
                        success: '#2E7D32', // Success color (Green)
                        warning: '#FF6F00', // Warning color (Orange)
                    }
                },
                light: {
                    colors: {
                        background: '#FFFFFF', // default light background
                        surface: '#F5F5F5', // default light surface
                        primary: '#58ab27', // DAV light primary color (Teal)
                        secondary: '#3F51B5', // DAV light secondary color (Indigo)
                        accent: '#546E7A', // DAV light accent color (Blue Grey)
                        error: '#F44336', // Error color (Red)
                        info: '#2196F3', // Info color (Blue)
                        success: '#4CAF50', // Success color (Green)
                        warning: '#FFC107', // Warning color (Amber)
                    }
                },
            },
        },
    };

    const darkTheme = {
        dark: true,
        colors: {
            background: '#0f172a', // default dark background
            surface: '#1e293b', // default dark surface
            primary: '#58ab27', // DAV dark primary color (Teal)
            secondary: '#1A237E', //t DAV dark secondary color (Indigo)
            accent: '#263238',
            error: '#D32F2F', // Error color (Red)
            info: '#2979FF', // Info color (Blue)
            success: '#2E7D32', // Success color (Green)
            warning: '#FF6F00', // Warning color (Orange)
        }
    };

    const lightTheme = {
        dark: false,
        colors: {
            background: '#FFFFFF', // default light background
            surface: '#F5F5F5', // default light surface
            primary: '#58ab27', // DAV light primary color (Teal)
            secondary: '#3F51B5', // DAV light secondary color (Indigo)
            accent: '#546E7A', // DAV light accent color (Blue Grey)
            error: '#F44336', // Error color (Red)
            info: '#2196F3', // Info color (Blue)
            success: '#4CAF50', // Success color (Green)
            warning: '#FFC107', // Warning color (Amber)
        }
    };

    const store = useMainStore();
    const defaultTheme = store.getColorTheme();

    // Create Vuetify instance with your theme
    const vuetify = createVuetify({
        ssr: true,
        components,
        directives,
        theme: {
            defaultTheme: defaultTheme,
            themes: {
                dark: darkTheme,
                light: lightTheme,
            },
        }
    });

    // Make Vuetify available to the app
    nuxtApp.vueApp.use(vuetify);
});