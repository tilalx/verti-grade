<script setup lang="ts">
const password = defineModel<string>({ default: '' })

withDefaults(
    defineProps<{
        label: string
        autocomplete?: string
        hideToggle?: boolean
    }>(),
    { autocomplete: 'current-password' },
)

const visible = ref(false)

function toggleVisibility() {
    visible.value = !visible.value
}
</script>

<template>
    <v-text-field
        v-model="password"
        :label="label"
        :type="visible ? 'text' : 'password'"
        :autocomplete="autocomplete"
    >
        <template #append-inner>
            <slot name="append-inner" />
            <v-icon
                v-if="!hideToggle"
                :icon="visible ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                role="button"
                tabindex="0"
                :aria-label="
                    visible
                        ? $t('account.hidePassword')
                        : $t('account.showPassword')
                "
                data-testid="password-toggle"
                @click="toggleVisibility"
                @keydown.enter.stop.prevent="toggleVisibility"
                @keydown.space.stop.prevent="toggleVisibility"
            />
        </template>
    </v-text-field>
</template>
