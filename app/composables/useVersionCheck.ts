export interface VersionCommit {
    sha: string
    message: string
    date: string | null
}

export interface VersionPayload {
    installed: {
        raw: string
        base: string | null
        ahead: number
        sha: string | null
        notes: string | null
    }
    latest: {
        tag: string
        notes: string | null
        publishedAt: string | null
    } | null
    commits: VersionCommit[]
    mode: 'release' | 'commit' | 'none'
    updateAvailable: boolean
    error: 'rate_limited' | 'unavailable' | null
}

/**
 * Reads the cached server-side version check. All GitHub access lives in
 * `server/api/version.get.ts`; this is only a client-side view of its payload.
 *
 * `server: false` keeps the check off the SSR critical path and makes the
 * request interceptable in e2e — an SSR-resolved payload would be inlined
 * into the HTML instead.
 */
export function useVersionCheck() {
    const { data, status, refresh } = useAsyncData<VersionPayload>(
        'version',
        () => $fetch('/api/version'),
        { server: false, lazy: true },
    )

    // Read straight from config rather than the payload so the footer pill
    // renders server-side instead of popping in after the check resolves.
    const appVersion = useRuntimeConfig().public.appVersion as string
    const mode = computed(() => data.value?.mode ?? 'none')
    const updateAvailable = computed(() => data.value?.updateAvailable ?? false)
    const latest = computed(() => data.value?.latest ?? null)
    const installedNotes = computed(() => data.value?.installed.notes ?? null)
    const installedBase = computed(() => data.value?.installed.base ?? null)

    // Distinguishes "GitHub was unreachable" from "this release has no notes",
    // so the dialogs don't report a missing changelog for a network failure.
    const error = computed(() => data.value?.error ?? null)

    // The dialogs open off shared state, so they must be able to tell
    // "still fetching" from "nothing to show".
    const loading = computed(
        () => status.value === 'idle' || status.value === 'pending',
    )
    const commits = computed<VersionCommit[]>(() => data.value?.commits ?? [])

    // Identifies *which* update was announced, so dismissing one release does
    // not suppress the next.
    const updateId = computed(() =>
        mode.value === 'release'
            ? (latest.value?.tag ?? '')
            : (commits.value[0]?.sha ?? ''),
    )

    return {
        appVersion,
        mode,
        updateAvailable,
        latest,
        installedNotes,
        installedBase,
        error,
        loading,
        commits,
        updateId,
        refresh,
    }
}
