<template>
    <VDataTable :headers="headers" :items="userList">
        <template #top>
            <VToolbar flat color="background">
                <VDivider
                    color="background"
                    class="mx-4"
                    inset
                    vertical
                ></VDivider>
                <VSpacer></VSpacer>
                <VDialog v-model:show="dialogDelete" max-width="500px">
                    <VCard>
                        <VCardTitle class="text-h5"
                            >{{ $t('notifications.deleteItem') }}</VCardTitle
                        >
                        <VCardActions>
                            <VSpacer></VSpacer>
                            <VBtn
                                color="blue-darken-1"
                                variant="text"
                                @click="closeDelete"
                            >
                                {{ $t('actions.cancel') }}
                            </VBtn>
                            <VBtn
                                color="blue-darken-1"
                                variant="text"
                                @click="deleteItemConfirm"
                            >
                                OK
                            </VBtn>
                            <VSpacer></VSpacer>
                        </VCardActions>
                    </VCard>
                </VDialog>
            </VToolbar>
        </template>
    </VDataTable>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import moment from 'moment'

const { t } = useI18n()

useHead({
    title: t('page.title.user'),
    meta: [
        {
            name: 'description',
            content: t('page.content.user'),
        },
    ],
})

definePageMeta({
    authRequired: true,
    middleware: ['auth'],
})

const pb = usePocketbase()
const dialog = ref(false)
const dialogDelete = ref(false)
const userList = ref([])
const headers = ref([])
const editIndex = ref(-1)
const editedItem = reactive({
    firstname: '',
    name: '',
    email: '',
    created: '',
    updated: '',
})

const defaultItem = {
    firstname: '',
    name: '',
    email: '',
    created: '',
    updated: '',
}

headers.value = [
    { title: t('account.firstname'), key: 'firstname' },
    { title: t('account.lastname'), key: 'name' },
    { title: t('account.email'), key: 'email' },
    { title: t('table.created_at'), key: 'created' },
    { title: t('table.updated_at'), key: 'updated' },
]

const formTitle = computed(() => {
    return editIndex.value === -1 ? t('actions.new_item') : t('actions.edit_item')
})

watch(dialog, (newVal) => {
    if (!newVal) close()
})

watch(dialogDelete, (newVal) => {
    if (!newVal) closeDelete()
})

onMounted(async () => {
    userList.value = await getAllUsers()
})

async function getAllUsers() {
    const userList = await pb.collection('users').getFullList({
        sort: '-created',
    })
    return userList
}

function formatDate(date) {
    return moment(date).format('YYYY-MM-DD')
}

function editItem(item) {
    editIndex.value = userList.value.indexOf(item)
    Object.assign(editedItem, item)
    dialog.value = true
}

function deleteItem(item) {
    editIndex.value = userList.value.indexOf(item)
    Object.assign(editedItem, item)
    dialogDelete.value = true
}

function deleteItemConfirm() {
    userList.value.splice(editIndex.value, 1)
    deleteUser(editedItem.id)
    closeDelete()
}

function close() {
    dialog.value = false
    editIndex.value = -1
    Object.assign(editedItem, defaultItem)
}

function closeDelete() {
    dialogDelete.value = false
    editIndex.value = -1
    Object.assign(editedItem, defaultItem)
}

function save() {
    if (editedItem) {
        if (editIndex.value > -1) {
            Object.assign(userList.value[editIndex.value], editedItem)
            updateUser(editedItem)
        } else {
            userList.value.push({ ...editedItem })
            createUser(editedItem)
        }
        close()
    }
}
</script>
