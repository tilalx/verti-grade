<template>
    <div>
        <!-- Hidden file input -->
        <input
            ref="fileInput"
            type="file"
            style="display: none"
            accept="application/json"
            data-testid="import-route-file-input"
            @change="handleFileChange"
        />

        <!-- Import Preview Dialog -->
        <LayoutDialogShell
            v-model="showPreviewDialog"
            max-width="900"
            persistent
            :title="$t('importRoutes.title')"
            data-testid="import-route-dialog"
        >
            <p class="mb-4 text-body-medium text-medium-emphasis">
                {{ $t('importRoutes.intro') }}
            </p>

            <v-data-table
                v-model:expanded="expanded"
                :headers="previewHeaders"
                :items="routesToImport"
                item-value="name"
                show-expand
            >
                <template #item.color="{ item }">
                    <v-avatar :color="item.color" size="24" />
                </template>

                <template #item.ratings="{ item }">
                    {{ item.ratings?.length || 0 }}
                </template>

                <template #expanded-row="{ columns, item }">
                    <tr>
                        <td :colspan="columns.length">
                            <v-card
                                v-if="item.ratings?.length"
                                class="my-4"
                                border
                                flat
                            >
                                <v-card-title class="text-body-large">
                                    {{
                                        $t('importRoutes.ratingsFor', {
                                            name: item.name,
                                        })
                                    }}
                                </v-card-title>
                                <v-list density="compact">
                                    <v-list-item
                                        v-for="(rating, i) in item.ratings"
                                        :key="i"
                                    >
                                        <v-list-item-title>
                                            <strong
                                                >{{
                                                    $t(
                                                        'importRoutes.ratingLabel',
                                                    )
                                                }}:</strong
                                            >
                                            {{ rating.rating }}/5,
                                            <strong
                                                >{{
                                                    $t(
                                                        'importRoutes.difficultyLabel',
                                                    )
                                                }}:</strong
                                            >
                                            {{ rating.difficulty }}
                                        </v-list-item-title>
                                        <v-list-item-subtitle>
                                            {{
                                                rating.comment ||
                                                $t('importRoutes.noComment')
                                            }}
                                        </v-list-item-subtitle>
                                    </v-list-item>
                                </v-list>
                            </v-card>
                            <p
                                v-else
                                class="text-center pa-4 text-body-medium text-medium-emphasis"
                            >
                                {{ $t('importRoutes.noRatings') }}
                            </p>
                        </td>
                    </tr>
                </template>
            </v-data-table>

            <template #actions>
                <v-btn
                    variant="text"
                    data-testid="import-route-cancel"
                    @click="cancelImport"
                >
                    {{ $t('actions.cancel') }}
                </v-btn>
                <v-spacer />
                <v-btn
                    color="primary"
                    :loading="loading"
                    data-testid="import-route-confirm"
                    @click="confirmImport"
                >
                    {{ $t('importRoutes.confirm') }}
                </v-btn>
            </template>
        </LayoutDialogShell>
    </div>
</template>
<script setup>
const pb = usePocketbase()
const emit = defineEmits(['closed'])
const currentUser = pb.authStore.model

const fileInput = ref(null)
const showPreviewDialog = ref(false)
const loading = ref(false)
const routesToImport = ref([])
const expanded = ref([])

const { t } = useI18n()
const { notify, error: notifyError } = useNotification()

const previewHeaders = computed(() => [
    { title: t('climbing.color'), value: 'color', sortable: false },
    { title: t('routes.name'), value: 'name' },
    { title: t('climbing.difficulty'), value: 'difficulty' },
    { title: t('climbing.anchor_point'), value: 'anchor_point' },
    { title: t('climbing.location'), value: 'location' },
    { title: t('importRoutes.ratingsCount'), value: 'ratings' },
])

const open = () => {
    fileInput.value.click()
}

defineExpose({ open })

const handleFileChange = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
        try {
            const parsedData = JSON.parse(reader.result)
            if (!Array.isArray(parsedData)) {
                throw new Error('JSON file is not an array.')
            }
            routesToImport.value = parsedData.map((route) => ({
                ...route,
                ratingsCount: route.ratings?.length || 0,
            }))
            showPreviewDialog.value = true
        } catch (error) {
            console.error('Error parsing JSON file:', error)
            notifyError(t('importRoutes.invalidJson'))
        }
    }
    reader.onerror = () => {
        notifyError(t('importRoutes.readFailed'))
    }
    reader.readAsText(file)

    event.target.value = ''
}

const cancelImport = () => {
    showPreviewDialog.value = false
    routesToImport.value = []
}

const confirmImport = async () => {
    loading.value = true
    const jsonData = routesToImport.value

    try {
        const fallbackCreator = buildFallbackCreator(currentUser)
        const routeErrors = []
        const ratingErrors = []

        for (const route of jsonData) {
            try {
                const createdRoute = await pb
                    .collection('routes')
                    .create(sanitizeRoutePayload(route, fallbackCreator))

                if (Array.isArray(route.ratings) && route.ratings.length > 0) {
                    for (const rating of route.ratings) {
                        try {
                            await pb.collection('ratings').create(
                                sanitizeRatingPayload(rating, {
                                    routeId: createdRoute.id,
                                    fallbackUserId: currentUser?.id,
                                }),
                            )
                        } catch (ratingError) {
                            console.error(
                                'Failed to insert rating',
                                ratingError,
                            )
                            ratingErrors.push({
                                routeName: route.name,
                                message:
                                    ratingError?.message ??
                                    'Unknown rating error',
                            })
                        }
                    }
                }
            } catch (routeError) {
                console.error('Failed to insert route', routeError)
                routeErrors.push({
                    routeName: route?.name ?? 'Unnamed Route',
                    message: routeError?.message ?? 'Unknown route error',
                })
            }
        }

        if (routeErrors.length === 0 && ratingErrors.length === 0) {
            notify(t('importRoutes.success'))
        } else {
            const summaryParts = []
            if (routeErrors.length > 0) {
                summaryParts.push(
                    t('importRoutes.routesFailed', {
                        count: routeErrors.length,
                    }),
                )
            }
            if (ratingErrors.length > 0) {
                summaryParts.push(
                    t('importRoutes.commentsFailed', {
                        count: ratingErrors.length,
                    }),
                )
            }
            notify(
                t('importRoutes.issues', { details: summaryParts.join(', ') }),
                'warning',
            )
        }

        emit('closed')
    } catch (error) {
        console.error('Error during import:', error)
        notifyError(error.message || t('importRoutes.failed'))
    } finally {
        loading.value = false
        cancelImport()
    }
}

function sanitizeRoutePayload(route, fallbackCreator) {
    const normalizeSign = (value) => {
        if (value === true || value === false || value === null) {
            return value
        }
        const sign = typeof value === 'string' ? value.trim() : ''
        return sign === '+' ? true : sign === '-' ? false : null
    }

    const numericDifficulty = Number(route.difficulty)
    const normalizedCreators = Array.isArray(route.creator)
        ? route.creator
              .map((value) => (typeof value === 'string' ? value.trim() : ''))
              .filter(Boolean)
        : typeof route.creator === 'string'
          ? route.creator
                .split(',')
                .map((value) => value.trim())
                .filter(Boolean)
          : []

    return {
        name: typeof route.name === 'string' ? route.name : '',
        difficulty: Number.isFinite(numericDifficulty) ? numericDifficulty : 0,
        difficulty_sign: normalizeSign(route.difficulty_sign),
        anchor_point: Number.isFinite(Number(route.anchor_point))
            ? Number(route.anchor_point)
            : null,
        location: route.location || null,
        type: route.type || null,
        comment: typeof route.comment === 'string' ? route.comment : '',
        creator:
            normalizedCreators.length > 0
                ? normalizedCreators
                : fallbackCreator
                  ? [fallbackCreator]
                  : [],
        screw_date: route.screw_date || null,
        color: route.color || null,
        archived: Boolean(route.archived),
    }
}

function sanitizeRatingPayload(rating, meta) {
    const normalizeSign = (value) => {
        if (value === true || value === false || value === null) {
            return value
        }
        const sign = typeof value === 'string' ? value.trim() : ''
        return sign === '+' ? true : sign === '-' ? false : null
    }

    const payload = {
        route_id: meta.routeId,
        rating: Number.isFinite(Number(rating.rating))
            ? Number(rating.rating)
            : null,
        difficulty: Number.isFinite(Number(rating.difficulty))
            ? Number(rating.difficulty)
            : 0,
        difficulty_sign: normalizeSign(rating.difficulty_sign),
        comment: typeof rating.comment === 'string' ? rating.comment : '',
    }

    const userId = rating.user || meta.fallbackUserId
    if (userId) {
        payload.user = userId
    }

    return payload
}

function buildFallbackCreator(user) {
    if (!user) {
        return 'Imported'
    }

    const candidates = [
        user.name,
        `${user.firstname ?? ''} ${user.lastname ?? ''}`.trim(),
        user.username,
        user.email,
    ].filter((value) => typeof value === 'string' && value.trim())

    return candidates[0] || 'Imported'
}
</script>
