<template>
    <router-link :to="to" custom v-slot="{ isActive, navigate }">
        <button
            @click="navigate"
            :class="['nav-link', { 'nav-link--active': isActive }]"
        >
            <v-icon :icon="icon" size="16" class="nav-link-icon" />
            <span class="nav-link-label">{{ label }}</span>
            <span v-if="isActive" class="nav-link-pip" />
        </button>
    </router-link>
</template>

<script setup>
defineProps({
    to:    { type: String, required: true },
    icon:  { type: String, required: true },
    label: { type: String, required: true },
})
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
    transition: color 0.18s ease, background 0.18s ease;
    white-space: nowrap;
    text-decoration: none;
}

.nav-link:hover {
    color: rgba(var(--v-theme-on-surface), 0.95);
    background: rgba(var(--v-theme-on-surface), 0.06);
}

.nav-link--active {
    color: rgb(var(--v-theme-primary));
    background: rgba(var(--v-theme-primary), 0.10);
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
    from { opacity: 0; transform: translateX(-50%) scale(0); }
    to   { opacity: 1; transform: translateX(-50%) scale(1); }
}
</style>