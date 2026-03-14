<template>
  <v-footer
    v-if="$route.meta.footer !== false"
    class="app-footer"
    color="transparent"
    elevation="0"
  >
    <div class="footer-inner">
      <!-- Left: legal links -->
      <div class="footer-left">
        <v-btn
          v-if="settings.privacy_url"
          :href="settings.privacy_url"
          target="_blank"
          variant="plain"
          density="compact"
          class="footer-link-btn"
        >
          {{ $t('legal.privacy') }}
        </v-btn>

        <span v-if="settings.privacy_url && settings.imprint_url" class="link-sep">·</span>

        <v-btn
          v-if="settings.imprint_url"
          :href="settings.imprint_url"
          target="_blank"
          variant="plain"
          density="compact"
          class="footer-link-btn"
        >
          {{ $t('legal.imprint') }}
        </v-btn>
      </div>

      <!-- Center: status pills -->
      <div class="footer-center">
        <div class="status-pill">
          <span class="status-dot" :class="isHealthy ? 'dot--ok' : 'dot--err'" />
          <span class="status-label">{{ isHealthy ? $t('notifications.success.health') : $t('notifications.error.health') }}</span>
        </div>

        <div class="status-pill">
          <v-icon size="11">mdi-account-multiple-outline</v-icon>
          <span class="status-label">{{ $t('dashboard.online', [onlineCount]) }}</span>
        </div>

        <div class="status-pill">
          <v-icon size="11">mdi-tag-outline</v-icon>
          <span class="status-label">{{ appVersion }}</span>
        </div>
      </div>

      <!-- Right: copyright -->
      <div class="footer-right">
        <v-btn
          href="https://github.com/tilalx/verti-grade"
          target="_blank"
          variant="plain"
          density="compact"
          class="footer-brand-btn"
        >
          © {{ currentYear }} Verti-Grade
        </v-btn>
      </div>
    </div>
  </v-footer>
</template>

<script setup>
const props = defineProps({
  settings: {
    type: Object,
    default: () => ({})
  }
})

const pb = usePocketbase()
const config = useRuntimeConfig()
const appVersion = config.public.appVersion
const currentYear = computed(() => new Date().getFullYear())

const { data: health } = await useAsyncData('footer:health', () => pb.health.check(), {
  default: () => null,
  lazy: true,
})

const { data: online } = await useAsyncData('footer:online', () =>
  pb.send('/api/online', { method: 'GET' }), {
  default: () => ({ clients: 0 }),
  lazy: true,
})

const isHealthy = computed(() => health.value?.code === 200)
const onlineCount = computed(() => (online.value?.clients ?? 0) + 1)
</script>

<style scoped>
.app-footer {
  border-top: 1px solid rgba(var(--v-border-color), 0.07);
  padding: 0;
}

.footer-inner {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 10px 24px;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
}

/* ── Left ───────────────────────────────────────────────── */
.footer-left {
  display: flex;
  align-items: center;
  gap: 2px;
}

/* ── Center ─────────────────────────────────────────────── */
.footer-center {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 9px;
  border-radius: 999px;
  background: rgba(var(--v-theme-surface-variant), 0.4);
  border: 1px solid rgba(var(--v-border-color), 0.08);
}

.status-label {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: rgba(var(--v-theme-on-surface), 0.55);
  white-space: nowrap;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot--ok {
  background: rgb(var(--v-theme-success));
  box-shadow: 0 0 0 2px rgba(var(--v-theme-success), 0.2);
}

.dot--err {
  background: rgb(var(--v-theme-error));
  box-shadow: 0 0 0 2px rgba(var(--v-theme-error), 0.2);
}

/* ── Right ──────────────────────────────────────────────── */
.footer-right {
  display: flex;
  justify-content: flex-end;
}

/* ── Shared button styles ───────────────────────────────── */
.footer-link-btn {
  font-size: 11.5px !important;
  font-weight: 500 !important;
  color: rgba(var(--v-theme-on-surface), 0.4) !important;
  text-transform: none !important;
  min-width: unset !important;
  padding: 0 6px !important;
  letter-spacing: 0 !important;
}

.footer-link-btn:hover {
  color: rgba(var(--v-theme-on-surface), 0.85) !important;
}

.link-sep {
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.2);
  user-select: none;
}

.footer-brand-btn {
  font-size: 11.5px !important;
  font-weight: 500 !important;
  color: rgba(var(--v-theme-on-surface), 0.3) !important;
  text-transform: none !important;
  min-width: unset !important;
  letter-spacing: 0 !important;
}

.footer-brand-btn:hover {
  color: rgba(var(--v-theme-on-surface), 0.7) !important;
}

@media (max-width: 599px) {
    .footer-inner {
        grid-template-columns: 1fr;
        padding: 8px 16px;
        gap: 6px;
    }

    .footer-center {
        flex-wrap: wrap;
        justify-content: center;
        gap: 4px;
    }

    .footer-right {
        justify-content: center;
    }

    .footer-left {
        justify-content: center;
    }
}
</style>