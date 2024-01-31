<template>
    <v-data-table
      :headers="headers"
      :items="userList"
    >
      <template v-slot:top>
        <v-toolbar flat color="background">
          <v-divider color="background" class="mx-4" inset vertical></v-divider>
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
  


  <script setup>
  import { ref, reactive, computed, watch, onMounted } from 'vue';
  import { getAllUsers, createUser, updateUser, deleteUser } from '@/services/user';
  import moment from 'moment';
  useHead({
      title: 'User - Verti-Grade',
      meta: [
        {
          name: 'description',
          content: 'User Edit Page for Verti-Grade',
        },
      ],
    });
    definePageMeta({
      authRequired: true,
      middleware: ['auth'],
    });
  const dialog = ref(false);
  const dialogDelete = ref(false);
  const userList = ref([]);
  const headers = ref([]);
  const editIndex = ref(-1);
  const editedItem = reactive({
    firstname: '',
    lastname: '',
    email: '',
    password: '',
  });
  const defaultItem = {
    firstname: '',
    lastname: '',
    email: '',
    password: '',
  };
  
  headers.value = [
    { title: 'Firstname', key: 'firstname' },
    { title: 'Lastname', key: 'lastname' },
    { title: 'Email', key: 'email' },
    { title: 'Created At', key: 'createdAt' },
    { title: 'Updated At', key: 'updatedAt' },
    { title: 'Actions', key: 'actions', sortable: false },
  ];
  
  const formTitle = computed(() => {
    return editIndex.value === -1 ? 'New Item' : 'Edit Item';
  });
  
  watch(dialog, (newVal) => {
    if (!newVal) close();
  });
  
  watch(dialogDelete, (newVal) => {
    if (!newVal) closeDelete();
  });
  
  onMounted(async () => {
    userList.value = await getAllUsers();
  });
  
  function formatDate(date) {
    return moment(date).format('YYYY-MM-DD');
  }
  
  function editItem(item) {
    editIndex.value = userList.value.indexOf(item);
    Object.assign(editedItem, item);
    dialog.value = true;
  }
  
  function deleteItem(item) {
    editIndex.value = userList.value.indexOf(item);
    Object.assign(editedItem, item);
    dialogDelete.value = true;
  }
  
  function deleteItemConfirm() {
    userList.value.splice(editIndex.value, 1);
    deleteUser(editedItem.id);
    closeDelete();
  }
  
  function close() {
    dialog.value = false;
    editIndex.value = -1;
    Object.assign(editedItem, defaultItem);
  }
  
  function closeDelete() {
    dialogDelete.value = false;
    editIndex.value = -1;
    Object.assign(editedItem, defaultItem);
  }
  
  function save() {
    if (editedItem) {
      if (editIndex.value > -1) {
        Object.assign(userList.value[editIndex.value], editedItem);
        updateUser(editedItem);              
      } else {
        userList.value.push(editedItem);
        createUser(editedItem);
      }
      close();
    }
  }
  </script>
  