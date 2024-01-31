<template>
  <v-app class="fontbody">
    <NavBar :loggedIn="isLoggedIn" />
    <v-main>
      <NuxtPage />
    </v-main>
    <FootBar />
  </v-app>
</template>

<script>
import { computed } from 'vue';
import { useMainStore } from '~/stores/main'; // Import your Pinia store
import NavBar from '@/components/layout/NavBar.vue';
import FootBar from '@/components/layout/FootBar.vue';
import { useI18n } from '#imports'
export default {
  setup: () => {
    const mainStore = useMainStore();
    const isLoggedIn = computed(() => mainStore.isLoggedIn());
 
    onMounted(() => {
      const colorSchemeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      const setTheme = () => {
        const theme = mainStore.getColorTheme();
        const colorTheme = colorSchemeMediaQuery.matches ? 'dark' : 'light';
        mainStore.setColorTheme(colorTheme);
        if (theme !== colorTheme) {
          window.location.reload();
        }
      };
      

      // Initial set of the theme
      setTheme();

      // Watch for changes
      watchEffect(() => {
        colorSchemeMediaQuery.addEventListener('change', setTheme);

        // Cleanup function to remove the event listener when the component is unmounted
        return () => {
          colorSchemeMediaQuery.removeEventListener('change', setTheme);
        };
      });
    });

    return { isLoggedIn };
  },
  components: {
    NavBar,
    FootBar,
  },
};
</script>
