<template>
  <v-app>
    <v-app-bar app>
      <v-toolbar-title>Plottr {{ currentStory ? ' - ' + currentStory.label : '' }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon="mdi-filmstrip" @click="dialog = true" title="Select Story"></v-btn>
      <v-btn text to="/people">People</v-btn>
      <v-btn text to="/locations">Locations</v-btn>
      <v-btn text to="/stories">Stories</v-btn>
    </v-app-bar>
    <v-dialog v-model="dialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="headline">Select Story</span>
        </v-card-title>
        <v-card-text>
          <v-select v-model="selectedStory" :items="storyData" item-value="id" item-text="label" label="Select Story"
            return-object></v-select>
          <!-- TODO: Add story details for selected story -->
          <v-img v-if="storyImageSrc" :src="storyImageSrc" class="mt-5"></v-img>

        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="dialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useStorieStore } from "./store/storiesStore";

import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const store = useStorieStore()
const storyData = store.stories;

import { useImagesStore } from "./store/imagesStore";
const imagesStore = useImagesStore()

const storyImageSrc = ref()

const currentStory = computed(() => store.currentStory)

watch(currentStory, async (newCurrentStory) => {
  if (newCurrentStory) {
    if (newCurrentStory.imageId) {
      const url = await imagesStore.getUrlForIndexedDBImage(newCurrentStory.imageId)
      storyImageSrc.value = url
    } else {
      storyImageSrc.value = newCurrentStory.imageUrl
    }
    router.push('/storyCover')
  }
})

const dialog = ref(false)

const selectedStory = computed({
  get: () => store.currentStory,
  set: (value) => {
    store.setCurrentStory(value)
  },
})


</script>
