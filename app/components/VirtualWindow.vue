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
const props = defineProps({
    estimatedHeight: {
        type: Number,
        default: 240,
    },
    mountMargin: {
        type: String,
        default: '200px 0px',
    },
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
    if (typeof IntersectionObserver === 'undefined') {
        rendered.value = true
        return
    }

    nearObserver = new IntersectionObserver(
        (entries) => {
            if (entries[entries.length - 1].isIntersecting) {
                rendered.value = true
            }
        },
        { rootMargin: props.mountMargin },
    )
    nearObserver.observe(el.value)

    farObserver = new IntersectionObserver(
        (entries) => {
            if (!entries[entries.length - 1].isIntersecting) {
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
.lazy-render__placeholder {
    border-radius: 4px;
    background: rgba(var(--v-theme-on-surface), 0.04);
}
</style>
