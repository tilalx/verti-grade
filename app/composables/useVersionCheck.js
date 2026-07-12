const repoOwner = 'tilalx'
const repoName = 'verti-grade'
const defaultBranch = 'main'

// Clean release builds carry a plain semver tag ("1.9.0" / "v1.9.0").
// Rolling builds carry the deployed commit's short SHA instead.
function releaseVersion(version) {
    const match = String(version ?? '')
        .trim()
        .match(/^v?(\d+\.\d+\.\d+)$/)
    return match ? match[1] : null
}

function commitRef(version) {
    const v = String(version ?? '').trim()
    return /^[0-9a-f]{7,40}$/i.test(v) ? v : null
}

function compareVersions(v1, v2) {
    const parse = (v) =>
        String(v ?? '')
            .replace(/^v/, '')
            .split('.')
            .map(Number)
    const v1Parts = parse(v1)
    const v2Parts = parse(v2)

    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
        const v1Part = v1Parts[i] || 0
        const v2Part = v2Parts[i] || 0

        if (v1Part > v2Part) return 1
        if (v1Part < v2Part) return -1
    }

    return 0
}

// Shared across every component instance so the banner state stays in sync
// app-wide (e.g. settings page "simulate" toggle reflects in the layout banner).
export function useVersionCheck() {
    const config = useRuntimeConfig()
    const appVersion = config.public.appVersion

    // 'release': installed a tagged version, compare against the latest GitHub release.
    // 'commit': installed a rolling build, compare against the default branch HEAD.
    const mode = useState('newVersionMode', () => 'release')
    const newVersionAvailable = useState('newVersionAvailable', () => false)
    const latestVersion = useState('latestVersionTag', () => '')
    const commits = useState('newVersionCommits', () => [])

    const checkForNewVersion = async () => {
        const release = releaseVersion(appVersion)
        if (release) {
            mode.value = 'release'
            await checkForNewRelease(release)
            return
        }

        const sha = commitRef(appVersion)
        if (sha) {
            mode.value = 'commit'
            await checkForNewCommits(sha)
        }
    }

    const checkForNewRelease = async (installedRelease) => {
        try {
            const response = await $fetch(
                `https://api.github.com/repos/${repoOwner}/${repoName}/releases/latest`,
            )
            if (response.draft || response.prerelease || !response.tag_name) {
                return
            }
            if (compareVersions(response.tag_name, installedRelease) > 0) {
                newVersionAvailable.value = true
                latestVersion.value = response.tag_name
            }
        } catch (error) {
            console.error('Error fetching the latest release:', error)
        }
    }

    const checkForNewCommits = async (installedSha) => {
        try {
            const response = await $fetch(
                `https://api.github.com/repos/${repoOwner}/${repoName}/compare/${installedSha}...${defaultBranch}`,
            )
            if (response.ahead_by > 0) {
                newVersionAvailable.value = true
                commits.value = (response.commits ?? [])
                    .slice()
                    .reverse()
                    .map((c) => ({
                        sha: c.sha.slice(0, 7),
                        message: (c.commit?.message ?? '').split('\n')[0],
                        date: c.commit?.author?.date ?? null,
                        url: c.html_url,
                    }))
            }
        } catch (error) {
            console.error('Error comparing commits:', error)
        }
    }

    // Forces the banner on for manual QA. Pass 'release' or 'commit' to preview
    // that banner state regardless of the actual installed appVersion; omit to
    // simulate whichever mode the installed appVersion would naturally use.
    const simulateUpdate = (forcedMode) => {
        const simulatedMode =
            forcedMode ?? (releaseVersion(appVersion) ? 'release' : 'commit')

        if (simulatedMode === 'release') {
            mode.value = 'release'
            const release = releaseVersion(appVersion)
            latestVersion.value = release ? `v${release}` : 'v1.0.0'
            newVersionAvailable.value = true
            return
        }

        mode.value = 'commit'
        commits.value = [
            {
                sha: 'abc1234',
                message: 'Simulated commit for preview purposes',
                date: new Date().toISOString(),
                url: '',
            },
        ]
        newVersionAvailable.value = true
    }

    return {
        appVersion,
        mode,
        newVersionAvailable,
        latestVersion,
        commits,
        checkForNewVersion,
        simulateUpdate,
    }
}
