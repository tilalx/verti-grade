<template>
    <v-container>
        <v-row>
            <v-col cols="12" md="4">
                <v-text-field
                    :label="$t('climbing.searchRouteName')"
                    v-model="search"
                    prepend-inner-icon="mdi-magnify"
                    clearable
                    hide-details
                    density="comfortable"
                ></v-text-field>
            </v-col>
            <v-col cols="6" sm="4" md="4">
                <v-select
                    :label="$t('climbing.difficulty')"
                    :items="difficulties"
                    v-model="selectedDifficulty"
                    item-title="text"
                    item-value="value"
                    clearable
                    hide-details
                    density="comfortable"
                ></v-select>
            </v-col>
            <v-col cols="6" sm="4" md="4">
                <v-select
                    :label="$t('climbing.location')"
                    :items="locations"
                    v-model="selectedLocation"
                    item-title="text"
                    item-value="value"
                    clearable
                    hide-details
                    density="comfortable"
                ></v-select>
            </v-col>
        </v-row>

        <v-data-table
            :headers="headers"
            :items="filteredComments"
            :items-per-page="20"
            :loading="loading"
            item-key="id"
            class="mt-4"
        >
            <template v-slot:item.routeName="{ item }">
                <NuxtLink :to="`/route?id=${item.expand.route_id.id}`" class="text-decoration-none">
                    {{ item.routeName }}
                </NuxtLink>
            </template>

            <template v-slot:item.rating="{ item }">
                <template v-if="editingComment === item.id">
                    <v-select
                        v-model="editedComment.rating"
                        :items="[1, 2, 3, 4, 5]"
                        density="compact"
                        hide-details
                        style="max-width: 80px;"
                    ></v-select>
                </template>
                <v-rating
                    v-else
                    v-model="item.rating"
                    readonly
                    dense
                    half-increments
                    size="small"
                ></v-rating>
            </template>

            <template v-slot:item.difficulty="{ item }">
                <template v-if="editingComment === item.id">
                    <v-select
                        v-model="editedComment.difficulty"
                        :items="[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]"
                        density="compact"
                        hide-details
                        style="max-width: 80px;"
                    ></v-select>
                    <v-select
                        v-model="editedComment.difficulty_sign"
                        :items="difficultySignOptions"
                        item-title="label"
                        item-value="value"
                        density="compact"
                        hide-details
                        style="max-width: 80px; margin-top: 4px;"
                    ></v-select>
                </template>
                <template v-else>
                    {{ item.difficulty }}
                    {{ item.difficulty_sign === true ? '+' : item.difficulty_sign === false ? '-' : '' }}
                </template>
            </template>

            <template v-slot:item.comment="{ item }">
                <template v-if="editingComment === item.id">
                    <v-textarea
                        v-model="editedComment.comment"
                        density="compact"
                        rows="2"
                        hide-details
                        auto-grow
                    ></v-textarea>
                </template>
                <template v-else>
                    {{ item.comment }}
                </template>
            </template>
            
            <template v-slot:item.created="{ item }">
                {{ formatDate(item.created) }}
            </template>

            <template v-slot:item.actions="{ item }">
                <div class="d-flex justify-end">
                    <template v-if="editingComment === item.id">
                        <v-btn icon size="small" color="success" class="mr-1" @click="saveEdit(item)">
                            <v-icon>mdi-check</v-icon>
                        </v-btn>
                        <v-btn icon size="small" color="error" @click="cancelEdit">
                            <v-icon>mdi-close</v-icon>
                        </v-btn>
                    </template>
                    <template v-else-if="true">
                        <v-btn icon size="small" class="mr-1" @click="startEdit(item)">
                            <v-icon>mdi-pencil</v-icon>
                        </v-btn>
                        <DeleteComment
                            :commentId="item.id"
                            @comment-deleted="getComments"
                        />
                    </template>
                </div>
            </template>
        </v-data-table>

        <!-- Snackbar for feedback -->
        <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="4000" top>
            {{ snackbar.message }}
        </v-snackbar>
    </v-container>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, reactive } from 'vue'
import { useI18n, useHead } from '#imports'
import DeleteComment from '@/components/comments/DeleteComment.vue'

const { t } = useI18n()

useHead({
  title: t('page.title.comments'),
  meta: [
    {
      name: 'description',
      content: t('page.content.comments'),
    },
  ],
})

definePageMeta({
    authRequired: true,
    middleware: ['auth'],
})

const pb = usePocketbase()
const currentUser = pb.authStore.model;

const loading = ref(true)
const comments = ref([])
const selectedDifficulty = ref('')
const selectedLocation = ref('')
const search = ref('')

// Editing state
const editingComment = ref(null) // holds ID of comment being edited
const editedComment = reactive({
  id: '',
  rating: null,
  difficulty: null,
  difficulty_sign: null,
  comment: '',
})

// Snackbar state
const snackbar = reactive({
  show: false,
  message: '',
  color: 'success'
})

const difficultySignOptions = [
  { label: 'None', value: null },
  { label: '+', value: true },
  { label: '-', value: false },
]

const headers = ref([
  { title: t('climbing.routename'), key: 'routeName' },
  { title: t('ratings.score'), key: 'rating' },
  { title: t('climbing.difficulty'), key: 'difficulty' },
  { title: t('climbing.comment'), key: 'comment' },
  { title: t('table.created_at'), key: 'created' },
  { title: t('table.actions'), key: 'actions', align: 'end', sortable: false },
])

const difficulties = ref([
  { text: t('filter.all'), value: '' },
  ...Array.from({ length: 10 }, (_, i) => ({ text: (i + 1).toString(), value: i + 1 })),
])

const locations = ref([
  { text: t('filter.all'), value: '' },
  { text: 'Hanau', value: 'Hanau' },
  { text: 'Gelnhausen', value: 'Gelnhausen' },
])

const getComments = async () => {
  loading.value = true;
  try {
    const data = await pb.collection('ratings').getFullList({
      sort: '-created',
      expand: 'route_id,user', // Expand both route and user
    });

    comments.value = data.map((comment) => ({
      ...comment,
      routeName: comment.expand.route_id?.name || 'N/A',
      location: comment.expand.route_id?.location,
      userName: comment.expand.user?.name || 'Anonymous',
      userAvatar: comment.expand.user?.avatar ? pb.files.getURL(comment.expand.user, comment.expand.user.avatar, { thumb: '100x100' }) : null,
    }));
  } catch (error) {
    console.error("Failed to fetch comments:", error);
    showSnackbar("Error loading comments", "error");
  } finally {
    loading.value = false;
  }
}

const startEdit = (comment) => {
  // Initialize the edit form with the current values
  editedComment.id = comment.id;
  editedComment.rating = comment.rating;
  editedComment.difficulty = comment.difficulty;
  editedComment.difficulty_sign = comment.difficulty_sign;
  editedComment.comment = comment.comment;
  
  // Set the editing state
  editingComment.value = comment.id;
}

const cancelEdit = () => {
  // Clear the editing state
  editingComment.value = null;
}

const saveEdit = async () => {
  try {
    // Prepare the data to update
    const data = {
      rating: editedComment.rating,
      difficulty: editedComment.difficulty,
      difficulty_sign: editedComment.difficulty_sign,
      comment: editedComment.comment,
    };
    
    // Update the record
    await pb.collection('ratings').update(editedComment.id, data);
    
    // Show success message
    showSnackbar("Comment updated successfully", "success");
    
    // Reset the editing state
    editingComment.value = null;
    
    // Refresh the comments list
    await getComments();
  } catch (error) {
    console.error("Error updating comment:", error);
    showSnackbar("Failed to update comment", "error");
  }
}

function showSnackbar(message, color = 'success') {
  snackbar.message = message;
  snackbar.color = color;
  snackbar.show = true;
}

let unsubscribe;
onMounted(async () => {
  await getComments();
  unsubscribe = await pb.collection('ratings').subscribe('*', getComments);
})

onBeforeUnmount(() => {
  if (unsubscribe) {
    unsubscribe();
  }
});

const formatDate = (date) => {
  if (!date) return null
  return new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

const filteredComments = computed(() => {
  return comments.value.filter(comment => {
    const difficultyMatch = !selectedDifficulty.value || comment.difficulty === selectedDifficulty.value;
    const locationMatch = !selectedLocation.value || comment.location === selectedLocation.value;
    const searchMatch = !search.value || 
      comment.routeName.toLowerCase().includes(search.value.toLowerCase()) ||
      comment.comment.toLowerCase().includes(search.value.toLowerCase()) ||
      (comment.userName && comment.userName.toLowerCase().includes(search.value.toLowerCase()));

    return difficultyMatch && locationMatch && searchMatch;
  });
})
</script>