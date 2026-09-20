<template>
    <v-card
        variant="tonal"
        class="list-card comment-card"
        :data-testid="`comment-card-${comment.id}`"
    >
        <!-- Header: [checkbox?] avatar · name + date · star rating -->
        <div class="list-card__header">
            <v-checkbox
                v-if="selectable"
                :model-value="selected"
                color="primary"
                hide-details
                density="compact"
                class="list-card__checkbox"
                data-testid="comment-card-checkbox"
                @update:modelValue="$emit('toggle-select')"
            />
            <v-avatar
                size="32"
                :color="
                    comment.userAvatar
                        ? undefined
                        : avatarColor(comment.userName)
                "
                class="flex-shrink-0"
            >
                <v-img
                    v-if="comment.userAvatar"
                    :src="comment.userAvatar"
                    :alt="comment.userName"
                    cover
                />
                <span v-else class="text-caption font-weight-bold text-white">
                    {{ initials(comment.userName) }}
                </span>
            </v-avatar>

            <div class="list-card__title">
                <span class="list-card__name">{{ comment.userName }}</span>
                <span class="comment-card__date">{{ formattedDate }}</span>
            </div>

            <!-- Static star row: far cheaper than a readonly v-rating -->
            <div
                v-if="comment.rating != null"
                class="flex-shrink-0 comment-card__rating"
                role="img"
                :aria-label="`${comment.rating}/5`"
            >
                <v-icon
                    v-for="star in 5"
                    :key="star"
                    size="18"
                    :color="
                        star <= comment.rating
                            ? 'yellow-darken-2'
                            : 'grey-lighten-2'
                    "
                >
                    {{
                        star <= comment.rating ? 'mdi-star' : 'mdi-star-outline'
                    }}
                </v-icon>
            </div>
        </div>

        <v-divider />

        <!-- Meta section -->
        <div class="list-card__meta">
            <!-- Comment text -->
            <div
                v-if="comment.comment"
                class="list-card__meta-row list-card__meta-row--full"
            >
                <v-icon size="15" class="list-card__meta-icon"
                    >mdi-comment-text-outline</v-icon
                >
                <div class="comment-card__comment-wrap">
                    <span
                        ref="commentEl"
                        class="comment-card__comment"
                        :class="{
                            'comment-card__comment--collapsed':
                                collapsible && !expanded,
                        }"
                        >{{ comment.comment }}</span
                    >
                    <!-- Wrapped rather than `d-block`: that forces display:block
                         on the button and collapses Vuetify's flex height. -->
                    <div v-if="collapsible && isLong" class="mt-1">
                        <!-- No `density="compact"`: in Vuetify 4 it subtracts 12px,
                             leaving an x-small button 8px tall and clipping its
                             own label. -->
                        <v-btn
                            variant="text"
                            size="x-small"
                            :color="expanded ? 'default' : 'primary'"
                            class="px-0 text-none"
                            data-testid="comment-card-toggle"
                            @click="expanded = !expanded"
                        >
                            {{
                                expanded
                                    ? t('comments.showLess')
                                    : t('comments.showMore')
                            }}
                        </v-btn>
                    </div>
                </div>
            </div>

            <!-- Route row (admin view) -->
            <div
                v-if="showRoute && comment.routeName"
                class="list-card__meta-row list-card__meta-row--full"
            >
                <v-icon size="15" class="list-card__meta-icon"
                    >mdi-routes</v-icon
                >
                <NuxtLink
                    v-if="comment.routeId"
                    :to="`/route?id=${comment.routeId}`"
                    class="comment-card__route-link text-body-2 font-weight-medium text-primary text-decoration-none"
                >
                    {{ comment.routeName }}
                </NuxtLink>
                <span v-else class="text-body-2 font-weight-medium">{{
                    comment.routeName
                }}</span>
            </div>

            <!-- Pills: location · difficulty -->
            <div class="list-card__pills">
                <span v-if="comment.location" class="list-card__pill">
                    <v-icon size="13">mdi-map-marker-outline</v-icon>
                    {{ comment.location }}
                </span>
                <v-tooltip
                    v-if="comment.difficultyLabel"
                    location="top"
                    :text="t('ratings.perceived_difficulty')"
                >
                    <template #activator="{ props: tooltipProps }">
                        <span
                            v-bind="tooltipProps"
                            class="list-card__pill comment-card__pill--primary"
                        >
                            <v-icon size="13">mdi-gauge</v-icon>
                            {{ t('ratings.felt') }}
                            {{ comment.difficultyLabel }}
                        </span>
                    </template>
                </v-tooltip>
            </div>
        </div>

        <v-card-actions v-if="$slots.actions" class="list-card__actions">
            <v-spacer />
            <slot name="actions" />
        </v-card-actions>
    </v-card>
</template>

<script setup lang="ts">
export interface CommentCardItem {
    id: string
    userName: string
    userAvatar?: string | null
    rating?: number | null
    created: string
    comment?: string | null
    difficultyLabel?: string | null
    routeName?: string | null
    routeId?: string | null
    location?: string | null
}

const props = withDefaults(
    defineProps<{
        comment: CommentCardItem
        selectable?: boolean
        selected?: boolean
        showRoute?: boolean
        dateFormat?: 'relative' | 'absolute'
        collapsible?: boolean
    }>(),
    {
        selectable: false,
        selected: false,
        showRoute: false,
        dateFormat: 'absolute',
        collapsible: true,
    },
)

defineEmits<{
    (e: 'toggle-select'): void
}>()

const { t, locale } = useI18n()

// ── Collapse ────────────────────────────────────────────────────────────────

const expanded = ref(false)
const commentEl = ref<HTMLElement | null>(null)
const isLong = ref(false)

// A character count can't predict how many lines the text wraps to, so measure
// the clamped element instead: overflow means the clamp actually hides
// something. ponytail: measured once on mount, not on resize — re-measure with
// a ResizeObserver if cards start resizing after load.
onMounted(async () => {
    await nextTick()
    const el = commentEl.value
    if (el) isLong.value = el.scrollHeight > el.clientHeight + 1
})

// ── Date ────────────────────────────────────────────────────────────────────

const formattedDate = computed(() => {
    const d = props.comment.created
    if (!d) return '—'
    if (props.dateFormat === 'relative') return timeAgo(d)
    return new Date(d).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
})

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60_000)
    const hours = Math.floor(diff / 3_600_000)
    const days = Math.floor(diff / 86_400_000)
    if (mins < 1) return t('time.justNow')
    if (mins < 60) return t('time.minutesAgo', { n: mins })
    if (hours < 24) return t('time.hoursAgo', { n: hours })
    if (days < 30) return t('time.daysAgo', { n: days })
    return new Date(dateStr).toLocaleDateString(locale.value, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}

// ── Avatar ──────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
    'primary',
    'secondary',
    'success',
    'info',
    'deep-purple',
    'teal',
    'indigo',
    'pink',
    'cyan',
    'orange',
]

function avatarColor(name: string): string {
    if (!name) return 'primary'
    const code = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
    return AVATAR_COLORS[code % AVATAR_COLORS.length]
}

function initials(name: string): string {
    if (!name) return '?'
    return name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0]?.toUpperCase() ?? '')
        .join('')
}
</script>

<style scoped>
/* Structure lives in .list-card (main.css); only comment-specific bits here. */
.comment-card__date {
    font-size: 0.75rem;
    color: rgba(var(--v-theme-on-surface), 0.55);
    line-height: 1.2;
}

.comment-card__comment-wrap {
    flex: 1;
    min-width: 0;
}

/* Full text, wrapped — collapsed to four lines until the user expands it. */
.comment-card__comment {
    font-size: 0.8rem;
    color: rgba(var(--v-theme-on-surface), 0.7);
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.5;
}

.comment-card__comment--collapsed {
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.comment-card__route-link:hover {
    text-decoration: underline !important;
}

.comment-card__pill--primary {
    color: rgb(var(--v-theme-primary));
    background: rgba(var(--v-theme-primary), 0.08);
}

/* Deltas from the shared shell: the taller line-height here needs one more
   pixel of icon offset, and the pill row is indented to line up with the
   text column (icon 15px + gap 7px). */
.comment-card .list-card__meta-icon {
    margin-top: 3px;
}

.comment-card .list-card__pills {
    padding-left: 22px;
}

.comment-card .list-card__pill :deep(.v-icon) {
    margin-top: 1px;
}
</style>
