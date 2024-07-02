<template>
    <v-app>
        <v-container fill-height fluid>
            <v-row justify="center" align="center">
                <v-empty-state
                    headline="Whoops, 404"
                    title="Page not found"
                    text="The page you were looking for does not exist"
                    image="https://vuetifyjs.b-cdn.net/docs/images/logos/v.png"
                >
                    <!-- Button to go back home -->
                    <template v-slot:actions>
                        <v-btn color="primary" to="/" nuxt>
                            Back to Home
                        </v-btn>
                    </template>
                </v-empty-state>
            </v-row>
        </v-container>
    </v-app>
</template>

<script>
export default {
    props: {
        error: {
            type: Object,
            default: () => ({}),
        },
    },
    head() {
        return {
            title: `${this.error.statusCode || 404} Error`,
        }
    },
}
</script>

<style scoped>
/* You can add custom styles specific to this error page here */
</style>
