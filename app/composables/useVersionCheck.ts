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

export function useVersionCheck() {
    const { data, status, refresh } = useAsyncData<VersionPayload>(
        'version',
        () => $fetch<VersionPayload, string>('/api/version'),
        { server: false, lazy: true },
    )

    const appVersion = useRuntimeConfig().public.appVersion as string
    const mode = computed(() => data.value?.mode ?? 'none')
    const updateAvailable = computed(() => data.value?.updateAvailable ?? false)
    const latest = computed(() => data.value?.latest ?? null)
    const installedNotes = computed(() => data.value?.installed.notes ?? null)
    const installedBase = computed(() => data.value?.installed.base ?? null)

    const error = computed(() => data.value?.error ?? null)

    const loading = computed(
        () => status.value === 'idle' || status.value === 'pending',
    )
    const commits = computed<VersionCommit[]>(() => data.value?.commits ?? [])

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
