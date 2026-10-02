<script setup lang="ts">
defineProps<{
    redirect: string
    testIdPrefix: string
}>()

const { allowRegistration } = useOrgSettings()
</script>

<template>
    <div
        class="rounded-lg border bg-default"
        :data-testid="`${testIdPrefix}-guest`"
    >
        <div class="text-center p-6">
            <UIcon
                name="i-lucide-circle-user"
                class="guest-cta__icon mb-3 size-[56px]"
            />
            <p class="text-base font-medium mb-1">{{ $t('me.guestTitle') }}</p>
            <p class="text-sm text-muted mb-5">
                {{ $t('me.guestIntro') }}
            </p>
            <div class="flex flex-col gap-2">
                <UButton
                    color="primary"
                    size="lg"
                    block
                    :to="{ path: '/auth/login', query: { redirect } }"
                    :data-testid="`${testIdPrefix}-login`"
                >
                    {{ $t('routes.login') }}
                </UButton>
                <UButton
                    v-if="allowRegistration"
                    color="neutral"
                    variant="soft"
                    size="lg"
                    block
                    :to="{
                        path: '/auth/login',
                        query: { view: 'register', redirect },
                    }"
                    :data-testid="`${testIdPrefix}-register`"
                >
                    {{ $t('me.register') }}
                </UButton>
            </div>
        </div>
    </div>
</template>

<style scoped>
.guest-cta__icon {
    color: color-mix(in oklab, var(--ui-text-highlighted) 30%, transparent);
}
</style>
