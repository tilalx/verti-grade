import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import ReleaseNotesDialog from '~/components/notifications/ReleaseNotesDialog.vue';

// The dialog is purely presentational now, so render its contents inline
// rather than simulating Vuetify's overlay.
const stubs = {
  'v-dialog': { template: '<div><slot name="activator" :props="{}" /><slot /></div>' },
  'v-card': { template: '<div><slot /></div>' },
  'v-card-title': { template: '<div><slot /></div>' },
  'v-card-subtitle': { template: '<div><slot /></div>' },
  'v-card-text': { template: '<div><slot /></div>' },
  'v-alert': { template: '<div><slot /></div>' },
  'v-chip': { template: '<span class="chip"><slot /></span>' },
  'v-icon': { template: '<i><slot /></i>' },
  'v-spacer': true,
  'v-btn': { template: '<button><slot /></button>' },
  'v-progress-circular': { template: '<div class="spinner" />' },
};

function createWrapper(props = {}) {
  return mount(ReleaseNotesDialog, {
    props,
    global: {
      stubs,
      mocks: {
        $t: (key: string, params?: unknown[]) =>
          params ? `${key}:${params.join(',')}` : key,
      },
    },
  });
}

describe('ReleaseNotesDialog', () => {
  it('never fetches — it renders only what it is given', () => {
    createWrapper({ tag: 'v1.9.0', notes: 'body' });
    expect(globalThis.$fetch).not.toHaveBeenCalled();
  });

  it('renders the tag and notes it is passed', () => {
    const wrapper = createWrapper({ tag: 'v1.9.0', notes: 'Fixed a thing' });

    expect(wrapper.text()).toContain('v1.9.0');
    expect(wrapper.text()).toContain('Fixed a thing');
  });

  it('shows a spinner while the shared check is still in flight', () => {
    const wrapper = createWrapper({ tag: 'v1.9.0', notes: null, loading: true });

    expect(wrapper.find('[data-testid="release-notes-loading"]').exists()).toBe(
      true,
    );
    // Must not claim the notes are missing before the fetch has resolved.
    expect(wrapper.find('[data-testid="release-notes-empty"]').exists()).toBe(
      false,
    );
  });

  it('reports a fetch failure as an error, not as a missing changelog', () => {
    const wrapper = createWrapper({ tag: 'v1.9.0', notes: null, error: 'rate_limited' });

    expect(wrapper.find('[data-testid="release-notes-error"]').exists()).toBe(
      true,
    );
    expect(wrapper.find('[data-testid="release-notes-empty"]').exists()).toBe(
      false,
    );
    expect(wrapper.text()).toContain('notifications.releaseNotes.error');
  });

  it('shows an explicit empty state when no notes exist', () => {
    const wrapper = createWrapper({ tag: 'v1.9.0', notes: null });

    expect(wrapper.find('[data-testid="release-notes-empty"]').exists()).toBe(
      true,
    );
    expect(wrapper.text()).toContain('notifications.releaseNotes.notFound');
  });

  it('marks the installed release only when told to', () => {
    expect(
      createWrapper({ tag: 'v1.9.0', notes: 'x', installed: true })
        .find('.chip')
        .exists(),
    ).toBe(true);
    expect(
      createWrapper({ tag: 'v1.10.0', notes: 'x' }).find('.chip').exists(),
    ).toBe(false);
  });

  it('reacts to changed props instead of latching onto the first value', async () => {
    const wrapper = createWrapper({ tag: 'v1.9.0', notes: 'old notes' });

    await wrapper.setProps({ tag: 'v1.10.0', notes: 'new notes' });

    expect(wrapper.text()).toContain('v1.10.0');
    expect(wrapper.text()).toContain('new notes');
    expect(wrapper.text()).not.toContain('old notes');
  });

  it('renders markdown release bodies as plain text', () => {
    const wrapper = createWrapper({
      tag: 'v1.9.0',
      notes: [
        '## What changed',
        '* **Bold** item',
        '* [A link](https://example.com)',
        'https://github.com/o/r/pull/42',
      ].join('\n'),
    });

    const text = wrapper.text();
    expect(text).toContain('What changed');
    expect(text).toContain('• Bold item');
    expect(text).toContain('• A link');
    expect(text).toContain('#42');
    expect(text).not.toContain('**');
    expect(text).not.toContain('##');
  });
});
