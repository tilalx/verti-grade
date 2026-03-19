<template>
    <v-container fluid>
        <v-row>
            <v-col cols="12" md="4">
                <v-text-field
                    v-model="search"
                    :label="$t('climbing.searchRouteName')"
                    prepend-inner-icon="mdi-magnify"
                    clearable
                    hide-details
                    density="comfortable"
                />
            </v-col>
            <v-col cols="6" sm="4" md="4">
                <v-select
                    v-model="selectedDifficulty"
                    :label="$t('climbing.difficulty')"
                    :items="difficulties"
                    item-title="text"
                    item-value="value"
                    clearable
                    hide-details
                    density="comfortable"
                />
            </v-col>
            <v-col cols="6" sm="4" md="4">
                <v-select
                    v-model="selectedLocation"
                    :label="$t('climbing.location')"
                    :items="locations"
                    item-title="text"
                    item-value="value"
                    clearable
                    hide-details
                    density="comfortable"
                />
            </v-col>
        </v-row>

        <v-data-table
            :headers="headers"
            :items="filteredComments"
            :items-per-page="20"
            :loading="loading"
            item-value="id"
            class="mt-4"
        >
            <template #item.routeName="{ item }">
                <NuxtLink :to="`/route?id=${item.expand?.route_id?.id}`" class="text-decoration-none">
                    {{ item.routeName }}
                </NuxtLink>
            </template>

            <template #item.rating="{ item }">
                <v-select
                    v-if="editingComment === item.id"
                    v-model="editedComment.rating"
                    :items="[1, 2, 3, 4, 5]"
                    density="compact"
                    hide-details
                    style="max-width: 80px"
                />
                <v-rating
                    v-else
                    v-model="item.rating"
                    readonly
                    half-increments
                    density="compact"
                    size="small"
                />
            </template>

            <template #item.difficulty="{ item }">
                <template v-if="editingComment === item.id">
                    <v-select
                        v-model="editedComment.difficulty"
                        :items="[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]"
                        density="compact"
                        hide-details
                        style="max-width: 80px"
                    />
                    <v-select
                        v-model="editedComment.difficulty_sign"
                        :items="difficultySignOptions"
                        item-title="label"
                        item-value="value"
                        density="compact"
                        hide-details
                        style="max-width: 80px; margin-top: 4px"
                    />
                </template>
                <template v-else>
                    {{ item.difficulty }}{{ item.difficulty_sign === true ? '+' : item.difficulty_sign === false ? '-' : '' }}
                </template>
            </template>

            <template #item.comment="{ item }">
                <v-textarea
                    v-if="editingComment === item.id"
                    v-model="editedComment.comment"
                    density="compact"
                    rows="2"
                    hide-details
                    auto-grow
                />
                <template v-else>{{ item.comment }}</template>
            </template>

            <template #item.created="{ item }">
                {{ formatDate(item.created) }}
            </template>

            <template #item.actions="{ item }">
                <div class="d-flex justify-end">
                    <template v-if="editingComment === item.id">
                        <v-btn icon size="small" color="success" class="mr-1" @click="saveEdit">
                            <v-icon>mdi-check</v-icon>
                        </v-btn>
                        <v-btn icon size="small" @click="cancelEdit">
                            <v-icon>mdi-close</v-icon>
                        </v-btn>
                    </template>
                    <template v-else>
                        <v-btn icon size="small" class="mr-1" @click="startEdit(item)">
                            <v-icon>mdi-pencil</v-icon>
                        </v-btn>
                        <DeleteComment :commentId="item.id" @comment-deleted="getComments" />
                    </template>
                </div>
            </template>
        </v-data-table>

        <v-snackbar v-model="snackbar.show" :color="snackbar.color" location="top" timeout="4000">
            {{ snackbar.message }}
        </v-snackbar>
    </v-container>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import DeleteComment from '@/components/comments/DeleteComment.vue'

const { t } = useI18n()

useHead({
    title: t('page.title.comments'),
    meta: [{ name: 'description', content: t('page.content.comments') }],
})

definePageMeta({
    authRequired: true,
    middleware: ['auth'],
})

const pb = usePocketbase()

const loading = ref(true)
const comments = ref([])
const selectedDifficulty = ref('')
const selectedLocation = ref('')
const search = ref('')

const editingComment = ref(null)
const editedComment = reactive({
    id: '',
    rating: null,
    difficulty: null,
    difficulty_sign: null,
    comment: '',
})

const snackbar = reactive({
    show: false,
    message: '',
    color: 'success',
})

const difficultySignOptions = [
    { label: '—', value: null },
    { label: '+', value: true },
    { label: '-', value: false },
]

const headers = computed(() => [
    { title: t('climbing.routename'), key: 'routeName' },
    { title: t('ratings.score'), key: 'rating' },
    { title: t('climbing.difficulty'), key: 'difficulty' },
    { title: t('climbing.comment'), key: 'comment' },
    { title: t('table.created_at'), key: 'created' },
    { title: t('table.actions'), key: 'actions', align: 'end', sortable: false },
])

const difficulties = computed(() => [
    { text: t('filter.all'), value: '' },
    ...Array.from({ length: 10 }, (_, i) => ({ text: String(i + 1), value: i + 1 })),
])

const locations = computed(() => [
    { text: t('filter.all'), value: '' },
    { text: 'Hanau', value: 'Hanau' },
    { text: 'Gelnhausen', value: 'Gelnhausen' },
])

const showSnackbar = (message, color = 'success') => {
    snackbar.message = message
    snackbar.color = color
    snackbar.show = true
}

const getComments = async () => {
    loading.value = true
    try {
        const data = await pb.collection('ratings').getFullList({
            sort: '-created',
            expand: 'route_id,user',
        })
        comments.value = data.map((comment) => ({
            ...comment,
            routeName: comment.expand?.route_id?.name ?? 'N/A',
            location: comment.expand?.route_id?.location ?? null,
            userName: comment.expand?.user?.name ?? 'Anonymous',
            userAvatar: comment.expand?.user?.avatar
                ? pb.files.getURL(comment.expand.user, comment.expand.user.avatar, { thumb: '100x100' })
                : null,
        }))
    } catch (error) {
        console.error('Failed to fetch comments:', error)
        showSnackbar(t('notifications.error.generic'), 'error')
    } finally {
        loading.value = false
    }
}

const startEdit = (comment) => {
    editedComment.id = comment.id
    editedComment.rating = comment.rating
    editedComment.difficulty = comment.difficulty
    editedComment.difficulty_sign = comment.difficulty_sign
    editedComment.comment = comment.comment
    editingComment.value = comment.id
}

const cancelEdit = () => {
    editingComment.value = null
}

const saveEdit = async () => {
    try {
        await pb.collection('ratings').update(editedComment.id, {
            rating: editedComment.rating,
            difficulty: editedComment.difficulty,
            difficulty_sign: editedComment.difficulty_sign,
            comment: editedComment.comment,
        })
        showSnackbar(t('notifications.success.edit'))
        editingComment.value = null
        await getComments()
    } catch (error) {
        console.error('Error updating comment:', error)
        showSnackbar(t('notifications.error.generic'), 'error')
    }
}

const formatDate = (date) => {
    if (!date) return null
    return new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

const filteredComments = computed(() =>
    comments.value.filter((comment) => {
        const difficultyMatch = !selectedDifficulty.value || comment.difficulty === selectedDifficulty.value
        const locationMatch = !selectedLocation.value || comment.location === selectedLocation.value
        const term = search.value?.toLowerCase() ?? ''
        const searchMatch =
            !term ||
            comment.routeName?.toLowerCase().includes(term) ||
            comment.comment?.toLowerCase().includes(term) ||
            comment.userName?.toLowerCase().includes(term)
        return difficultyMatch && locationMatch && searchMatch
    }),
)

let unsubscribe
onMounted(async () => {
    await getComments()
    unsubscribe = await pb.collection('ratings').subscribe('*', getComments)
})

onBeforeUnmount(() => {
    unsubscribe?.()
})
</script>
