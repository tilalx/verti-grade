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
import { computed, onMounted, watchEffect } from "vue";
import { useMainStore } from "~/stores/main"; // Import your Pinia store
import NavBar from "@/components/layout/NavBar.vue";
import FootBar from "@/components/layout/FootBar.vue";
import { useTheme } from "vuetify";
export default {
  setup: () => {
    const mainStore = useMainStore();
    const theme = useTheme();

    const supabase = useSupabaseClient();

    const isLoggedIn = ref(false);

    const checkSession = async () => {
      const session = await supabase.auth.getSession();
      isLoggedIn.value = session.data.session != null;
    };

    // When the component is mounted, check the session immediately
    onMounted(async () => {
      await checkSession();
      supabase.auth.onAuthStateChange(async (event, session) => {
        isLoggedIn.value = session != null;
      });
    });

    onMounted(() => {
      const colorSchemeMediaQuery = window.matchMedia(
        "(prefers-color-scheme: dark)"
      );

      const setTheme = () => {
        const currentTheme = mainStore.getColorTheme;
        const colorTheme = colorSchemeMediaQuery.matches ? "dark" : "light";
        mainStore.setColorTheme(colorTheme);
        if (currentTheme !== colorTheme) {
          theme.global.name.value = theme.global.current.value.dark
            ? "light"
            : "dark";
        }
      };
      // Initial set of the theme
      setTheme();

      // Watch for changes
      watchEffect(() => {
        colorSchemeMediaQuery.addEventListener("change", setTheme);

        return () => {
          colorSchemeMediaQuery.removeEventListener("change", setTheme);
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
