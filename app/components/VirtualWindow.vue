<template>
    <div
        ref="el"
        :class="{ 'lazy-render__placeholder': !rendered }"
        :style="rendered ? undefined : { height: `${placeholderHeight}px` }"
    >
        <slot v-if="rendered" />
    </div>
</template>

<script setup>
// Windowed rendering: mounts its slot near the viewport and swaps it for a
// fixed-height placeholder once it scrolls far enough away (in both
// directions), so long lists keep a small DOM.
//
// Two observer bands with hysteresis: content mounts when it comes within
// `mountMargin` of the viewport but only unmounts once it is farther than
// `unmountMargin` away. In the zone between the bands the state is kept
// as-is — without this gap, mounting real content shifts the layout, which
// pushes edge cards back across a single boundary and the resulting
// mount/unmount feedback loop pegs the CPU and freezes the page.
const props = defineProps({
    // Placeholder height before the content has been measured once
    estimatedHeight: {
        type: Number,
        default: 240,
    },
    // Distance from the viewport at which content mounts
    mountMargin: {
        type: String,
        default: '200px 0px',
    },
    // Distance from the viewport beyond which content unmounts.
    // Must be comfortably larger than mountMargin.
    unmountMargin: {
        type: String,
        default: '800px 0px',
    },
})

const el = ref(null)
const rendered = ref(false)
const placeholderHeight = ref(props.estimatedHeight)

let nearObserver = null
let farObserver = null

onMounted(() => {
    // No IntersectionObserver (e.g. test environment): always render
    if (typeof IntersectionObserver === 'undefined') {
        rendered.value = true
        return
    }

    // Mount band: entering it renders the slot
    nearObserver = new IntersectionObserver(
        (entries) => {
            if (entries[entries.length - 1].isIntersecting) {
                rendered.value = true
            }
        },
        { rootMargin: props.mountMargin },
    )
    nearObserver.observe(el.value)

    // Unmount band: only leaving it entirely removes the slot again
    farObserver = new IntersectionObserver(
        (entries) => {
            if (!entries[entries.length - 1].isIntersecting) {
                // Measure before unmounting so the placeholder keeps the
                // scroll height stable
                if (rendered.value && el.value) {
                    const h = el.value.offsetHeight
                    if (h > 0) placeholderHeight.value = h
                }
                rendered.value = false
            }
        },
        { rootMargin: props.unmountMargin },
    )
    farObserver.observe(el.value)
})

onBeforeUnmount(() => {
    nearObserver?.disconnect()
    nearObserver = null
    farObserver?.disconnect()
    farObserver = null
})
</script>

<style scoped>
/* Subtle card-shaped stand-in so deloaded slots don't look broken */
.lazy-render__placeholder {
    border-radius: 4px;
    background: rgba(var(--v-theme-on-surface), 0.04);
}
</style>
