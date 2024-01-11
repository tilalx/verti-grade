<template>
    <v-data-table
      :headers="headers"
      :items="userList"
    >
      <template v-slot:top>
        <v-toolbar flat>
          <v-divider class="mx-4" inset vertical></v-divider>
          <v-spacer></v-spacer>
          <v-dialog v-model="dialog" max-width="500px">
            <template v-slot:[`activator`]="{ props }">
              <v-btn dark class="mb-2" v-bind="props">
                Add New user
              </v-btn>
            </template>
            <v-card>
                <v-card-title>
                    <span class="headline">{{ formTitle }}</span>
                </v-card-title>
              <v-card-text>
                <v-container>
                  <v-row>
                    <v-col cols="12">
                      <v-text-field
                        v-model="editedItem.firstname"
                        label="First Name"
                      ></v-text-field>
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col cols="12">
                      <v-text-field
                        v-model="editedItem.lastname"
                        label="Last Name"
                      ></v-text-field>
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col cols="12">
                      <v-text-field
                        v-model="editedItem.email"
                        label="Email"
                        type="email"
                      ></v-text-field>
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col cols="12" >
                      <v-text-field
                        v-model="editedItem.password"
                        label="Password"
                        type="password"
                      ></v-text-field>
                    </v-col>
                  </v-row>
                </v-container>
              </v-card-text>
  
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn variant="text" @click="close">
                  Cancel
                </v-btn>
                <v-btn color="primary" variant="text" @click="save">
                  Save
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
          <v-dialog v-model="dialogDelete" max-width="500px">
            <v-card>
              <v-card-title class="text-h5"
                >Are you sure you want to delete this item?</v-card-title
              >
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue-darken-1" variant="text" @click="closeDelete"
                  >Cancel</v-btn
                >
                <v-btn
                  color="blue-darken-1"
                  variant="text"
                  @click="deleteItemConfirm"
                  >OK</v-btn
                >
                <v-spacer></v-spacer>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-toolbar>
      </template>
      <template v-slot:[`item.actions`]="{ item }">
        <v-icon size="small" class="me-2" @click="editItem(item)" icon="mdi-pencil">
            
        </v-icon>
        <v-icon size="small" @click="deleteItem(item)" icon="mdi-delete"></v-icon>
      </template>
    </v-data-table>
  </template>
  


<script>
import { getAllUsers, createUser, updateUser, deleteUser } from '@/services/user';
import moment from 'moment';

export default {
  name: 'UserList',
  data: () => ({
      dialog: false,
      dialogDelete: false,
      headers: [
        { title: 'Firstname', key: 'firstname' },
        { title: 'Lastname', key: 'lastname' },
        { title: 'Email', key: 'email' },
        { title: 'Created At', key: 'createdAt' },
        { title: 'Updated At', key: 'updatedAt' },
        { title: 'Actions', key: 'actions', sortable: false },
      ],
      userList: [],
      editIndex: -1,
      editedItem: {
        firstname: '',
        lastname: '',
        email: '',
        password: '',
      },
      defaultItem: {
        firstname: '',
        lastname: '',
        email: '',
        password: '',
      },

    }),
    computed: {
      formTitle() {
        return this.editedIndex === -1 ? 'New Item' : 'Edit Item'
      },
    },

    watch: {
      dialog(val) {
        val || this.close()
      },
      dialogDelete(val) {
        val || this.closeDelete()
      },
    },
    async created() {
        await this.getAllUsers(); // Fetch all users when the component is created
    },
    methods: {
        async getAllUsers() {
        this.userList = await getAllUsers(); // Fetch all users
        },
        formatDate(date) {
        return moment(date).format('YYYY-MM-DD');
        },
        editItem(item) {
            this.editedIndex = this.userList.indexOf(item)
            this.editedItem = Object.assign({}, item)
            this.dialog = true
        },

        deleteItem(item) {
            this.editedIndex = this.userList.indexOf(item)
            this.editedItem = Object.assign({}, item)
            this.dialogDelete = true
        },

        deleteItemConfirm() {
            this.userList.splice(this.editedIndex, 1)
            deleteUser(this.editedItem.id);
            this.closeDelete()
        },

        close() {
            this.dialog = false
            this.$nextTick(() => {
            this.editedItem = Object.assign({}, this.defaultItem)
            this.editedIndex = -1
            })
        },

        closeDelete() {
            this.dialogDelete = false
            this.$nextTick(() => {
            this.editedItem = Object.assign({}, this.defaultItem)
            this.editedIndex = -1
            })
        },

        save() {
            if (this.editedItem) {
                if (this.editedIndex > -1) {
                    Object.assign(this.userList[this.editedIndex], this.editedItem);
                    updateUser(this.editedItem);              
                } else {
                    this.userList.push(this.editedItem);
                    createUser(this.editedItem);
                }
                this.close();
            }
        },
        },
    }
</script>