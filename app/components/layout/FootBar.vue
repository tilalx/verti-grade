<template>
    <v-footer color="background">
        <v-container>
            <v-row justify="center" align="center">
                <v-col cols="auto">
                    <div class="text-center">
                        <a
                            v-if="settings.privacy_url"
                            :href="settings.privacy_url"
                            class="footer-link"
                            target="_blank"
                        >
                            {{ $t('legal.privacy') }}
                        </a>
                        <span
                            v-if="settings.privacy_url"
                            class="footer-separator"
                            >|</span
                        >
                        <a
                            v-if="settings.imprint_url"
                            :href="settings.imprint_url"
                            class="footer-link"
                            target="_blank"
                        >
                            {{ $t('legal.imprint') }}
                        </a>
                    </div>
                </v-col>
            </v-row>
            <v-col class="text-center mt-4" cols="12">
                &copy; {{ currentYear }} —
                <a
                    style="cursor: pointer"
                    onclick="window.open('https://github.com/tilalx/verti-grade','_blank');"
                    >Verti‑Grade</a
                >
            </v-col>
            <v-row justify="center" align="center">
                <v-col cols="auto">
                    <div class="text-center">
                        <v-chip color="success" v-if="health?.code === 200">{{
                            $t('notifications.success.health')
                        }}</v-chip>
                        <v-chip color="error" v-else>{{
                            $t('notifications.error.health')
                        }}</v-chip>
                        <span class="footer-separator">|</span>
                        <v-chip color="grey">{{ appVersion }}</v-chip>
                        <span class="footer-separator">|</span>
                        <v-chip color="info">{{
                            $t('dashboard.online', [online.clients + 1])
                        }}</v-chip>
                    </div>
                </v-col>
            </v-row>
        </v-container>
    </v-footer>
</template>

<script setup>
// Import required Vue and Nuxt composables
import { ref, computed, toRefs } from 'vue'

const pb = usePocketbase()

const config = useRuntimeConfig()
const appVersion = config.public.appVersion

const currentYear = computed(() => new Date().getFullYear())

const { data: health, error: healthError } = await useAsyncData(
    'health',
    async () => {
        return await pb.health.check() // Fetch health status from Pocketbase
    },
)

const { data: online, error: onlineError } = await useAsyncData(
    'online',
    async () => {
        return await pb.send('/api/online') // Fetch online status from API
    },
)

const props = defineProps({
    settings: {
        type: Object,
        required: true,
    },
})

const { settings } = toRefs(props)

if (healthError.value || onlineError.value) {
    console.error('Error fetching health or online status', {
        healthError,
        onlineError,
    })
}
</script>

<style scoped>
.footer-link {
    margin: 0 10px;
    text-decoration: none;
    color: inherit;
}

.footer-link:hover {
    text-decoration: none;
}

.footer-separator {
    margin: 0 5px;
}
</style>
