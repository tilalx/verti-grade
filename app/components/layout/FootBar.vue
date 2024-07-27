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
                            <span v-if="settings.privacy_url" class="footer-separator">|</span>
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
            <v-row justify="center" align="center">
                <v-col cols="auto">
                    <div class="text-center">
                        <v-chip color="success" v-if="health.code === 200">{{
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
const config = useRuntimeConfig()
const appVersion = config.public.appVersion

const pb = usePocketbase()

const health = await pb.health.check()

const online = await pb.send('/api/online')

const props = defineProps({
    settings: {
        type: Object,
        required: true,
    },
})

const { settings } = toRefs(props)
</script>

<style scoped>
.footer-link {
    margin: 0 10px;
    text-decoration: none; /* Removes underline */
    color: inherit; /* Inherits the color from the parent element */
}

.footer-link:hover {
    text-decoration: none; /* Keeps the underline removed on hover */
}

.footer-separator {
    margin: 0 5px;
}
</style>
