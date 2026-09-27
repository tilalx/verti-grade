<template>
    <v-container class="me-page" data-testid="me-page">
        <h1 class="d-sr-only">{{ $t('me.title') }}</h1>

        <v-card
            v-if="!user"
            border
            flat
            class="me-guest"
            data-testid="me-guest"
        >
            <v-card-text class="text-center pa-6">
                <v-icon size="56" class="me-guest__icon mb-3"
                    >mdi-account-circle-outline</v-icon
                >
                <p class="text-title-medium mb-1">{{ $t('me.guestTitle') }}</p>
                <p class="text-body-medium text-medium-emphasis mb-5">
                    {{ $t('me.guestIntro') }}
                </p>
                <div class="d-flex flex-column ga-2">
                    <v-btn
                        color="primary"
                        size="large"
                        :to="{
                            path: '/auth/login',
                            query: { redirect: '/account' },
                        }"
                        data-testid="me-login"
                    >
                        {{ $t('routes.login') }}
                    </v-btn>
                    <v-btn
                        v-if="allowRegistration"
                        variant="tonal"
                        size="large"
                        to="/auth/register"
                        data-testid="me-register"
                    >
                        {{ $t('me.register') }}
                    </v-btn>
                </div>
            </v-card-text>
        </v-card>

        <template v-else>
            <div class="me-header">
                <v-avatar size="64" :color="avatar ? undefined : 'primary'">
                    <v-img
                        v-if="avatar"
                        :src="avatar"
                        :alt="displayName"
                        cover
                    />
                    <span v-else class="text-title-large font-weight-bold">{{
                        initials
                    }}</span>
                </v-avatar>
                <div class="me-header__text">
                    <p
                        class="text-title-large font-weight-bold text-truncate"
                        data-testid="me-name"
                    >
                        {{ displayName }}
                    </p>
                    <p
                        class="text-body-medium text-medium-emphasis text-truncate"
                    >
                        {{ user.email }}
                    </p>
                </div>
            </div>

            <v-list class="me-list" nav rounded="lg" bg-color="surface">
                <v-list-item
                    prepend-icon="mdi-account-edit-outline"
                    :title="$t('account.profile')"
                    :subtitle="$t('me.profileHint')"
                    data-testid="me-profile"
                    @click="profileOpen = true"
                />
                <v-list-item
                    to="/account/activity"
                    prepend-icon="mdi-clipboard-text-clock-outline"
                    :title="$t('routes.activity')"
                />
            </v-list>

            <section
                v-for="section in sections"
                :key="section.key"
                class="me-staff"
                :data-testid="`me-section-${section.key}`"
            >
                <p class="me-section">{{ $t(section.label) }}</p>
                <div class="me-tiles">
                    <v-card
                        v-for="link in section.links"
                        :key="link.to"
                        :to="link.to"
                        variant="tonal"
                        class="me-tile"
                        :data-testid="`me-staff-${navTestId(link.to)}`"
                    >
                        <v-icon size="26" class="me-tile__icon">{{
                            link.icon
                        }}</v-icon>
                        <span class="me-tile__label">{{ $t(link.label) }}</span>
                    </v-card>
                </div>
            </section>

            <v-btn
                block
                variant="tonal"
                color="error"
                size="large"
                prepend-icon="mdi-logout-variant"
                class="mt-6"
                :loading="loggingOut"
                data-testid="me-logout"
                @click="logout"
            >
                {{ $t('account.logout') }}
            </v-btn>

            <UserEditUserSelf
                v-model:dialog-open="profileOpen"
                :user-id="user.id"
            />
        </template>
        <LayoutInfoList v-if="!lgAndUp" :settings="settings" />
    </v-container>
</template>

<script setup lang="ts">
import type { SettingsRecord } from '~/types/models'
import { staffSections } from '~/utils/navigation'

const { t } = useI18n()
const pb = usePocketbase()
const router = useRouter()
const { can } = usePermissions()
const { allowRegistration } = useOrgSettings()
const { lgAndUp } = useDisplay()
const { data: settings } = useNuxtData<SettingsRecord>('settings')

useSeoMeta({ title: () => t('page.title.me') })

const user = ref(pb.authStore.record)
const profileOpen = ref(false)
const loggingOut = ref(false)

const displayName = computed(
    () =>
        [user.value?.firstname, user.value?.name].filter(Boolean).join(' ') ||
        user.value?.username ||
        user.value?.email ||
        t('account.unknownUser'),
)
const initials = computed(() =>
    displayName.value
        .split(' ')
        .slice(0, 2)
        .map((part: string) => part[0]?.toUpperCase() ?? '')
        .join(''),
)
const avatar = computed(() =>
    usePbFileUrl(user.value, user.value?.avatar, { thumb: '100x100' }),
)

const sections = computed(() => (lgAndUp.value ? [] : staffSections(can)))

async function logout() {
    loggingOut.value = true
    try {
        pb.authStore.clear()
        await router.push('/auth/login')
    } finally {
        loggingOut.value = false
    }
}
</script>

<style scoped>
.me-page {
    max-width: 560px;
}

.me-guest__icon {
    color: rgba(var(--v-theme-on-surface), 0.3);
}

.me-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin: 8px 0 20px;
}

.me-header__text {
    min-width: 0;
}

.me-header__text p {
    margin: 0;
}

.me-list {
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.me-tiles {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
    gap: 8px;
}

.me-tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 88px;
    padding: 12px 8px;
    text-align: center;
}

.me-tile__icon {
    color: rgb(var(--v-theme-primary));
}

.me-tile__label {
    font-size: 0.8125rem;
    font-weight: 500;
    line-height: 1.25;
}

.me-section {
    margin: 24px 4px 8px;
    font-weight: 600;
    color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}
</style>
