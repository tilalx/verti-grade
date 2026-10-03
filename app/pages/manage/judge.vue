<template>
    <div class="mx-auto w-full p-4">
        <LayoutPageHeader :title="t('competitions.judge.title')" />
        <div class="flex flex-col gap-3" data-testid="judge-pick-competition">
            <LayoutEmptyState
                v-if="!judgeable?.length"
                icon="i-lucide-trophy"
                :title="t('competitions.judge.noCompetitions')"
            />
            <CompetitionCard
                v-for="item in judgeable"
                :key="item.id"
                :competition="item"
                :to="`/manage/competitions/${item.id}/judge`"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import type { CompetitionRecord } from '~/types/models'

definePageMeta({
    middleware: ['auth'],
    requiredPermission: 'judge_competitions',
})

const { t } = useI18n()
const pb = usePocketbase()
const route = useRoute()

const { data: judgeable } = await useAsyncData('judge-competitions', () =>
    pb.collection('competitions').getFullList<CompetitionRecord>({
        filter: 'status = "open" || status = "closed"',
        sort: 'starts_at',
    }),
)

if (!route.query.pick && judgeable.value?.length === 1) {
    await navigateTo(`/manage/competitions/${judgeable.value[0]!.id}/judge`, {
        replace: true,
    })
}

useHead({ title: t('page.title.judge') })
</script>
