<template>
    <v-container class="legal-page" data-testid="privacy-page">
        <LayoutPageHeader
            :title="$t('legal.privacy')"
            :subtitle="$t('legal.privacyPage.subtitle')"
        />

        <v-card class="surface-card legal-doc" flat>
            <section>
                <h2>{{ $t('legal.privacyPage.controllerTitle') }}</h2>
                <p v-if="settings?.organization_name">
                    <strong>{{ settings.organization_name }}</strong>
                </p>
                <p v-if="settings?.legal_address" class="multiline">
                    {{ settings.legal_address }}
                </p>
                <p v-if="settings?.contact_email">
                    <a :href="`mailto:${settings.contact_email}`">{{
                        settings.contact_email
                    }}</a>
                </p>
                <p>
                    <NuxtLink to="/imprint">{{ $t('legal.imprint') }}</NuxtLink>
                </p>
            </section>

            <section
                v-for="section in textSections"
                :key="section"
                :data-testid="`privacy-${section}`"
            >
                <h2>{{ $t(`legal.privacyPage.${section}.title`) }}</h2>
                <p>
                    {{
                        $t(`legal.privacyPage.${section}.body`, {
                            auditDays: auditRetentionDays,
                        })
                    }}
                </p>
            </section>

            <section data-testid="privacy-storage">
                <h2>{{ $t('legal.privacyPage.storage.title') }}</h2>
                <p class="mb-3">{{ $t('legal.privacyPage.storage.body') }}</p>
                <div class="table-scroll">
                    <v-table density="compact" class="bg-transparent">
                        <thead>
                            <tr>
                                <th>{{ $t('legal.storage.name') }}</th>
                                <th>{{ $t('legal.storage.type') }}</th>
                                <th>{{ $t('legal.storage.purpose') }}</th>
                                <th>{{ $t('legal.storage.duration') }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="entry in CLIENT_STORAGE"
                                :key="entry.name"
                                data-testid="privacy-storage-row"
                            >
                                <td class="text-no-wrap">
                                    <code>{{ entry.name }}</code>
                                </td>
                                <td>
                                    {{
                                        $t(`legal.storage.kinds.${entry.kind}`)
                                    }}
                                </td>
                                <td>
                                    {{
                                        $t(
                                            `legal.storage.purposes.${entry.purpose}`,
                                        )
                                    }}
                                </td>
                                <td class="text-no-wrap">
                                    {{
                                        $t(
                                            `legal.storage.durations.${entry.duration}`,
                                        )
                                    }}
                                </td>
                            </tr>
                        </tbody>
                    </v-table>
                </div>
            </section>

            <section data-testid="privacy-rights">
                <h2>{{ $t('legal.privacyPage.rights.title') }}</h2>
                <p>{{ $t('legal.privacyPage.rights.body') }}</p>
                <ul class="rights-list">
                    <li v-for="right in rights" :key="right">
                        {{ $t(`legal.privacyPage.rights.items.${right}`) }}
                    </li>
                </ul>
                <p>{{ $t('legal.privacyPage.rights.complaint') }}</p>
            </section>
        </v-card>
    </v-container>
</template>

<script setup lang="ts">
import type { SettingsRecord } from '~/types/models'
import { CLIENT_STORAGE } from '~/utils/clientStorage'

const { t } = useI18n()
const { data: settings } = useNuxtData<SettingsRecord>('settings')

const auditRetentionDays = computed(
    () => settings.value?.audit_retention_days ?? 90,
)

const textSections = [
    'serverLogs',
    'accounts',
    'ratings',
    'reports',
    'auditLog',
    'captcha',
    'thirdParties',
]

const rights = [
    'access',
    'rectification',
    'erasure',
    'restriction',
    'portability',
    'objection',
    'withdrawal',
]

useHead({ title: () => t('legal.privacy') })
</script>

<style scoped>
.legal-page {
    max-width: 860px;
}

.table-scroll {
    overflow-x: auto;
}

.rights-list {
    margin: 8px 0 8px 20px;
}
</style>
