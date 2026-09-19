import { parseAppVersion, decideUpdate } from '../utils/version'
import type { InstalledVersion, UpdateMode } from '../utils/version'

interface GithubRelease {
    tag_name?: string
    body?: string | null
    published_at?: string | null
}

interface GithubCommit {
    sha?: string
    commit?: { message?: string; author?: { date?: string } }
}

interface VersionPayload {
    installed: InstalledVersion & { notes: string | null }
    latest: {
        tag: string
        notes: string | null
        publishedAt: string | null
    } | null
    commits: { sha: string; message: string; date: string | null }[]
    mode: UpdateMode
    updateAvailable: boolean
    error: 'rate_limited' | 'unavailable' | null
}

// GitHub rejects requests without a User-Agent, and node's fetch sends none.
const GITHUB_HEADERS = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'verti-grade',
}

export default defineCachedEventHandler(
    async (): Promise<VersionPayload> => {
        const { github, public: publicConfig } = useRuntimeConfig()
        const repo = `https://api.github.com/repos/${github.owner}/${github.repo}`
        const installed = parseAppVersion(publicConfig.appVersion)

        let failure: VersionPayload['error'] = null

        const get = async <T>(path: string): Promise<T | null> => {
            try {
                return await $fetch<T>(`${repo}/${path}`, {
                    headers: GITHUB_HEADERS,
                })
            } catch (error) {
                const status = (error as { status?: number })?.status
                // A 404 is an expected answer (no such tag), not a failure.
                if (status !== 404)
                    failure = status === 403 ? 'rate_limited' : 'unavailable'
                return null
            }
        }

        const latestRelease = await get<GithubRelease>('releases/latest')
        const latestTag = latestRelease?.tag_name ?? null

        // git describe's own "-7-" count is only a hint; the compare API is
        // authoritative, so ask it whenever we know which commit is deployed.
        const comparison = installed.sha
            ? await get<{ ahead_by?: number; commits?: GithubCommit[] }>(
                  `compare/${installed.sha}...${github.branch}`,
              )
            : null
        const aheadBy = comparison?.ahead_by ?? 0

        const { mode, updateAvailable } = decideUpdate(
            installed,
            latestTag,
            aheadBy,
        )

        // The footer pill shows the installed release's notes whether or not an
        // update exists, so resolve them even when we are up to date.
        let installedRelease: GithubRelease | null = null
        if (installed.base) {
            installedRelease =
                latestTag?.replace(/^v/, '') === installed.base
                    ? latestRelease
                    : await get<GithubRelease>(
                          `releases/tags/v${installed.base}`,
                      )
        }

        return {
            installed: { ...installed, notes: installedRelease?.body ?? null },
            latest: latestTag
                ? {
                      tag: latestTag,
                      notes: latestRelease?.body ?? null,
                      publishedAt: latestRelease?.published_at ?? null,
                  }
                : null,
            commits:
                mode === 'commit'
                    ? (comparison?.commits ?? [])
                          .slice()
                          .reverse()
                          .map((commit) => ({
                              sha: (commit.sha ?? '').slice(0, 7),
                              message: (commit.commit?.message ?? '').split(
                                  '\n',
                              )[0]!,
                              date: commit.commit?.author?.date ?? null,
                          }))
                    : [],
            mode,
            updateAvailable,
            error: failure,
        }
    },
    // One hour matches GitHub's own unauthenticated rate-limit window, so a
    // 403 is cached as a deliberate backoff rather than retried per page load
    // (retrying is what exhausts the 60/hr budget in the first place).
    { maxAge: 3600, name: 'version', getKey: () => 'current' },
)
