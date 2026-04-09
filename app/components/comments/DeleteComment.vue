<template>
    <div>
        <v-btn icon color="error" size="small" @click="dialog = true">
            <v-icon>mdi-delete</v-icon>
        </v-btn>
        <ConfirmDialog
            v-model="dialog"
            :title="$t('actions.confirm')"
            :message="$t('notifications.deleteItem')"
            :loading="deleting"
            @confirm="deleteComment"
        />
    </div>
</template>

<script setup>
const props = defineProps({
    commentId: {
        type: String,
        required: true,
    },
})

const emit = defineEmits(['comment-deleted'])

const dialog = ref(false)
const deleting = ref(false)
const pb = usePocketbase()

const deleteComment = async () => {
    deleting.value = true
    try {
        await pb.collection('ratings').delete(props.commentId)
        dialog.value = false
        emit('comment-deleted')
    } catch (error) {
        console.error('Error deleting comment:', error)
    } finally {
        deleting.value = false
    }
}
</script>
