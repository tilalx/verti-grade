import { SIDEBAR_OPEN_COOKIE } from '~/utils/clientStorage'

const AUTO_OPEN_MIN_WIDTH = 1280

export function useSidebar() {
    const cookie = useCookie<boolean | undefined>(SIDEBAR_OPEN_COOKIE, {
        maxAge: 60 * 60 * 24 * 365,
    })
    const choice = useState('sidebar-open', () => cookie.value)
    const { width } = useDisplay()
    const open = computed(
        () =>
            choice.value ??
            (width.value === 0 || width.value >= AUTO_OPEN_MIN_WIDTH),
    )

    function toggle() {
        choice.value = !open.value
        cookie.value = choice.value
    }

    return { open, toggle }
}
