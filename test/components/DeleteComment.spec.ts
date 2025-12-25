import { mount } from '@vue/test-utils';
import DeleteComment from '~/components/comments/DeleteComment.vue';

const buttonStub = {
  template: '<button @click="$emit(\'click\')"><slot /></button>',
};

const dialogStub = {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: '<div><slot /></div>',
};

const cardStub = { template: '<div><slot /></div>' };

function createWrapper() {
  return mount(DeleteComment, {
    props: {
      commentId: 'comment-1',
    },
    global: {
      stubs: {
        'v-btn': buttonStub,
        'v-icon': cardStub,
        'v-dialog': dialogStub,
        'v-card': cardStub,
        'v-card-title': cardStub,
        'v-card-text': cardStub,
        'v-card-actions': cardStub,
        'v-spacer': cardStub,
      },
      mocks: {
        $t: (key: string) => key,
      },
    },
  });
}

describe('DeleteComment', () => {
  it('calls PocketBase delete and closes the dialog on success', async () => {
    const deleteMock = vi.fn().mockResolvedValue(undefined);
    const collectionMock = vi.fn().mockReturnValue({
      delete: deleteMock,
    });
    globalThis.__POCKETBASE_CLIENT__ = {
      collection: collectionMock,
    };

    const wrapper = createWrapper();
    const vm = wrapper.vm as unknown as {
      dialog: boolean;
      deleteComment: () => Promise<void>;
    };

    vm.dialog = true;
    await vm.deleteComment();

    expect(collectionMock).toHaveBeenCalledWith('ratings');
    expect(deleteMock).toHaveBeenCalledWith('comment-1');
    expect(vm.dialog).toBe(false);
  });

  it('logs an error when deletion fails but keeps the dialog open', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const deleteMock = vi.fn().mockRejectedValue(new Error('network'));
    globalThis.__POCKETBASE_CLIENT__ = {
      collection: vi.fn().mockReturnValue({ delete: deleteMock }),
    };

    const wrapper = createWrapper();
    const vm = wrapper.vm as unknown as {
      dialog: boolean;
      deleteComment: () => Promise<void>;
    };

    vm.dialog = true;
    await vm.deleteComment();

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error deleting comment:',
      expect.any(Error),
    );
    expect(vm.dialog).toBe(true);
    consoleSpy.mockRestore();
  });
});
