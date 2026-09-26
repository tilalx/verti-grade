<template>
    <v-main>
        <slot />
    </v-main>
    <GlobalSnackbar />
    <!-- No NavBar here, so gotoSettled() (e2e/support/nav.ts) needs this hydration marker instead -->
    <ClientOnly>
        <div data-testid="page-hydrated" hidden />
    </ClientOnly>
</template>
