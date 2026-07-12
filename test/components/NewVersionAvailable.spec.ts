import { mount, flushPromises } from '@vue/test-utils';
import NewVersionAvailable from '~/components/notifications/newVersionAvailable.vue';

const releaseDialogStub = {
  template: '<div><slot name="activator" :props="{}" /></div>',
};
const commitDialogStub = {
  props: ['commits', 'installedSha'],
  template: '<div><slot name="activator" :props="{}" /></div>',
};

function createWrapper(appVersion: string) {
  globalThis.__NUXT_RUNTIME_CONFIG__ = {
    public: {
      appVersion,
    },
  };

  return mount(NewVersionAvailable, {
    global: {
      stubs: {
        NotificationsReleaseNotesDialog: releaseDialogStub,
        NotificationsCommitListDialog: commitDialogStub,
      },
      mocks: {
        $t: (key: string, params?: unknown[]) =>
          params ? `${key}:${params.join(',')}` : key,
      },
    },
  });
}

describe('newVersionAvailable notification', () => {
  it('stays hidden for a stable release with no newer tag published', async () => {
    globalThis.$fetch.mockResolvedValue({
      tag_name: 'v1.9.0',
      draft: false,
      prerelease: false,
    });

    const wrapper = createWrapper('1.9.0');
    await flushPromises();

    expect(wrapper.find('.update-banner').exists()).toBe(false);
  });

  it('shows the banner when a newer stable release is published', async () => {
    globalThis.$fetch.mockResolvedValue({
      tag_name: 'v1.10.0',
      draft: false,
      prerelease: false,
    });

    const wrapper = createWrapper('1.9.0');
    await flushPromises();

    expect(globalThis.$fetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/tilalx/verti-grade/releases/latest',
    );
    expect(wrapper.find('.update-banner').exists()).toBe(true);
    expect(wrapper.text()).toContain('v1.10.0');
  });

  it('stays hidden for a rolling commit build already at HEAD', async () => {
    globalThis.$fetch.mockResolvedValue({
      ahead_by: 0,
      commits: [],
    });

    const wrapper = createWrapper('4f6a192');
    await flushPromises();

    expect(globalThis.$fetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/tilalx/verti-grade/compare/4f6a192...main',
    );
    expect(wrapper.find('.update-banner').exists()).toBe(false);
  });

  it('shows the banner and commit count for a rolling build behind HEAD', async () => {
    globalThis.$fetch.mockResolvedValue({
      ahead_by: 2,
      commits: [
        {
          sha: 'aaaaaaaaaa',
          commit: { message: 'first\nbody', author: { date: '2026-01-01' } },
          html_url: 'https://github.com/x/y/commit/aaaaaaaaaa',
        },
        {
          sha: 'bbbbbbbbbb',
          commit: { message: 'second', author: { date: '2026-01-02' } },
          html_url: 'https://github.com/x/y/commit/bbbbbbbbbb',
        },
      ],
    });

    const wrapper = createWrapper('4f6a192');
    await flushPromises();

    expect(wrapper.find('.update-banner').exists()).toBe(true);
    expect(wrapper.text()).toContain(
      'notifications.updateBanner.commitsMessage:2',
    );
  });

  it('hides the banner when dismissed and does not reappear on its own', async () => {
    globalThis.$fetch.mockResolvedValue({
      tag_name: 'v1.10.0',
      draft: false,
      prerelease: false,
    });

    const wrapper = createWrapper('1.9.0');
    await flushPromises();
    expect(wrapper.find('.update-banner').exists()).toBe(true);

    await wrapper.find('.update-banner__close').trigger('click');

    expect(wrapper.find('.update-banner').exists()).toBe(false);
  });
});
