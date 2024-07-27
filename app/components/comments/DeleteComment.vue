<template>
    <div>
        <v-btn @click="dialog = true" color="error" dark>
            <v-icon>mdi-delete</v-icon>
        </v-btn>
        <v-dialog v-model="dialog" max-width="500px">
            <v-card>
                <v-card-title class="headline">{{ $t('actions.confirm') }}</v-card-title>
                <v-card-text>
                    {{ $t('notifications.deleteItem') }}
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn @click="dialog = false">{{ $t('actions.cancel') }}</v-btn>
                    <v-btn color="red darken-1" text @click="deleteComment"
                        >{{ $t('actions.delete') }}</v-btn
                    >
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
    commentId: {
        type: String,
        required: true,
    },
})

const emit = defineEmits(['comment-deleted'])

const dialog = ref(false)
const pb = usePocketbase()

const deleteComment = async () => {
    try {
        await pb.collection('ratings').delete(props.commentId)
        dialog.value = false
    } catch (error) {
        console.error('Error deleting comment:', error)
    }
}
</script>
