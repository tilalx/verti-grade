<template>
    <div>
        <v-btn @click="dialog = true" color="error" dark>
            <v-icon>mdi-delete</v-icon>
        </v-btn>
        <v-dialog v-model="dialog" max-width="500px">
            <v-card>
                <v-card-title class="headline">Confirm Delete</v-card-title>
                <v-card-text>
                    Are you sure you want to delete this comment?
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn @click="dialog = false">Cancel</v-btn>
                    <v-btn color="red darken-1" text @click="deleteComment"
                        >Delete</v-btn
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
const supabase = useSupabaseClient()

const deleteComment = async () => {
    const { error } = await supabase
        .from('ratings')
        .delete()
        .eq('id', props.commentId)

    if (error) {
        console.error(error)
    } else {
        emit('comment-deleted')
        dialog.value = false
    }
}
</script>
