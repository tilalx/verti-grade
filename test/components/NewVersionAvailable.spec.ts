import { mount } from '@vue/test-utils';
import NewVersionAvailable from '~/components/notifications/newVersionAvailable.vue';

const containerStub = { template: '<div><slot /></div>' };
const rowStub = containerStub;
const colStub = containerStub;
const alertStub = containerStub;

function createWrapper(appVersion = '1.0.0') {
  globalThis.__NUXT_RUNTIME_CONFIG__ = {
    public: {
      appVersion,
    },
  };

  return mount(NewVersionAvailable, {
    global: {
      stubs: {
        'v-container': containerStub,
        'v-row': rowStub,
        'v-col': colStub,
        'v-alert': alertStub,
      },
      mocks: {
        $t: (key: string) => key,
      },
    },
  });
}

describe('newVersionAvailable notification', () => {
  it('compares semantic versions correctly', () => {
    const wrapper = createWrapper();
    const vm = wrapper.vm as unknown as {
      compareVersions: (a: string, b: string) => number;
    };

    expect(vm.compareVersions('v1.2.3', '1.2.3')).toBe(0);
    expect(vm.compareVersions('1.3.0', '1.2.9')).toBe(1);
    expect(vm.compareVersions('1.2', '1.2.5')).toBe(-1);
    expect(vm.compareVersions('1.2.0', '1.2')).toBe(0);
  });

  it('marks newVersionAvailable true when GitHub reports a newer stable release', async () => {
    globalThis.$fetch
      .mockResolvedValueOnce({
        name: 'v1.1.0',
        draft: false,
        prerelease: false,
      })
      .mockResolvedValueOnce({
        name: 'v1.0.0',
        draft: false,
        prerelease: false,
      });

    const wrapper = createWrapper('1.0.0');
    const vm = wrapper.vm as unknown as {
      newVersionAvailable: boolean;
      checkForNewVersion: () => Promise<void>;
    };

    await vm.checkForNewVersion();
    expect(globalThis.$fetch).toHaveBeenNthCalledWith(
      1,
      'https://api.github.com/repos/tilalx/verti-grade/releases/latest',
    );
    expect(vm.newVersionAvailable).toBe(true);

    await vm.checkForNewVersion();
    expect(globalThis.$fetch).toHaveBeenCalledTimes(2);
    expect(vm.newVersionAvailable).toBe(false);
  });

  it('fetches GitHub release info and filters drafts/prereleases', async () => {
    const wrapper = createWrapper('1.0.0');
    const vm = wrapper.vm as unknown as {
      getGhVersion: (
        currentVersion: string,
        owner: string,
        repo: string,
      ) => Promise<boolean>;
      compareVersions: (a: string, b: string) => number;
    };

    const fetchMock = globalThis.$fetch.mockResolvedValue({
      name: 'v1.1.0',
      draft: false,
      prerelease: false,
    });

    const result = await vm.getGhVersion('1.0.0', 'tilalx', 'verti-grade');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/repos/tilalx/verti-grade/releases/latest',
    );
    expect(result).toBe(true);

    globalThis.$fetch.mockResolvedValue({
      name: 'v1.2.0',
      draft: true,
      prerelease: false,
    });
    expect(
      await vm.getGhVersion('1.0.0', 'tilalx', 'verti-grade'),
    ).toBe(false);

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    globalThis.$fetch.mockRejectedValue(new Error('network'));
    expect(
      await vm.getGhVersion('1.0.0', 'tilalx', 'verti-grade'),
    ).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error fetching the latest release:',
      expect.any(Error),
    );
    consoleSpy.mockRestore();
  });
});
