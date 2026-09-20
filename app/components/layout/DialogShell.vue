<script setup lang="ts">
/**
 * The one dialog shell. Owns max-width, radius, header/close affordance and
 * the padding rhythm so individual dialogs only supply body + actions.
 * Attributes (notably `data-testid`) fall through to the inner v-card.
 */
defineOptions({ inheritAttrs: false })

const open = defineModel<boolean>({ default: false })

const props = withDefaults(
    defineProps<{
        title?: string
        subtitle?: string
        maxWidth?: string | number
        persistent?: boolean
        /** Show the header close button. */
        closable?: boolean
        scrollable?: boolean
        /** Drop the body padding when the slot brings its own (tabs, windows). */
        flush?: boolean
        /** Slide up from the bottom edge on phones instead of centering. */
        sheetOnMobile?: boolean
    }>(),
    { maxWidth: 520, scrollable: true },
)

const { smAndDown } = useDisplay()
const asSheet = computed(() => props.sheetOnMobile && smAndDown.value)

// A VDialog docked to the bottom edge. Vuetify's own `v-bottom-sheet` classes
// are not reusable here: their CSS ships in the VBottomSheet chunk, so it is
// absent on any page that renders no real bottom sheet. The styles below are
// ours; `dialog-bottom-transition` lives in Vuetify's always-loaded core.
const sheetProps = computed(() =>
    asSheet.value
        ? {
              contentClass: 'dialog-shell--sheet',
              transition: 'dialog-bottom-transition',
              location: 'bottom center',
              origin: 'bottom center',
          }
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
/* Unscoped: the overlay content is teleported out of this component's DOM.
   Unlayered, so it beats Vuetify's @layer rules without a specificity war. */
.v-overlay__content.dialog-shell--sheet {
    align-self: flex-end;
    flex: 0 1 auto;
    width: 100%;
    max-width: 100%;
    margin: 0;
}

/* v-card-title is nowrap + ellipsis by default, which clips a slotted header
   that carries a second line. Let it wrap; callers that want one clipped line
   still opt in with text-truncate. */
.dialog-shell__title {
    white-space: normal;
}

.v-overlay__content.dialog-shell--sheet > .v-card {
    border-end-start-radius: 0;
    border-end-end-radius: 0;
}
</style>
