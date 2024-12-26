<template>
    <div class="avatar-container">
        <v-menu>
            <template v-slot:activator="{ props }">
                <div v-bind="props">
                    <v-avatar color="grey" class="mr-4">
                        <NuxtImg v-if="image" :src="image"></NuxtImg>
                        <v-icon v-else icon="mdi-account-circle" alt="user-icon"></v-icon>
                    </v-avatar>
                </div>
            </template>

            <v-list>
                <v-list-item
                    v-for="(item, index) in items"
                    :key="index"
                    :value="index"
                >
                    <v-list-item-title
                        :color="item.color"
                        @click="item.function"
                    >
                        {{ item.title }}
                    </v-list-item-title>
                </v-list-item>
            </v-list>
        </v-menu>
        <EditUserSelf :dialog-open="dialogOpen" userId="1" @update:dialog-open="dialogOpen = $event" />
    </div>
</template>

<script setup>
import EditUserSelf from './EditUserSelf.vue';
import { useRouter } from 'vue-router'

const router = useRouter();
const pb = usePocketbase();
const pocketbaseAuth = JSON.parse(localStorage.getItem('pocketbase_auth'))
const user = ref(pocketbaseAuth.record)
const dialogOpen = ref(false);
const { t } = useI18n();
const image = pb.files.getURL(user.value, user.value?.avatar, {'thumb': '100x100'});

const items = [
    {
        title: t('account.profile'),
        function: () => dialogOpen.value = true,
    },
    {
        title: t('account.logout'),
        function: logout,
    },
];

async function logout() {
    pb.authStore.clear();
    router.push('/login');
}
</script>