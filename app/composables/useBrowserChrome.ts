import { compositeOver, mixColors, parseColor } from '~/utils/chromeColor'

type ThemeName = 'light' | 'dark'

const TWEEN_MS = 320
const SCRIM_SELECTOR = '.v-overlay--active > .v-overlay__scrim'
const DEFAULT_SCRIM_OPACITY = 0.32
const LIGHT_QUERY = '(prefers-color-scheme: light)'
const DARK_QUERY = '(prefers-color-scheme: dark)'

function useTweenedColor(target: () => string) {
    const shown = ref(target())
    if (import.meta.server) return shown

    let frame = 0
    watch(target, (next) => {
        cancelAnimationFrame(frame)
        const from = shown.value.slice(0, 7)
        const reduceMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches
        const startedAt = performance.now()
        const step = (now: number) => {
            const progress = reduceMotion
                ? 1
                : Math.min(1, (now - startedAt) / TWEEN_MS)
            shown.value = mixColors(from, next, 1 - (1 - progress) ** 3)
            if (progress < 1) {
                frame = requestAnimationFrame(step)
                return
            }
            shown.value = `${next}fe`
            frame = requestAnimationFrame(() => (shown.value = next))
        }
        frame = requestAnimationFrame(step)
    })
    return shown
}

function readActiveScrim(): string | null {
    const scrim = document.querySelector(SCRIM_SELECTOR)
    if (!scrim) return null
    const style = getComputedStyle(scrim)
    const color = parseColor(style.backgroundColor)
    if (!color) return null
    const opacity =
        parseFloat(style.getPropertyValue('--v-overlay-opacity')) ||
        DEFAULT_SCRIM_OPACITY
    return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3] * opacity})`
}

export function useBrowserChrome() {
    const theme = useTheme()
    const { lgAndUp } = useDisplay()
    const { mode, listenForThemeChanges } = useThemeMode()
    const scrim = ref<string | null>(null)

    const currentName = (): ThemeName =>
        theme.current.value.dark ? 'dark' : 'light'
    const withScrim = (color: string) =>
        scrim.value ? compositeOver(color, scrim.value) : color
    const barTarget = (name: ThemeName) =>
        withScrim(String(theme.themes.value[name]!.colors.surface))
    const pageTarget = () =>
        withScrim(
            String(
                lgAndUp.value
                    ? theme.current.value.colors.background
                    : theme.current.value.colors.surface,
            ),
        )

    const lightBar = useTweenedColor(() => barTarget('light'))
    const darkBar = useTweenedColor(() => barTarget('dark'))
    const activeBar = useTweenedColor(() => barTarget(currentName()))

    const themeColorTags = () =>
        isExplicitThemeMode(mode.value)
            ? [{ media: null, content: activeBar.value }]
            : [
                  { media: LIGHT_QUERY, content: lightBar.value },
                  { media: DARK_QUERY, content: darkBar.value },
              ]

    useHead({
        meta: [
            ...(import.meta.server
                ? themeColorTags().map(({ media, content }) => ({
                      name: 'theme-color',
                      ...(media ? { media } : {}),
                      content,
                  }))
                : []),
            { name: 'color-scheme', content: currentName },
        ],
        htmlAttrs: {
            style: () =>
                `color-scheme: ${currentName()}; background-color: ${pageTarget()}`,
        },
        bodyAttrs: { style: () => `background-color: ${pageTarget()}` },
    })

    if (import.meta.server) return

    let frame = 0
    const observer = new MutationObserver(() => {
        cancelAnimationFrame(frame)
        frame = requestAnimationFrame(() => (scrim.value = readActiveScrim()))
    })
    let stopListening: (() => void) | null = null

    const syncThemeColorTags = () => {
        const wanted = themeColorTags()
        const existing = [
            ...document.head.querySelectorAll<HTMLMetaElement>(
                'meta[name="theme-color"]',
            ),
        ]
        existing.slice(wanted.length).forEach((tag) => tag.remove())
        wanted.forEach(({ media, content }, index) => {
            const tag =
                existing[index] ??
                document.head.appendChild(
                    Object.assign(document.createElement('meta'), {
                        name: 'theme-color',
                    }),
                )
            if (media) tag.setAttribute('media', media)
            else tag.removeAttribute('media')
            tag.setAttribute('content', content)
        })
    }

    onMounted(() => {
        watchEffect(syncThemeColorTags)
        stopListening = listenForThemeChanges()
        observer.observe(document.body, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: ['class'],
        })
    })

    onBeforeUnmount(() => {
        stopListening?.()
        observer.disconnect()
        cancelAnimationFrame(frame)
    })
}
