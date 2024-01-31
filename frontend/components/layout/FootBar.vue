<template>
  <v-footer color="background">
    <v-container>
      <v-row justify="center">
        <v-col>
          <div class="text-center">
            <a
              href="https://www.dav-hanau.de/datenschutz"
              class="footer-link"
              target="_blank"
              >{{ $t("legal.privacy") }}</a
            >
            <span class="footer-separator">|</span>
            <a href="https://www.dav-hanau.de/impressum"
            class="footer-link"
            target="_blank"
            >{{ $t("legal.imprint") }}</a>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </v-footer>
</template>

<style scoped>
.footer-link {
  margin: 0 10px;
  text-decoration: none; /* Removes underline */
  color: inherit; /* Inherits the color from the parent element */
}

.footer-link:hover {
  text-decoration: none; /* Keeps the underline removed on hover */
}

.footer-separator {
  margin: 0 5px;
}
</style>
