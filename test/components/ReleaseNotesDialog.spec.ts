import { mount, flushPromises } from '@vue/test-utils';
import ReleaseNotesDialog from '~/components/notifications/ReleaseNotesDialog.vue';

const passthroughStub = { template: '<div><slot /></div>' };
const dialogStub = {
  props: ['modelValue'],
  template: '<div><slot name="activator" :props="{}" /><slot /></div>',
};

function createWrapper(appVersion = '1.9.0', version = '') {
  globalThis.__NUXT_RUNTIME_CONFIG__ = {
    public: {
      appVersion,
    },
  };

  return mount(ReleaseNotesDialog, {
    props: { version },
    global: {
      stubs: {
        'v-dialog': dialogStub,
        'v-card': passthroughStub,
        'v-card-title': passthroughStub,
        'v-card-subtitle': passthroughStub,
        'v-card-text': passthroughStub,
        'v-card-actions': passthroughStub,
        'v-alert': passthroughStub,
        'v-chip': passthroughStub,
        'v-btn': passthroughStub,
        'v-icon': passthroughStub,
        'v-spacer': passthroughStub,
        'v-divider': passthroughStub,
        'v-progress-circular': passthroughStub,
      },
      mocks: {
        $t: (key: string) => key,
      },
    },
  });
}

describe('ReleaseNotesDialog', () => {
  it('fetches the release for the given version when opened', async () => {
    globalThis.$fetch.mockResolvedValue({
      tag_name: 'v1.9.0',
      body: 'fixes',
    });

    const wrapper = createWrapper('1.9.0', '1.9.0-5-gabc1234');
    const vm = wrapper.vm as unknown as {
      dialog: boolean;
      release: { tag_name: string } | null;
    };

    expect(globalThis.$fetch).not.toHaveBeenCalled();

    vm.dialog = true;
    await flushPromises();

    expect(globalThis.$fetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/tilalx/verti-grade/releases/tags/v1.9.0',
    );
    expect(vm.release?.tag_name).toBe('v1.9.0');

    // reopening does not refetch
    vm.dialog = false;
    await flushPromises();
    vm.dialog = true;
    await flushPromises();
    expect(globalThis.$fetch).toHaveBeenCalledTimes(1);
  });

  it('falls back to the latest release without a version prop', async () => {
    globalThis.$fetch.mockResolvedValue({
      tag_name: 'v1.9.0',
      body: 'fixes',
    });

    const wrapper = createWrapper('1.9.0');
    const vm = wrapper.vm as unknown as { dialog: boolean };

    vm.dialog = true;
    await flushPromises();

    expect(globalThis.$fetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/tilalx/verti-grade/releases/latest',
    );
  });

  it('matches the installed version including rolling builds', () => {
    const wrapper = createWrapper('1.9.0-5-gabc1234');
    const vm = wrapper.vm as unknown as {
      isInstalledVersion: (tag: string) => boolean;
    };

    expect(vm.isInstalledVersion('v1.9.0')).toBe(true);
    expect(vm.isInstalledVersion('v1.8.0')).toBe(false);
  });

  it('renders changelog bodies as readable plain text', () => {
    const wrapper = createWrapper();
    const vm = wrapper.vm as unknown as {
      formatChangelog: (body: string) => string;
    };

    expect(
      vm.formatChangelog(
        '## What changed\r\n- **Fix** login\n* See [docs](https://example.com)',
      ),
    ).toBe('What changed\n• Fix login\n• See docs');
    expect(
      vm.formatChangelog(
        '- bump x in https://github.com/tilalx/verti-grade/pull/322\nFull Changelog: https://github.com/tilalx/verti-grade/compare/v1.8.8...v1.9.0',
      ),
    ).toBe('• bump x in #322\nFull Changelog: v1.8.8...v1.9.0');
    expect(vm.formatChangelog('')).toBe('');
  });

  it('flags an error when the GitHub request fails', async () => {
    const consoleSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    globalThis.$fetch.mockRejectedValue(new Error('network'));

    const wrapper = createWrapper();
    const vm = wrapper.vm as unknown as {
      dialog: boolean;
      error: boolean;
      loading: boolean;
    };

    vm.dialog = true;
    await flushPromises();

    expect(vm.error).toBe(true);
    expect(vm.loading).toBe(false);
    consoleSpy.mockRestore();
  });
});
