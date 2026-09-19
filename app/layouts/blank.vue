<template>
    <v-main>
        <NuxtPage />
    </v-main>
    <GlobalSnackbar />
    <!--
      This layout has no NavBar, so it lacks the client-only marker e2e's
      gotoSettled() waits on to know hydration (and any ssrClientHints
      reload) has happened. See e2e/support/nav.ts.
    -->
    <ClientOnly>
        <div data-testid="page-hydrated" hidden />
    </ClientOnly>
</template>
