<template>
    <v-row density="comfortable">
        <v-col
            v-for="project in projects"
            :key="project.route"
            cols="12"
            md="6"
            xl="4"
        >
            <v-card
                variant="tonal"
                class="h-100 pa-4 d-flex flex-column ga-3"
                data-testid="logbook-project"
                :data-route-id="project.route"
            >
                <div class="d-flex align-center ga-3">
                    <RouteColorDot :color="project.record?.color" :size="32" />
                    <div class="flex-grow-1 project__body">
                        <div class="font-weight-medium project__name">
                            {{ project.record?.name }}
                        </div>
                        <div class="text-body-small text-medium-emphasis">
                            {{
                                $t('ticks.attemptCount', {
                                    count: project.attempts,
                                })
                            }}
                            ·
                            {{
                                $t('ticks.projects.lastTried', {
                                    date: formatDate(
                                        tickDate(project.lastTried),
                                        {
                                            locale,
                                        },
                                    ),
                                })
                            }}
                        </div>
                    </div>
                    <GradeLabel :source="project.record" />
                </div>
                <div class="d-flex ga-2 justify-end mt-auto">
                    <v-btn
                        :to="`/route?id=${project.route}`"
                        variant="tonal"
                        append-icon="mdi-chevron-right"
                    >
                        {{ $t('routes.view') }}
                    </v-btn>
                    <v-btn
                        color="primary"
                        variant="flat"
                        prepend-icon="mdi-check-circle-outline"
                        data-testid="logbook-project-log"
                        @click="emit('log', project.route)"
                    >
                        {{ $t('ticks.projects.logSend') }}
                    </v-btn>
                </div>
            </v-card>
        </v-col>
    </v-row>
</template>

<script setup lang="ts">
import type { RouteRecord } from '~/types/models'
import type { OpenProject } from '#shared/utils/logbook'
import { formatDate } from '#shared/utils/formatting'
import { tickDate } from '#shared/utils/ticks'

defineProps<{
    projects: (OpenProject & { record?: RouteRecord })[]
}>()

const emit = defineEmits<{ log: [routeId: string] }>()

const { locale } = useI18n()
</script>

<style scoped>
.project__body {
    min-width: 0;
}

.project__name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>
