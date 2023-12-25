<template>
    <v-container fluid>
        <v-row justify="center" align="center" class="text-center">
            <v-col cols="12">
                <h1 class="display-1">404</h1>
                <h2 class="headline">Page not found</h2>
                <p class="subheading-1">The requested page could not be found.</p>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
export default {
    name: '404View',
}
</script>

<style scoped>
.display-1 {
    font-size: 6rem;
    font-weight: 300;
    margin-bottom: 1rem;
}

.headline {
    font-size: 3rem;
    font-weight: 300;
    margin-bottom: 1rem;
}

.subheading-1 {
    font-size: 1.5rem;
    font-weight: 300;
    margin-bottom: 2rem;
}
</style>
