import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref as vueRef } from 'vue';

const useStateMocks: Record<string, { value: unknown }> = {};

vi.stubGlobal('useState', (key: string, init?: () => unknown) => {
  if (!useStateMocks[key]) {
    useStateMocks[key] = vueRef(init ? init() : undefined);
  }
  return useStateMocks[key];
});

let runtimeConfig: { public: { appVersion: string } };
vi.stubGlobal('useRuntimeConfig', () => runtimeConfig);
vi.stubGlobal('$fetch', vi.fn());

describe('useVersionCheck', () => {
  beforeEach(() => {
    vi.resetModules();
    for (const key of Object.keys(useStateMocks)) {
      delete useStateMocks[key];
    }
    runtimeConfig = { public: { appVersion: '1.9.0' } };
    (globalThis.$fetch as ReturnType<typeof vi.fn>).mockReset();
  });

  async function loadComposable() {
    const mod = await import('~/composables/useVersionCheck');
    return mod.useVersionCheck();
  }

  describe('release installs (clean semver)', () => {
    it('marks newVersionAvailable true when a newer stable release is published', async () => {
      (globalThis.$fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        tag_name: 'v1.10.0',
        draft: false,
        prerelease: false,
      });

      const { mode, newVersionAvailable, latestVersion, checkForNewVersion } =
        await loadComposable();
      await checkForNewVersion();

      expect(globalThis.$fetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/tilalx/verti-grade/releases/latest',
      );
      expect(mode.value).toBe('release');
      expect(newVersionAvailable.value).toBe(true);
      expect(latestVersion.value).toBe('v1.10.0');
    });

    it('stays hidden when the installed tag is already the latest release', async () => {
      (globalThis.$fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        tag_name: 'v1.9.0',
        draft: false,
        prerelease: false,
      });

      const { newVersionAvailable, checkForNewVersion } =
        await loadComposable();
      await checkForNewVersion();

      expect(newVersionAvailable.value).toBe(false);
    });

    it('ignores draft and prerelease releases', async () => {
      const fetchMock = globalThis.$fetch as ReturnType<typeof vi.fn>;
      fetchMock.mockResolvedValue({
        tag_name: 'v1.10.0',
        draft: true,
        prerelease: false,
      });

      const { newVersionAvailable, checkForNewVersion } =
        await loadComposable();
      await checkForNewVersion();
      expect(newVersionAvailable.value).toBe(false);
    });

    it('logs and leaves state untouched when the fetch fails', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      (globalThis.$fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('network'),
      );

      const { newVersionAvailable, checkForNewVersion } =
        await loadComposable();
      await checkForNewVersion();

      expect(newVersionAvailable.value).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching the latest release:',
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });

  describe('rolling commit installs (short SHA)', () => {
    beforeEach(() => {
      runtimeConfig = { public: { appVersion: '4f6a192' } };
    });

    it('marks newVersionAvailable true and lists commits when behind HEAD', async () => {
      (globalThis.$fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ahead_by: 2,
        commits: [
          {
            sha: 'aaaaaaaaaaaaaaaa',
            commit: {
              message: 'first commit\nbody text',
              author: { date: '2026-01-01T00:00:00Z' },
            },
            html_url: 'https://github.com/x/y/commit/aaaaaaaaaaaaaaaa',
          },
          {
            sha: 'bbbbbbbbbbbbbbbb',
            commit: {
              message: 'second commit',
              author: { date: '2026-01-02T00:00:00Z' },
            },
            html_url: 'https://github.com/x/y/commit/bbbbbbbbbbbbbbbb',
          },
        ],
      });

      const { mode, newVersionAvailable, commits, checkForNewVersion } =
        await loadComposable();
      await checkForNewVersion();

      expect(globalThis.$fetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/tilalx/verti-grade/compare/4f6a192...main',
      );
      expect(mode.value).toBe('commit');
      expect(newVersionAvailable.value).toBe(true);
      // newest commit first
      expect(commits.value).toEqual([
        {
          sha: 'bbbbbbb',
          message: 'second commit',
          date: '2026-01-02T00:00:00Z',
          url: 'https://github.com/x/y/commit/bbbbbbbbbbbbbbbb',
        },
        {
          sha: 'aaaaaaa',
          message: 'first commit',
          date: '2026-01-01T00:00:00Z',
          url: 'https://github.com/x/y/commit/aaaaaaaaaaaaaaaa',
        },
      ]);
    });

    it('stays hidden when the installed commit is already at HEAD', async () => {
      (globalThis.$fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ahead_by: 0,
        commits: [],
      });

      const { newVersionAvailable, checkForNewVersion } =
        await loadComposable();
      await checkForNewVersion();

      expect(newVersionAvailable.value).toBe(false);
    });

    it('logs and leaves state untouched when the compare request fails', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      (globalThis.$fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('network'),
      );

      const { newVersionAvailable, checkForNewVersion } =
        await loadComposable();
      await checkForNewVersion();

      expect(newVersionAvailable.value).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error comparing commits:',
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });

  describe('simulateUpdate', () => {
    it('forces the release banner on when installed on a stable tag', async () => {
      const { mode, newVersionAvailable, latestVersion, simulateUpdate } =
        await loadComposable();

      simulateUpdate();

      expect(mode.value).toBe('release');
      expect(newVersionAvailable.value).toBe(true);
      expect(latestVersion.value).toBe('v1.9.0');
    });

    it('forces the commit banner on with a placeholder commit when on a rolling build', async () => {
      runtimeConfig = { public: { appVersion: '4f6a192' } };

      const { mode, newVersionAvailable, commits, simulateUpdate } =
        await loadComposable();

      simulateUpdate();

      expect(mode.value).toBe('commit');
      expect(newVersionAvailable.value).toBe(true);
      expect(commits.value).toHaveLength(1);
    });

    it('forces the commit banner when explicitly requested, even on a stable tag install', async () => {
      const { mode, newVersionAvailable, commits, simulateUpdate } =
        await loadComposable();

      simulateUpdate('commit');

      expect(mode.value).toBe('commit');
      expect(newVersionAvailable.value).toBe(true);
      expect(commits.value).toHaveLength(1);
    });

    it('forces the release banner when explicitly requested, even on a rolling build install', async () => {
      runtimeConfig = { public: { appVersion: '4f6a192' } };

      const { mode, newVersionAvailable, latestVersion, simulateUpdate } =
        await loadComposable();

      simulateUpdate('release');

      expect(mode.value).toBe('release');
      expect(newVersionAvailable.value).toBe(true);
      expect(latestVersion.value).toBe('v1.0.0');
    });
  });
});
