<template>
    <v-container fluid>
        <v-row justify="center" align="center" class="text-center">
            <v-col cols="12">
                <v-card class="pa-4">
                    <v-card-title class="display-1">404</v-card-title>
                    <v-card-subtitle class="headline"
                        >Page not found</v-card-subtitle
                    >
                    <v-card-text class="subheading-1"
                        >The requested page could not be found.</v-card-text
                    >
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
export default {
    name: 'NotFoundView',
}
</script>

<style scoped></style>
