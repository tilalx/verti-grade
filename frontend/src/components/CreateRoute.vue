<template>
  <div>
    <v-container>
      <v-row>
        <v-btn color="primary" @click="openPopup" class="create-route-button">Create Route</v-btn>
        <v-dialog v-model="showPopup" persistent max-width="600px">
          <v-card>
            <v-card-title>
              <span class="headline">{{ $t("header.create_route") }}</span>
            </v-card-title>
            <v-card-text>
              <v-container>
                <v-form ref="form" @submit.prevent="createRoute" v-model="valid">
                  <v-text-field label="Name" v-model="routeName" :rules="nameRules" required></v-text-field>
                  
                  <v-select label="Difficulty" :items="difficulties" v-model="routeDifficulty" required></v-select>

                  <v-select label="Difficulty + or -" :items="['', '+', '-']" v-model="routeDifficultySign" ></v-select>

                  <v-select label="Location" :items="locations" v-model="routeLocation" required></v-select>

                  <v-select label="Type" :items="['Boulder', 'Route']" v-model="routeType" required></v-select>

                  <v-textarea label="Comment" v-model="routeComment" :counter="255"></v-textarea>
                  
                  <v-text-field label="Creator split by ," v-model="routeCreators" :rules="nameRules" required></v-text-field>
                  <v-text-field v-model="routeScrewDate" label="Screw Date" type="date" required></v-text-field>
                  <div class="color-picker-container">
                    <v-color-picker v-model="routeColor" :modes="['hexa']" label="Route Color" required></v-color-picker>
                  </div>
                </v-form>
              </v-container>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="blue darken-1" text @click="closePopup">{{ $t("actions.cancel") }}</v-btn>
              <v-btn color="blue darken-1" text @click="validate" :disabled="!valid || !isFormComplete">{{ $t("actions.create") }}</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-row>
    </v-container>
  </div>
</template>


<script>
import { createClimbingRoute } from '@/services/climbingRoutes';
export default {
  data() {
    return {
      showPopup: false,
      routeName: '',
      routeDifficulty: '',
      routeDifficultySign: '',
      routeLocation: '',
      routeType: '',
      routeComment: '',
      routeCreators: '',
      routeScrewDate: '',
      routeColor: '',
      valid: false,
      nameRules: [
        v => !!v || this.$t('notifications.error.nameRequired'),
        v => v.length <= 30 || this.$t('notifications.error.nameTooLong')
      ],
      difficulties: Array.from({ length: 10 }, (_, i) => (i + 1).toString()),
      locations: ['Hanau', 'Gelnhausen'],
    };
  },
  computed: {
    isFormComplete() {
      return (
        this.routeName &&
        this.routeDifficulty &&
        this.routeLocation &&
        this.routeType &&
        this.routeCreators && 
        this.routeScrewDate && 
        this.routeColor
      );
    },
  },
  methods: {
    openPopup() {
      this.showPopup = true;
    },
    closePopup() {
      this.showPopup = false;
      this.$emit('closed');
    },
    validate() {
      if (this.$refs.form.validate() && this.isFormComplete) {
        this.createRoute();
      }
    },
    createRoute() {
      const routeData = {
        name: this.routeName,
        difficulty: this.routeDifficulty,
        difficultySign: this.routeDifficultySign || '',
        location: this.routeLocation,
        type: this.routeType,
        comment: this.routeComment || '',
        creators: this.routeCreators.split(','),
        screwDate: this.routeScrewDate,
        color: this.routeColor,
      };
      const jsonData = JSON.stringify(routeData);
      createClimbingRoute(jsonData);
      this.showPopup = false;
      this.$refs.form.reset();
      this.$emit('routeCreated', jsonData);
    }
  }
};
</script>

<style>
.color-picker-container {
  display: flex;
  justify-content: center;
  align-items: center; /* Optional, if you also want vertical centering */
  height: 100%; /* Adjust as needed */
}
</style>
