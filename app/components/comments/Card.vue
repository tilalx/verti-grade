<template>
    <v-card variant="tonal" class="comment-card">
        <!-- Header: [checkbox?] avatar · name + date · star rating -->
        <div class="comment-card__header">
            <v-checkbox
                v-if="selectable"
                :model-value="selected"
                color="primary"
                hide-details
                density="compact"
                class="comment-card__checkbox"
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

            <div class="comment-card__title">
                <span class="comment-card__name">{{ comment.userName }}</span>
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
        <div class="comment-card__meta">
            <!-- Comment text -->
            <div
                v-if="comment.comment"
                class="comment-card__meta-row comment-card__meta-row--full"
            >
                <v-icon size="15" class="comment-card__meta-icon"
                    >mdi-comment-text-outline</v-icon
                >
                <div class="comment-card__comment-wrap">
                    <span
                        class="comment-card__comment"
                        :class="{
                            'comment-card__comment--collapsed':
                                collapsible && !expanded && isLong,
                        }"
                        >{{ comment.comment }}</span
                    >
                    <v-btn
                        v-if="collapsible && isLong"
                        variant="text"
                        density="compact"
                        size="x-small"
                        :color="expanded ? 'default' : 'primary'"
                        class="mt-1 px-0 text-none d-block justify-start"
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

            <!-- Route row (admin view) -->
            <div
                v-if="showRoute && comment.routeName"
                class="comment-card__meta-row comment-card__meta-row--full"
            >
                <v-icon size="15" class="comment-card__meta-icon"
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
            <div class="comment-card__pills">
                <span v-if="comment.location" class="comment-card__pill">
                    <v-icon size="13">mdi-map-marker</v-icon>
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
                            class="comment-card__pill comment-card__pill--primary"
                        >
                            <v-icon size="13">mdi-gauge</v-icon>
                            {{ t('ratings.felt') }}
                            {{ comment.difficultyLabel }}
                        </span>
                    </template>
                </v-tooltip>
            </div>
        </div>

        <v-card-actions v-if="$slots.actions" class="comment-card__actions">
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
const LONG_THRESHOLD = 200
const isLong = computed(
    () =>
        typeof props.comment.comment === 'string' &&
        props.comment.comment.length > LONG_THRESHOLD,
)

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
.comment-card {
    position: relative;
    overflow: hidden;
}

.comment-card__header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
}

.comment-card__checkbox {
    margin: 0;
    padding: 0;
    flex-shrink: 0;
}

.comment-card__title {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
}

.comment-card__name {
    font-weight: 600;
    font-size: 1rem;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.comment-card__date {
    font-size: 0.75rem;
    color: rgba(var(--v-theme-on-surface), 0.55);
    line-height: 1.2;
}

/* Meta block */
.comment-card__meta {
    padding: 10px 16px 6px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.comment-card__meta-row {
    display: flex;
    align-items: center;
    gap: 7px;
}

.comment-card__meta-row--full {
    width: 100%;
    align-items: flex-start;
}

.comment-card__meta-icon {
    flex-shrink: 0;
    opacity: 0.65;
    margin-top: 3px;
}

.comment-card__comment-wrap {
    flex: 1;
    min-width: 0;
}

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

/* Inline pill row — indent to match text column (icon 15px + gap 7px) */
.comment-card__pills {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 2px;
    padding-left: 22px;
}

.comment-card__pill :deep(.v-icon) {
    margin-top: 1px;
}

.comment-card__pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.75rem;
    color: rgba(var(--v-theme-on-surface), 0.7);
    background: rgba(var(--v-theme-on-surface), 0.06);
    border-radius: 6px;
    padding: 3px 8px;
}

.comment-card__pill--primary {
    color: rgb(var(--v-theme-primary));
    background: rgba(var(--v-theme-primary), 0.08);
}

.comment-card__actions {
    padding: 6px 10px 8px;
    min-height: unset;
}
</style>
