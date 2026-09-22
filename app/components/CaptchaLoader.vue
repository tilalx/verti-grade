<template>
    <!--
        Replaces a v-btn's spinner while the captcha is solving. Vuetify hides
        the button's own label under `loading`, so the progress has to live in
        the loader slot -- there is nowhere else on the button to put it.
    -->
    <span
        v-if="solving"
        class="d-inline-flex align-center ga-2"
        data-testid="captcha-progress"
    >
        <v-progress-circular indeterminate size="16" width="2" />
        {{ $t('captcha.verifying', { progress }) }}
    </span>
    <v-progress-circular v-else indeterminate size="20" width="2" />
</template>

<script setup>
const { solving, progress } = useCapToken()
</script>
