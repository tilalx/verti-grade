<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title> QR Code Image </v-card-title>
          <v-card-text>
            <div class="qr-code-container">
              <v-img
                v-if="qrCodeUrl"
                :src="qrCodeUrl"
                aspect-ratio="1"
                max-height="64"
                @click="showQrCode = true"
                class="qr-code-thumbnail"
              ></v-img>
              <v-progress-circular v-else indeterminate></v-progress-circular>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title> SAML Login Data </v-card-title>
          <v-card-text>
            <v-form>
              <v-text-field
                label="SAML Endpoint"
                v-model="samlData.endpoint"
                required
              ></v-text-field>

              <v-text-field
                label="SAML Entity ID"
                v-model="samlData.entityId"
                required
              ></v-text-field>

              <v-btn @click="submitSamlData">Submit</v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- QR Code Popup Dialog -->
    <v-dialog v-model="showQrCode" max-width="500px">
      <v-card>
        <v-card-title>
          QR Code
          <v-spacer></v-spacer>
          <v-btn icon @click="showQrCode = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-img :src="qrCodeUrl" aspect-ratio="1"></v-img>
          <v-file-input
            label="Upload new QR image"
            v-model="uploadedFile"
            @change="onFileChange"
            accept=".jpg, .jpeg, .png"
            class="mt-2"
          ></v-file-input>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from "vue";

useHead({
  title: "Settings - Verti-Grade",
  meta: [
    {
      name: "description",
      content: "Settings for Verti-Grade",
    },
  ],
});

definePageMeta({
  authRequired: true,
  middleware: ["auth"],
});

const supabase = useSupabaseClient();
const qrCodeUrl = ref(null);
const uploadedFile = ref(null);
const samlData = ref({
  endpoint: "",
  entityId: "",
});
const showQrCode = ref(false);

const fetchQrCodeUrl = async () => {
  const { data: imageUrl, error } = supabase.storage
    .from("img")
    .getPublicUrl("public/logo.png");
  qrCodeUrl.value = imageUrl.publicUrl;
  if (error) {
    qrCodeUrl.value = "https://cdn-icons-png.flaticon.com/512/5650/5650380.png";
    return;
  }
};

onMounted(() => {
  fetchQrCodeUrl();
});

const onFileChange = async (event) => {
  const file = event.target.files[0];
  if (!file) {
    return;
  }

  qrCodeUrl.value = null;

  //Copy the old file to trash
  const { error: deleteError } = await supabase.storage
    .from("img")
    .remove(["public/logo.png"]);

  if (deleteError) {
    console.error(deleteError);
    return;
  }

  const { error: uploadError } = await supabase.storage
    .from("img")
    .upload("public/logo.png", file);
  if (uploadError) {
    console.error(uploadError);
    return;
  }
  fetchQrCodeUrl();
};

const submitSamlData = () => {
  // Handle SAML data submission logic here
  console.log(samlData.value);
};
</script>

<style scoped>
.qr-code-container {
  max-height: 64px; /* Adjust this value to match the height of the file input */
  overflow: hidden;
  cursor: pointer;
}

.qr-code-thumbnail {
  height: 64px;
  width: 64px;
}
</style>
