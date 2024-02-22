<template>
    <v-container fluid>
        <v-btn color="primary" class="mb-2" @click="openDialog">Add New Person</v-btn>

        <v-text-field v-model="search" label="Search" clearable></v-text-field>
        <v-data-table :headers="headers" :items="peopleData" sticky :search="search">
            <template v-slot:item.linkedinURL="{ item }">
                <a :href="prefixHttp(item.linkedinURL)" target="_new">
                    <v-icon>mdi-linkedin</v-icon>
                </a>
            </template>
            <template v-slot:item.edit="{ item }">
                <v-btn icon @click="editItem(item)">
                    <v-icon>mdi-pencil</v-icon>
                </v-btn>
            </template>
            <template v-slot:item.remove="{ item }">
                <v-btn icon @click="removeItem(item)">
                    <v-icon>mdi-delete</v-icon>
                </v-btn>
            </template>
        </v-data-table>
        <!-- Add/Edit Person Dialog -->
        <v-dialog v-model="dialog" persistent max-width="600px">
            <v-card>
                <v-card-title>
                    <span class="headline">{{ editedIndex > 0 ? 'Edit Person' : 'Add New Person' }}</span>
                </v-card-title>
                <v-card-text>
                    <v-container>
                        <v-form ref="form" >
                            <v-text-field v-model="editedPerson.firstName" label="First Name" required></v-text-field>
                            <v-text-field v-model="editedPerson.lastName" label="Last Name"></v-text-field>
                            <v-text-field v-model="editedPerson.linkedinURL" label="Linkedin URL"></v-text-field>
                            <image-editor :image-url="editedPerson.imageUrl" :image-id="editedPerson.imageId" ref="imageEditorRef" 
                            image-height=300 image-width=400
                            @image-change="handleImageChange" @gps-data="handleGPSData"></image-editor>

                        </v-form>
                    </v-container>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="blue darken-1" text @click="closeDialog">Cancel</v-btn>
                    <v-btn color="blue darken-1" text @click="saveItem">Save</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

    </v-container>
</template>
  
<script setup>

import { usePeopleDataStore } from "../store/peopleStore";
import { ref } from 'vue';
import ImageEditor from "./imageEditor.vue"
const store = usePeopleDataStore();

const peopleData = store.people;

const search = ref("")
const headers = [
    { title: 'First Name', value: 'firstName', sortable: true },
    { title: 'Last Name', value: 'lastName', sortable: true },
    { title: 'Linkedin Profile', value: 'linkedinURL' },
    { title: "Edit", value: 'edit' },
    { title: "Delete", value: 'remove' },
]

const dialog = ref(false)
const imageEditorRef = ref(null)

const editedIndex = ref(-1)

let editedPerson = ref({
    firstName: '',
    lastName: '',
    linkedinURL: '',
    imageUrl: '',
    imageId: '' 
})

const defaultPerson = {
    firstName: '',
    lastName: '',
    linkedinURL: '',
}

const handleImageChange = (event) => {
    console.log(JSON.stringify(event))
    editedPerson.value.imageId = event.imageId	
    editedPerson.value.imageUrl = event.imageUrl	
}

const handleGPSData = (event) => {
    console.log("GPS Data for image "+JSON.stringify(event))
}
const editItem = (item) => {
    editedIndex.value = 1
    editedPerson.value = { ...item }; // Make a copy of the item to edit
    dialog.value = true;
}

const removeItem = (item) => {
    store.removePerson(item)
}

const openDialog = () => {
    resetForm();
    dialog.value = true;
}
const closeDialog = () => {
    dialog.value = false;
    resetForm();
}

const resetForm = () => {
    editedPerson.value = { ...defaultPerson };
    editedIndex.value = -1;
}

const saveItem = () => {
    if (editedIndex.value > -1) {
        // update existing location 
        store.updatePerson(editedPerson.value)
    } else {
        store.addPerson(editedPerson.value)
    }
    closeDialog();
}

const prefixHttp = (url) => {
    // Ensure the URL starts with http:// or https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return `https://${url}`;
    }
    return url;
}

</script>
  
<style lang="scss" scoped></style>