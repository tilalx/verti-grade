<template>
    <div>
        <v-btn @click="openDialog">Create User</v-btn>
        <v-dialog v-model="dialog" persistent max-width="600px">
            <v-card>
                <v-card-title>Create User</v-card-title>
                <v-card-text>
                    <v-form ref="form" @submit.prevent="createUser" v-model="valid">
                        <v-text-field
                            v-model="user.firstname"
                            :rules="nameRules"
                            label="$t('account.firstname')')"
                            required></v-text-field>
                        <v-text-field
                            v-model="user.lastname"
                            :rules="nameRules"
                            label="$t('account.lastname')')"
                            required></v-text-field>
                        <v-text-field
                            v-model="user.email"
                            :rules="emailRules"
                            label="$t('account.email')')"
                            type="email"
                            required></v-text-field>
                        <v-text-field
                            v-model="user.password"
                            :rules="passwordRules"
                            label="$t('account.password')"
                            type="password"
                            required></v-text-field>
                    </v-form>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="blue darken-1" text @click="closeDialog">Cancel</v-btn>
                    <!-- Disable the button if the form is invalid -->
                    <v-btn :disabled="!valid" color="blue darken-1" text @click="createUser">Create</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
import { createUser } from '@/services/user';

export default {
    data() {
        return {
            dialog: false,
            valid: true, // to control the form validity
            user: {
                firstname: '',
                lastname: '',
                email: '',
                password: ''
            },
            // Define rules
            nameRules: [
                v => !!v || 'Name is required',
                v => (v && v.length <= 10) || 'Name must be less than 10 characters'
            ],
            emailRules: [
                v => !!v || 'E-mail is required',
                v => /.+@.+\..+/.test(v) || 'E-mail must be valid'
            ],
            passwordRules: [
                v => !!v || 'Password is required',
                v => (v && v.length >= 6) || 'Password must be more than 5 characters'
            ]
        };
    },
    methods: {
        openDialog() {
            this.dialog = true;
        },
        closeDialog() {
            this.dialog = false;
            this.$emit('closed')
        },
        createUser() {
            if (this.$refs.form.validate()) { // Check if the form is valid
                createUser(this.user).then(() => {
                    this.$emit('user-created');
                    this.closeDialog();
                }).catch(error => {
                    console.error('There was an error creating the user:', error);
                    // Handle errors here, such as displaying a notification
                });
            }
        }
    }
};
</script>
