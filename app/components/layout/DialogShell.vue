<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const open = defineModel<boolean>({ default: false })

const props = withDefaults(
    defineProps<{
        title?: string
        subtitle?: string
        maxWidth?: string | number
        persistent?: boolean
        closable?: boolean
        scrollable?: boolean
        flush?: boolean
        sheetOnMobile?: boolean
    }>(),
    { maxWidth: 520, scrollable: true },
)

const { smAndUp } = useDisplay()
const asSheet = computed(() => props.sheetOnMobile && !smAndUp.value)

const sheetProps = computed(() =>
    asSheet.value
        ? ({
              contentClass: 'dialog-shell--sheet',
              transition: 'dialog-bottom-transition',
              location: 'bottom center',
              origin: 'bottom center',
          } as const)
        : { maxWidth: props.maxWidth },
)
</script>

<template>
    <v-dialog
        v-model="open"
        v-bind="sheetProps"
        :persistent="persistent"
        :scrollable="scrollable"
    >
        <template v-if="$slots.activator" #activator="activatorScope">
            <slot name="activator" v-bind="activatorScope" />
        </template>

        <v-card rounded="xl" v-bind="$attrs">
            <v-card-title
                v-if="title || $slots.title"
                class="dialog-shell__title d-flex align-center ga-2 pa-5 pb-2 text-body-large font-weight-semibold"
            >
                <slot name="title">{{ title }}</slot>
                <v-spacer />
                <v-btn
                    v-if="closable"
                    icon="mdi-close"
                    variant="text"
                    density="comfortable"
                    :aria-label="$t('actions.close')"
                    data-testid="dialog-close"
                    @click="open = false"
                />
            </v-card-title>

            <v-card-subtitle v-if="subtitle" class="px-5 pb-1">
                {{ subtitle }}
            </v-card-subtitle>

            <v-card-text
                :class="
                    flush
                        ? 'pa-0'
                        : title || $slots.title
                          ? 'pa-5 pt-2'
                          : 'pa-5'
                "
            >
                <slot />
            </v-card-text>

            <v-card-actions v-if="$slots.actions" class="pa-4 pt-0">
                <slot name="actions" />
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<style>
.v-overlay__content.dialog-shell--sheet {
    align-self: flex-end;
    flex: 0 1 auto;
    width: 100%;
    max-width: 100%;
    margin: 0;
    left: 0 !important;
}

.dialog-shell__title {
    white-space: normal;
}

.v-overlay__content.dialog-shell--sheet > .v-card {
    border-end-start-radius: 0;
    border-end-end-radius: 0;
}
</style>
