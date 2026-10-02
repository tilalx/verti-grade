export type ThemeName = 'light' | 'dark'

export interface ThemePalette {
    background: string
    surface: string
    scrim: string
    primary: string
    success: string
    error: string
    info: string
}

export const THEME_COLORS: Record<ThemeName, ThemePalette> = {
    light: {
        background: '#f8faf3',
        surface: '#ffffff',
        scrim: 'rgba(245, 245, 245, 0.75)',
        primary: '#38741c',
        success: '#2e7d32',
        error: '#ba1a1a',
        info: '#0061a4',
    },
    dark: {
        background: '#0d1117',
        surface: '#161b22',
        scrim: 'rgba(28, 33, 40, 0.75)',
        primary: '#238636',
        success: '#238636',
        error: '#f85149',
        info: '#58a6ff',
    },
}
