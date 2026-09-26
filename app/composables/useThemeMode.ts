import { THEME_MODE_COOKIE } from '~/utils/clientStorage'

export type ThemeMode = 'system' | 'light' | 'dark'

const THEME_MODES: ThemeMode[] = ['system', 'light', 'dark']

export const isExplicitThemeMode = (
    value: unknown,
): value is 'light' | 'dark' => value === 'light' || value === 'dark'

export function useThemeMode() {
    const theme = useTheme()
    const mode = useCookie<ThemeMode>(THEME_MODE_COOKIE, {
        default: () => 'system',
        maxAge: 31536000,
        sameSite: 'lax',
    })

    const systemTheme = () =>
        window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'

    const setMode = (next: ThemeMode) => {
        mode.value = next
        theme.change(next === 'system' ? systemTheme() : next)
    }

    const cycleMode = () =>
        setMode(
            THEME_MODES[
                (THEME_MODES.indexOf(mode.value) + 1) % THEME_MODES.length
            ]!,
        )

    return { mode, setMode, cycleMode }
}
