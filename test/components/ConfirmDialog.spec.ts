import { mount } from '@vue/test-utils';
import ConfirmDialog from '~/components/shared/ConfirmDialog.vue';

const dialogStub = {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: '<div><slot /></div>',
};

const simpleSlotStub = { template: '<div><slot /></div>' };
const buttonStub = {
  template: '<button @click="$emit(\'click\')"><slot /></button>',
};

type ConfirmDialogVM = {
  open: (title: string, message: string, options?: Record<string, unknown>) => Promise<boolean>;
  dialog: boolean;
  title: string;
  message: string;
  options: { color: string; width: number };
  agree: () => void;
  cancel: () => void;
};

function createWrapper() {
  return mount(ConfirmDialog, {
    global: {
      mocks: {
        $t: (key: string) => key,
      },
      stubs: {
        'v-dialog': dialogStub,
        'v-card': simpleSlotStub,
        'v-toolbar': simpleSlotStub,
        'v-toolbar-title': simpleSlotStub,
        'v-card-text': simpleSlotStub,
        'v-card-actions': simpleSlotStub,
        'v-btn': buttonStub,
        'v-spacer': simpleSlotStub,
      },
    },
  });
}

describe('ConfirmDialog', () => {
  it('opens a dialog and merges custom options', async () => {
    const wrapper = createWrapper();
    const vm = wrapper.vm as unknown as ConfirmDialogVM;
    const promise = vm.open(
      'Delete route',
      'Do you really want to delete this route?',
      { color: 'error', width: 520 },
    );

    expect(vm.dialog).toBe(true);
    expect(vm.title).toBe('Delete route');
    expect(vm.message).toBe('Do you really want to delete this route?');
    expect(vm.options).toMatchObject({
      color: 'error',
      width: 520,
    });

    vm.agree();
    await expect(promise).resolves.toBe(true);
    expect(vm.dialog).toBe(false);
  });

  it('resolves false when the dialog is cancelled', async () => {
    const wrapper = createWrapper();
    const vm = wrapper.vm as unknown as ConfirmDialogVM;
    const promise = vm.open('Confirm', 'Please confirm');

    vm.cancel();

    await expect(promise).resolves.toBe(false);
    expect(vm.dialog).toBe(false);
  });
});
