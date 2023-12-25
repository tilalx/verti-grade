<template>
  <v-app class="fontbody">
    <v-app-bar app dense color="primary" v-if="$route.meta.navbar !== false">
      <v-toolbar-title to="/">Verti-Grade</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn text to="/">Home</v-btn>
      <v-btn v-if="isLoggedIn" text to="/dashboard">{{ $t('routes.dashboard') }}</v-btn>
      <v-btn v-if="!isLoggedIn" text to="/login">
        <v-btn-icon>
          <v-icon class="mdi mdi-login"></v-icon>
        </v-btn-icon>
      </v-btn>
      <v-btn v-if="isLoggedIn" text to="/user">{{ $t('routes.users') }}</v-btn>
      <LogOut v-if="isLoggedIn"></LogOut>
    </v-app-bar>
    <v-main>
      <router-view></router-view>
    </v-main>
  </v-app>
</template>

<script>
import { mapState } from 'vuex';
import LogOut from './components/LogOut.vue';

export default {
  name: 'App',
  components: { LogOut },
  computed: {
    ...mapState(['token']),
    isLoggedIn() {
      return this.token !== null;
    }
  },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css?family=Roboto:400,700&display=swap');
.fontbody {
    font-family: 'Roboto', sans-serif;
}
</style>
