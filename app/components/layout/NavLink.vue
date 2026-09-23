<template>
    <!-- Leaf link -->
    <router-link
        v-if="!children"
        :to="to"
        custom
        v-slot="{ isActive, navigate }"
    >
        <button
            @click="navigate"
            :class="['nav-link', { 'nav-link--active': isActive }]"
            :data-testid="`nav-link-${navTestId(to)}`"
        >
            <v-icon :icon="icon" size="16" class="nav-link-icon" />
            <span class="nav-link-label">{{ $t(label) }}</span>
            <span v-if="isActive" class="nav-link-pip" />
        </button>
    </router-link>

    <v-menu v-else location="bottom start" offset="4">
        <template #activator="{ props: menuProps }">
            <button
                v-bind="menuProps"
                :class="['nav-link', { 'nav-link--active': groupActive }]"
                :data-testid="`nav-group-${groupKey}`"
            >
                <v-icon :icon="icon" size="16" class="nav-link-icon" />
                <span class="nav-link-label">{{ $t(label) }}</span>
                <v-icon
                    icon="mdi-chevron-down"
                    size="14"
                    class="nav-link-chevron"
                />
                <span v-if="groupActive" class="nav-link-pip" />
            </button>
        </template>

        <v-card elevation="3" border>
            <v-list density="compact" nav slim min-width="210" class="py-1">
                <v-list-item
                    v-for="child in children"
                    :key="child.to"
                    :to="child.to"
                    :prepend-icon="child.icon"
                    :title="$t(child.label)"
                    rounded="lg"
                    density="compact"
                    :data-testid="`nav-link-${navTestId(child.to)}`"
                />
            </v-list>
        </v-card>
    </v-menu>
</template>

<script setup lang="ts">
interface NavChild {
    to: string
    icon: string
    label: string
}

const props = withDefaults(
    defineProps<{
        to?: string
        icon: string
        label: string
        children?: NavChild[] | null
        groupKey?: string
    }>(),
    { to: '', children: null, groupKey: '' },
)

const route = useRoute()

const groupActive = computed(
    () => props.children?.some((child) => route.path === child.to) ?? false,
)
</script>

<style scoped>
.nav-link {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 8px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 0.84rem;
    font-weight: 500;
    letter-spacing: 0.01em;
    color: rgba(var(--v-theme-on-surface), 0.65);
    transition:
        color 0.18s ease,
        background 0.18s ease;
    white-space: nowrap;
    text-decoration: none;
}

.nav-link:hover {
    color: rgba(var(--v-theme-on-surface), 0.95);
    background: rgba(var(--v-theme-on-surface), 0.06);
}

.nav-link--active {
    color: rgb(var(--v-theme-primary));
    background: rgba(var(--v-theme-primary), 0.1);
    font-weight: 600;
}

.nav-link--active:hover {
    background: rgba(var(--v-theme-primary), 0.15);
}

.nav-link-icon {
    opacity: 0.8;
    transition: opacity 0.18s ease;
}

.nav-link--active .nav-link-icon {
    opacity: 1;
}

.nav-link-chevron {
    opacity: 0.5;
    margin-left: -2px;
}

/* Small active dot under label */
.nav-link-pip {
    position: absolute;
    bottom: 3px;
    left: 50%;
    transform: translateX(-50%);
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgb(var(--v-theme-primary));
    animation: pip-in 0.2s ease;
}

@keyframes pip-in {
    from {
        opacity: 0;
        transform: translateX(-50%) scale(0);
    }
    to {
        opacity: 1;
        transform: translateX(-50%) scale(1);
    }
}
</style>
