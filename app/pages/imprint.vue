<template>
    <div class="page--prose mx-auto w-full p-4" data-testid="imprint-page">
        <LayoutPageHeader
            :title="$t('legal.imprint')"
            :subtitle="$t('legal.imprintPage.subtitle')"
        />

        <UAlert
            v-if="!settings?.legal_address"
            color="warning"
            variant="soft"
            icon="i-lucide-triangle-alert"
            :description="$t('legal.imprintPage.incomplete')"
            class="mb-4"
            data-testid="imprint-incomplete"
        />

        <div class="surface-card legal-doc">
            <section>
                <h2>{{ $t('legal.imprintPage.provider') }}</h2>
                <address>
                    <strong
                        v-if="settings?.organization_name"
                        data-testid="imprint-org"
                        >{{ settings.organization_name }}</strong
                    >
                    <div v-if="settings?.organization_unit_name">
                        {{ settings.organization_unit_name }}
                    </div>
                    <div
                        v-if="settings?.legal_address"
                        class="multiline"
                        data-testid="imprint-address"
                    >
                        {{ settings.legal_address }}
                    </div>
                </address>
            </section>

            <section v-if="representatives.length">
                <h2>{{ $t('legal.imprintPage.representative') }}</h2>
                <p
                    v-for="person in representatives"
                    :key="person.name"
                    data-testid="imprint-representative"
                >
                    {{ person.name
                    }}<span v-if="person.role" class="text-muted">
                        – {{ person.role }}</span
                    >
                </p>
            </section>

            <section v-if="settings?.legal_phone || settings?.contact_email">
                <h2>{{ $t('legal.imprintPage.contact') }}</h2>
                <dl>
                    <template v-if="settings?.legal_phone">
                        <dt>{{ $t('legal.imprintPage.phone') }}</dt>
                        <dd>
                            <a
                                :href="`tel:${settings.legal_phone.replace(/\s/g, '')}`"
                                >{{ settings.legal_phone }}</a
                            >
                        </dd>
                    </template>
                    <template v-if="settings?.contact_email">
                        <dt>{{ $t('legal.imprintPage.email') }}</dt>
                        <dd>
                            <a :href="`mailto:${settings.contact_email}`">{{
                                settings.contact_email
                            }}</a>
                        </dd>
                    </template>
                </dl>
            </section>

            <section
                v-if="settings?.legal_register || settings?.legal_vat_id"
                data-testid="imprint-register"
            >
                <h2>{{ $t('legal.imprintPage.register') }}</h2>
                <dl>
                    <template v-if="settings?.legal_register">
                        <dt>{{ $t('legal.imprintPage.registerEntry') }}</dt>
                        <dd>{{ settings.legal_register }}</dd>
                    </template>
                    <template v-if="settings?.legal_vat_id">
                        <dt>{{ $t('legal.imprintPage.vatId') }}</dt>
                        <dd>{{ settings.legal_vat_id }}</dd>
                    </template>
                </dl>
            </section>

            <section v-if="settings?.legal_editorial">
                <h2>{{ $t('legal.imprintPage.editorial') }}</h2>
                <p data-testid="imprint-editorial">
                    {{ settings.legal_editorial }}
                </p>
            </section>

            <section>
                <h2>{{ $t('legal.imprintPage.disputeTitle') }}</h2>
                <p>{{ $t('legal.imprintPage.dispute') }}</p>
            </section>
        </div>

        <UButton
            to="/privacy"
            variant="ghost"
            color="primary"
            icon="i-lucide-shield"
            class="mt-3"
            data-testid="imprint-privacy-link"
        >
            {{ $t('legal.privacy') }}
        </UButton>
    </div>
</template>

<script setup lang="ts">
import type { SettingsRecord } from '~/types/models'

const { t } = useI18n()
const { data: settings } = useNuxtData<SettingsRecord>('settings')

const representatives = computed(() =>
    (settings.value?.legal_representatives ?? []).filter(
        (person) => person.name,
    ),
)

useSeoMeta({
    title: () => t('legal.imprint'),
    ogTitle: () => t('legal.imprint'),
})
</script>
