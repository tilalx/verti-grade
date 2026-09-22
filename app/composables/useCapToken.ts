/**
 * Cap proof-of-work captcha, client half.
 *
 * Programmatic mode rather than the visible `<cap-widget>` checkbox: these are
 * forms a climber fills at the wall on a phone, and a puzzle that solves itself
 * during submit costs them a second of "verifying" instead of an extra tap.
 *
 * The widget is loaded on demand, and only in the browser -- it registers a
 * custom element and would throw during SSR.
 */

import type { CapScope } from '~~/server/utils/cap'

// Served from this app rather than from the CDN the widget defaults to. Vite
// emits both as hashed assets and hands back their URLs, so the version can
// only ever be the one in package.json -- and a gym whose network cannot reach
// jsDelivr still gets a working captcha.
import capWasmUrl from '@cap.js/wasm/browser/cap_wasm_bg.wasm?url'
import pakoUrl from 'pako/dist/pako_inflate.min.js?url'

interface CapStatus {
    enabled: boolean
}

/** One request per session, shared by every form that needs it. */
export function useCapStatus() {
    return useAsyncData<CapStatus>(
        'cap-status',
        async () => {
            try {
                return await $fetch<CapStatus>('/api/cap/status')
            } catch (err) {
                // An install without the captcha must not lose its forms to a
                // failed status call; PocketBase is the one that enforces.
                return { enabled: false }
            }
        },
        { default: () => ({ enabled: false }) },
    )
}

export function useCapToken() {
    const { data: status } = useCapStatus()

    // Shared rather than per-caller: the button that reports progress is a
    // separate component from the form that starts the solve, and both reach
    // this state through their own useCapToken() call.
    const solving = useState('cap-solving', () => false)
    const progress = useState('cap-progress', () => 0)

    /**
     * Returns the header to attach to the protected request, or `{}` when the
     * captcha is off. Throws when a challenge cannot be solved: failing the
     * submit is the honest outcome, since the server would reject it anyway.
     */
    async function capHeaders(
        scope: CapScope,
    ): Promise<Record<string, string>> {
        if (!status.value?.enabled || import.meta.server) return {}

        solving.value = true
        progress.value = 0
        try {
            // Must be set before the widget loads: it reads these the first
            // time it needs either file, and both are reached on an ordinary
            // solve -- verified by blocking jsdelivr.net outright and watching
            // the widget pull all of it from /_nuxt/ instead.
            const w = globalThis as any
            w.CAP_CUSTOM_WASM_URL = capWasmUrl
            w.CAP_PAKO_URL = pakoUrl

            await import('cap-widget')
            const Cap = w.Cap
            if (!Cap) throw new Error('cap-widget did not register')

            const cap = new Cap({ apiEndpoint: `/api/cap/${scope}/` })
            // On a phone the puzzle can run for several seconds. Without this
            // the submit button is just a spinner that stalls for no stated
            // reason, which reads as the app being broken.
            cap.addEventListener('progress', (event: any) => {
                progress.value = Math.round(event?.detail?.progress ?? 0)
            })
            const { token } = await cap.solve()
            return { 'X-Cap-Token': token }
        } finally {
            solving.value = false
        }
    }

    return { capHeaders, solving, progress }
}
