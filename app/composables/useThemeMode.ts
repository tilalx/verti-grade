import { COLOR_SCHEME_COOKIE, THEME_MODE_COOKIE } from '~/utils/clientStorage'

export type ThemeMode = 'system' | 'light' | 'dark'
type ThemeName = 'light' | 'dark'

const THEME_MODES: ThemeMode[] = ['system', 'light', 'dark']
const THEME_CHANNEL = 'gripello-theme'
const REVEAL_MS = 450

export const isExplicitThemeMode = (value: unknown): value is ThemeName =>
    value === 'light' || value === 'dark'

const isThemeMode = (value: unknown): value is ThemeMode =>
    value === 'system' || isExplicitThemeMode(value)

let channel: BroadcastChannel | null = null
const themeChannel = () => {
    if (!channel && typeof BroadcastChannel !== 'undefined')
        channel = new BroadcastChannel(THEME_CHANNEL)
    return channel
}

export function useThemeMode() {
    const theme = useTheme()
    const cookie = useCookie<ThemeMode>(THEME_MODE_COOKIE, {
        default: () => 'system',
        maxAge: 31536000,
        sameSite: 'lax',
    })
    const mode = useState<ThemeMode>(THEME_MODE_COOKIE, () =>
        isThemeMode(cookie.value) ? cookie.value : 'system',
    )

    const systemTheme = (): ThemeName =>
        window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'

    const resolve = (value: ThemeMode): ThemeName =>
        value === 'system' ? systemTheme() : value

    const applyTheme = async (name: ThemeName, origin?: HTMLElement) => {
        if (theme.name.value === name) return
        const reduceMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches
        if (!origin || reduceMotion || !document.startViewTransition) {
            theme.change(name)
            return
        }

        const root = document.documentElement
        const { left, top, width, height } = origin.getBoundingClientRect()
        const x = left + width / 2
        const y = top + height / 2
        const radius = Math.hypot(
            Math.max(x, window.innerWidth - x),
            Math.max(y, window.innerHeight - y),
        )

        root.classList.add('theme-reveal')
        try {
            const transition = document.startViewTransition(async () => {
                theme.change(name)
                await nextTick()
            })
            await transition.ready
            root.animate(
                {
                    clipPath: [
                        `circle(0px at ${x}px ${y}px)`,
                        `circle(${radius}px at ${x}px ${y}px)`,
                    ],
                },
                {
                    duration: REVEAL_MS,
                    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                    pseudoElement: '::view-transition-new(root)',
                },
            )
            await transition.finished
        } finally {
            root.classList.remove('theme-reveal')
        }
    }

    const adoptMode = (next: ThemeMode, origin?: HTMLElement) => {
        mode.value = next
        cookie.value = next
        return applyTheme(resolve(next), origin)
    }

    const setMode = (next: ThemeMode, origin?: HTMLElement) => {
        themeChannel()?.postMessage(next)
        return adoptMode(next, origin)
    }

    const cycleMode = (event?: Event) =>
        setMode(
            THEME_MODES[
                (THEME_MODES.indexOf(mode.value) + 1) % THEME_MODES.length
            ]!,
            event?.currentTarget instanceof HTMLElement
                ? event.currentTarget
                : undefined,
        )

    const listenForThemeChanges = () => {
        const scheme = window.matchMedia('(prefers-color-scheme: dark)')
        const onSchemeChange = () => {
            document.cookie = `${COLOR_SCHEME_COOKIE}=${systemTheme()}; Path=/; Max-Age=31536000; SameSite=Lax`
            if (mode.value === 'system') void applyTheme(systemTheme())
        }
        const onBroadcast = (event: MessageEvent) => {
            if (isThemeMode(event.data)) void adoptMode(event.data)
        }
        scheme.addEventListener('change', onSchemeChange)
        themeChannel()?.addEventListener('message', onBroadcast)
        return () => {
            scheme.removeEventListener('change', onSchemeChange)
            themeChannel()?.removeEventListener('message', onBroadcast)
        }
    }

    return { mode, setMode, cycleMode, listenForThemeChanges }
}
