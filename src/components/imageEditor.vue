<template>
    <div @paste.prevent="handlePaste">
        <v-btn v-if="imageSrc" @click="clearImage" prepend-icon="mdi-close-box">Clear Image</v-btn>
        <v-img v-if="imageSrc" :src="imageSrc" :width="imageWidth" :height="imageHeight" class="mt-5"></v-img>
        <v-file-input label="Upload image from file" @change="handleFileUpload" accept="image/*"></v-file-input>
        <v-text-field v-model="imageUrl" label="Image URL"></v-text-field>
    </div>
</template>
<script setup>

import { useImagesStore } from "../store/imagesStore";
const imagesStore = useImagesStore()

import { ref, onMounted } from 'vue';

const props = defineProps({
    imageId: Number,
    imageUrl: String,
    imageHeight: String,
    imageWidth: String
});

const imageId = ref(props.imageId)
const imageUrl = ref(props.imageUrl)
const imageSrc = ref("")
const imageHeight = ref(props.imageHeight)
const imageWidth = ref(props.imageWidth)
const emit = defineEmits(['imageChange','gpsData'])

onMounted(() => {
    setImageIdUrl()
});

const emitImageChange = () => {
    emit('imageChange', { "imageId": imageId.value, "imageUrl": imageUrl.value })
}
const emitGPSData = (gpsData) => {
    emit('gpsData', gpsData)
}


const setImageIdUrl = async () => {
    if (props.imageId) {
        const imageIdUrl = await imagesStore.getUrlForIndexedDBImage(props.imageId)
        imageSrc.value = imageIdUrl
    }
}

const clearImage = async () => {
    await resetImage()
    emitImageChange()
}

// remove existing image from indexedDB or reset imageUrl
const resetImage = async () => {
    // remove from indexedDB image with if imageId.value
    if (imageId.value) await imagesStore.removeImage(imageId.value	)
    imageId.value=null
    imageUrl.value=null
    imageSrc.value = null
}

const displayImageFromDB = async (imageId) => {
    if (!imageId) return
    const url = await imagesStore.getUrlForIndexedDBImage(imageId)
    imageSrc.value = url
}

const handlePaste = async (event) => {

    if (event.clipboardData?.items) {
        const items = event.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            // Check if the item is an image
            if (items[i].type.indexOf("image") !== -1) {
                const file = items[i].getAsFile();
                imagesStore.resizeImage(file, imageWidth.value, imageHeight.value, async (resizedBlob) => {
                    // Now you have a resized image as a Blob, you can store it in IndexedDB
                    const newImageId = await imagesStore.saveImage(resizedBlob);
                    //   editedStory.value.imageId = imageId;
                    console.log('Image stored in IndexedDB with ID:', newImageId);
                    resetImage() // if a prior image was defined, remove it now
                    imageId.value = newImageId
                    imageUrl.value = null
                    emitImageChange()
                    displayImageFromDB(newImageId)
                });

                imagesStore.extractEXIFData(file).then(({ dateTimeOriginal, gpsInfo }) => {
                    console.log('Timestamp:', dateTimeOriginal);
                    console.log('GPS Info:', gpsInfo);
                    // Process the EXIF data as needed
                    emitGPSData( { dateTimeOriginal, gpsInfo })
                }).catch(error => {
                    console.error('Error extracting EXIF data:', error);
                });

            }

            // if item is a string that is a valid URL - set the imageUrl property and try to download and store that image (that will probably fail because of CORS limitations)
            // 
            if (items[i].type.indexOf("text") !== -1) {
                const text = (event.clipboardData || window.clipboardData).getData('text');
                if (isValidImageUrl(text)) { // Implement isValidImageUrl according to your needs
                    resetImage() // if a prior image was defined, remove it now

                    imageUrl.value = text
                    emitImageChange()
                    imageSrc.value = text
                    try {
                        const response = await fetch(text);
                        if (!response.ok) throw new Error('Network response was not ok.');
                        const blob = await response.blob();
                        imagesStore.resizeImage(blob, imageWidth.value, imageHeight.value, async (resizedBlob) => {
                            const newImageId = await imagesStore.saveImage(resizedBlob);
                            console.log('Image stored in IndexedDB with ID:', newImageId);
                            resetImage() // if a prior image was defined, remove it now
                            imageId.value = newImageId
                            emitImageChange()
                            displayImageFromDB(newImageId)
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
        imagesStore.resizeImage(file, imageWidth.value, imageHeight.value, async (resizedBlob) => {
            // Now you have a resized image as a Blob, you can store it in IndexedDB
            // Assuming this function stores the Blob in IndexedDB

            const newImageId = await imagesStore.saveImage(resizedBlob);
            resetImage() // if a prior image was defined, remove it now
            imageId.value = newImageId;
            emitImageChange()
            console.log('Image stored in IndexedDB with ID:', newImageId);
            displayImageFromDB(newImageId)
        });
        imagesStore.extractEXIFData(file).then(({ dateTimeOriginal, gpsInfo }) => {
            console.log('Timestamp:', dateTimeOriginal);
            console.log('GPS Info:', gpsInfo);
            // Process the EXIF data as needed
            emitGPSData( { dateTimeOriginal, gpsInfo })

        }).catch(error => {
            console.error('Error extracting EXIF data:', error);
        });

    }
}

const isValidImageUrl = (url) => {
    return url.match(/\.(jpeg|jpg|gif|png)$/i) != null;
}

defineExpose({
    handlePaste
});


</script>