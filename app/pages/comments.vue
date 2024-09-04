<template>
    <v-app>
        <v-main>
            <v-container>
                <v-row>
                    <v-col cols="6" sm="3">
                        <v-text-field
                            :label="$t('climbing.searchRouteName')"
                            v-model="searchRouteName"
                            class="mt-2"
                        ></v-text-field>
                    </v-col>
                    <v-col cols="6" sm="3">
                        <v-select
                            :label="$t('climbing.difficulty')"
                            :items="difficulties"
                            v-model="selectedDifficulty"
                            item-title="text"
                            item-value="value"
                            class="mt-2"
                        ></v-select>
                    </v-col>

                    <!-- Column for the Location select -->
                    <v-col cols="6" sm="3">
                        <v-select
                            :label="$t('climbing.location')"
                            :items="locations"
                            v-model="selectedLocation"
                            item-title="text"
                            item-value="value"
                            class="mt-2"
                        ></v-select>
                    </v-col>
                </v-row>
                <v-data-table
                    :headers="headers"
                    :items="filteredComments"
                    :items-per-page="50"
                    item-key="id"
                >
                    <template v-slot:[`item`]="{ item: comment }">
                        <tr>
                            <td>{{ comment.routeName }}</td>
                            <td>{{ comment.rating }} /5</td>
                            <td>
                                {{ comment.difficulty }}
                                {{
                                    comment.difficulty_sign
                                        ? '+'
                                        : comment.difficulty_sign === false
                                          ? '-'
                                          : null
                                }}
                            </td>
                            <td>{{ comment.comment }}</td>
                            <td>{{ formatDate(comment.created) }}</td>
                            <td>
                                <DeleteComment
                                    :commentId="comment.id"
                                ></DeleteComment>
                            </td>
                        </tr>
                    </template>
                </v-data-table>
            </v-container>
        </v-main>
    </v-app>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n, useHead } from '#imports'
import DeleteComment from '@/components/comments/DeleteComment.vue'

const { t } = useI18n()

useHead({
  title: t('page.title.comments'),
  meta: [
    {
      name: 'description',
      content: t('page.content.comments'),
      authRequired: false,
    },
  ],
})

definePageMeta({
    authRequired: true,
    middleware: ['auth'],
})

const pb = usePocketbase()
const comments = ref([])
const selectedDifficulty = ref('')
const selectedLocation = ref('')
const searchRouteName = ref('')

const headers = ref([
  { title: t('climbing.routename'), value: 'routeName' },
  { title: t('ratings.score'), value: 'rating' },
  { title: t('climbing.difficulty'), value: 'difficulty' },
  { title: t('climbing.comment'), value: 'comment' },
  { title: t('table.created_at'), value: 'created_at' },
  { title: t('table.actions'), value: 'actions' },
])

const difficulties = ref([
  { text: t('filter.all'), value: '' },
  { text: '1', value: '1' },
  { text: '2', value: '2' },
  { text: '3', value: '3' },
  { text: '4', value: '4' },
  { text: '5', value: '5' },
  { text: '6', value: '6' },
  { text: '7', value: '7' },
  { text: '8', value: '8' },
  { text: '9', value: '9' },
  { text: '10', value: '10' },
])

const locations = ref([
  { text: t('filter.all'), value: '' },
  { text: 'Hanau', value: 'Hanau' },
  { text: 'Gelnhausen', value: 'Gelnhausen' },
])

const getComments = async () => {
  const data = await pb.collection('ratings').getFullList({
    sort: '-created',
    expand: 'route_id',
  })

  comments.value = data.map((comment) => ({
    ...comment,
    routeName: comment.expand.route_id.name,
    location: comment.expand.route_id.location,
    difficulty: comment.difficulty,
    difficulty_sign: comment.difficulty_sign,
  }))
}

pb.collection('ratings').subscribe('*', () => {
  getComments()
})

onMounted(() => {
  getComments()
})

const formatDate = (date) => {
  if (!date) return null
  const d = new Date(date)
  let day = '' + d.getDate(),
    month = '' + (d.getMonth() + 1),
    year = d.getFullYear()

  if (day.length < 2) day = '0' + day
  if (month.length < 2) month = '0' + month

  return [day, month, year].join('.')
}

const filteredComments = computed(() => {
  let filteredComments = comments.value

  if (selectedDifficulty.value) {
    const selectedDifficultyInt = parseInt(selectedDifficulty.value)
    filteredComments = filteredComments.filter(
      (comment) => parseInt(comment.difficulty) === selectedDifficultyInt
    )
  }
  if (selectedLocation.value) {
    filteredComments = filteredComments.filter(
      (comment) => comment.location === selectedLocation.value
    )
  }
  if (searchRouteName.value) {
    filteredComments = filteredComments.filter((comment) =>
      comment.routeName
        .toLowerCase()
        .includes(searchRouteName.value.toLowerCase()) ||
      comment.comment
        .toLowerCase()
        .includes(searchRouteName.value.toLowerCase())
    )
  }

  return filteredComments
})
</script>