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
            <v-card >
                <v-card-title>
                    <span class="headline">{{ editedIndex > 0 ? 'Edit Story' : 'Add New Story' }}</span>
                </v-card-title>
                <v-card-text>
                    <v-container>
                        <v-form ref="form">
                            <v-text-field v-model="editedStory.label" label="label" required></v-text-field>
                            <v-text-field v-model="editedStory.title" label="title" required></v-text-field>
                            <v-text-field v-model="editedStory.description" label="Description"></v-text-field>

                            <!-- <v-img v-if="imageSrc" :src="imageSrc" class="mt-5" height="50"></v-img> -->
                            
                            <image-editor :image-url="editedStory.imageUrl" :image-id="editedStory.imageId" ref="imageEditorRef" 
                            image-height="600" image-width="800"
                            @image-change="handleImageChange"></image-editor>
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
import ImageEditor from "./imageEditor.vue"

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
const imageEditorRef = ref(null)

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

const handleImageChange = (event) => {
    console.log(JSON.stringify(event))
    editedStory.value.imageId = event.imageId	
    editedStory.value.imageUrl = event.imageUrl	
    
}

const editItem = (item) => {
    editedIndex.value = 1
    editedStory.value = { ...item }; // Make a copy of the item to edit
    // if (editedStory.value.imageId) displayImageFromDB(editedStory.value.imageId)
    // else imageSrc.value = editedStory.value.imageUrl
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
    await imageEditorRef.value.handlePaste(event)

}


// const imageSrc = ref('')

// const displayImageFromDB = async (imageId) => {
//     imageSrc.value = null
//     if (!imageId) return
//     const url = await imagesStore.getUrlForIndexedDBImage(imageId)
//     imageSrc.value = url;
// }


</script>
  
<style lang="scss" scoped></style>