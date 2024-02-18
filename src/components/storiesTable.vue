<template>
    <v-container class="pt-10">
        <v-btn color="primary" class="mb-2" @click="openDialog">Add New Story</v-btn>

        <v-text-field v-model="search" label="Search" clearable></v-text-field>
        <v-data-table :headers="headers" :items="storyData" :search="search" :item-value="item => `${item.label}`"
            show-select return-object>
            <template v-slot:item.edit="{ item }">
                <v-btn icon @click="editItem(item)">
                    <v-icon>mdi-pencil</v-icon>
                </v-btn>
            </template> <template v-slot:item.remove="{ item }">
                <v-btn icon @click="removeItem(item)">
                    <v-icon>mdi-delete</v-icon>
                </v-btn>
            </template>
        </v-data-table>
        <!-- Add/Edit Story Dialog -->
        <v-dialog v-model="dialog" persistent max-width="600px">
            <v-card @paste.prevent="handlePaste">
                <v-card-title>
                    <span class="headline">{{ editedIndex > 0 ? 'Edit Story' : 'Add New Story' }}</span>
                </v-card-title>
                <v-card-text>
                    <v-container>
                        <v-form ref="form">
                            <v-text-field v-model="editedStory.label" label="label" required></v-text-field>
                            <v-text-field v-model="editedStory.title" label="title" required></v-text-field>
                            <v-text-field v-model="editedStory.description" label="Description"></v-text-field>
                            <!-- TODO: Add image -->

                            <v-img v-if="imageSrc" :src="imageSrc" class="mt-5"></v-img>
                            <v-file-input label="Upload image from file" @change="handleFileUpload"
                                accept="image/*"></v-file-input>
                            <v-text-field v-model="editedStory.imageUrl" label="Cover Image URL"></v-text-field>

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

import { useStorieStore } from "../store/storiesStore";
import { useImagesStore } from "../store/imagesStore";

import { ref } from 'vue';

const store = useStorieStore()
const imagesStore = useImagesStore()
const storyData = store.stories;

const search = ref("")

const headers = [
    { title: 'Label', value: 'label', sortable: true },
    { title: 'Title', value: 'title' },
    { title: 'Description', value: 'description' },
    { title: "Edit", value: 'edit' },
    { title: "Delete", value: 'remove' },
]


const dialog = ref(false)

const editedIndex = ref(-1)

let editedStory = ref({
    label: '',
    title: '',
    description: '',
    imageUrl: '',

})

const defaultStory = {
    label: '',
    title: 'New Story',
    description: '',
    imageUrl: '',
}

const editItem = (item) => {
    editedIndex.value = 1
    editedStory.value = { ...item }; // Make a copy of the item to edit
    if (editedStory.value.imageId) displayImageFromDB(editedStory.value.imageId)
    else imageSrc.value = editedStory.value.imageUrl
    dialog.value = true;
}

const removeItem = (item) => {
    store.removeStory(item)
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
    editedStory.value = { ...defaultStory };
    editedIndex.value = -1;
}

const saveItem = () => {
    if (editedIndex.value > -1) {
        // update existing story 
        store.updateStory(editedStory.value)
    } else {
        store.addStory(editedStory.value)
    }
    closeDialog();
}

const handlePaste = async (event) => {

    if (event.clipboardData && event.clipboardData.items) {
        const items = event.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            // Check if the item is an image
            if (items[i].type.indexOf("image") !== -1) {
                const file = items[i].getAsFile();
                imagesStore.resizeImage(file, 800, 600, async (resizedBlob) => {
                    // Now you have a resized image as a Blob, you can store it in IndexedDB
                    const imageId = await  imagesStore.saveImage(resizedBlob);
                    editedStory.value.imageId = imageId;
                    console.log('Image stored in IndexedDB with ID:', imageId);
                    displayImageFromDB(imageId)

                });
            }

            // if item is a string that is a valid URL - set the imageUrl property and try to download and store that image (that will probably fail because of CORS limitations)
            // 
            if (items[i].type.indexOf("text") !== -1) {
                const text = (event.clipboardData || window.clipboardData).getData('text');
                if (isValidImageUrl(text)) { // Implement isValidImageUrl according to your needs
                    editedStory.value.imageUrl = text
                    imageSrc.value = text
                    try {
                        const response = await fetch(text);
                        if (!response.ok) throw new Error('Network response was not ok.');
                        const blob = await response.blob();
                        imagesStore.resizeImage(blob, 800, 600, async (resizedBlob) => {
                            const imageId = await  imagesStore.saveImage(resizedBlob);
                            editedStory.value.imageId = imageId;
                            console.log('Image stored in IndexedDB with ID:', imageId);
                            displayImageFromDB(imageId)
                        });
                    } catch (error) {
                        console.error('Fetching and storing image failed:', error);
                    }
                }

            }
        }
    }
}
const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        imagesStore.resizeImage(file, 800, 600, async (resizedBlob) => {
            // Now you have a resized image as a Blob, you can store it in IndexedDB
            // Assuming this function stores the Blob in IndexedDB

            const imageId = await imagesStore.saveImage(resizedBlob);
            editedStory.value.imageId = imageId;
            console.log('Image stored in IndexedDB with ID:', imageId);
            displayImageFromDB(imageId)
        });
    }
}

const isValidImageUrl = (url) => {
    return url.match(/\.(jpeg|jpg|gif|png)$/i) != null;
}


const imageSrc = ref('')

const displayImageFromDB = async (imageId) => {
    imageSrc.value = null
    if (!imageId) return
    const url = await imagesStore.getUrlForIndexedDBImage(imageId)
    imageSrc.value = url; // Assuming you have an imageSrc data property for binding to an <img> src        
}


</script>
  
<style lang="scss" scoped></style>