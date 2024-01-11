const theme = {
    default: 'dark',
    theme: {
        defaultTheme: 'dark', // Set default theme to dark
        themes: {
            dark: {
                colors: {
                    background: '#121212', // default dark background
                    surface: '#1E1E1E', // default dark surface
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
                    primary: '#00796B', // DAV light primary color (Teal)
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

export default theme;