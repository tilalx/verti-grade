<template>
  <v-footer
    color="background"
    elevation="2"
    v-if="$route.meta.footer !== false"
  >
    <v-container>
      <!-- Legal links -->
      <v-row justify="center" align="center">
        <v-btn
          v-if="settings.privacy_url"
          :href="settings.privacy_url"
          target="_blank"
          variant="text"
        >
          {{ $t('legal.privacy') }}
        </v-btn>

        <v-divider inset vertical v-if="settings.privacy_url && settings.imprint_url" class="mx-2" />

        <v-btn
          v-if="settings.imprint_url"
          :href="settings.imprint_url"
          target="_blank"
          variant="text"
        >
          {{ $t('legal.imprint') }}
        </v-btn>
      </v-row>

      <!-- Title -->
      <v-row justify="center" class="mt-2">
        <v-btn
          variant="text"
          density="compact"
          @click="() => window.open('https://github.com/tilalx/verti-grade')"
        >
          &copy; {{ currentYear }} — Verti-Grade
        </v-btn>
      </v-row>

      <!-- Status bar -->
      <v-row justify="center" class="mt-4">
        <v-card
          elevation="0"
          variant="tonal"
          color="surface"
          class="px-4 py-2"
        >
          <v-row dense align="center" justify="center" class="flex-nowrap">
            <v-chip
              :color="health?.code === 200 ? 'success' : 'error'"
              variant="flat"
              size="small"
              class="ma-1"
            >
              {{ health?.code === 200 ? $t('notifications.success.health') : $t('notifications.error.health') }}
            </v-chip>

            <v-chip
              color="grey"
              variant="flat"
              size="small"
              class="ma-1"
            >
              {{ appVersion }}
            </v-chip>

            <v-chip
              color="info"
              variant="flat"
              size="small"
              class="ma-1"
            >
              {{ $t('dashboard.online', [online.clients + 1]) }}
            </v-chip>
          </v-row>
        </v-card>
      </v-row>
    </v-container>
  </v-footer>
</template>

<script setup>
const pb = usePocketbase()
const config = useRuntimeConfig()
const appVersion = config.public.appVersion
const currentYear = computed(() => new Date().getFullYear())

const { data: health, error: healthError } = await useAsyncData('health', () =>
  pb.health.check()
)

const { data: online, error: onlineError } = await useAsyncData('online', () =>
  pb.send('/api/online')
)

const props = defineProps({
  settings: { type: Object, required: true }
})

if (healthError.value || onlineError.value) {
  console.error('Error fetching health or online status', { healthError, onlineError })
}
</script>