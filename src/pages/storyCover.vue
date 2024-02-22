<template>
  <v-responsive>
    <v-container fluid tag="section" aria-labelledby="title">
      <v-main>
        <v-row>
          <v-col cols="7" offset="1">
            <h1>{{ currentStory ? currentStory.title : '' }}</h1>
            <v-img v-if="storyImageSrc" :src="storyImageSrc"></v-img>
            <p>{{ currentStory ? currentStory.description : '' }}</p>
          </v-col>
          <v-col cols="3" offset="0">
            <v-card class="mx-auto" max-width="344" variant="outlined">
              <v-card-item>
                <div>
                  <div class="text-h6 mb-1">
                    Table of Contents
                  </div>
                  <div class="text-caption">
                    <v-btn prepend-icon="mdi-human-male-female"  title="Story Cast of Characters" class="mb-2">Cast of Characters</v-btn>
                    <v-btn prepend-icon="mdi-compass-outline"  title="Story Locations" class="mb-2 mr-5">Sites</v-btn>
                    <v-btn prepend-icon="mdi-more"  title="Events, Milestones, Activities" class="mb-2">Actions</v-btn>
                    <v-btn prepend-icon="mdi-clock-fast"  title="Important Moments and Periods" class="mb-2">Timestones</v-btn>
                    <v-btn prepend-icon="mdi-sort-descending"  title="Actions plotted against time" class="mb-2">Chronograms (Timelines)</v-btn>
                    <v-btn prepend-icon="mdi-book-multiple"  title="Subplots, Overarching Storlines" class="mb-2" >Related Stories</v-btn>
                  </div>
                </div>
              </v-card-item>

              <v-card-actions>

              </v-card-actions>
            </v-card> </v-col>
        </v-row>
      </v-main>
    </v-container>
  </v-responsive>
</template>


<script setup>


import { ref, computed ,onMounted} from 'vue'
import { useStorieStore } from "@/store/storiesStore";
const store = useStorieStore()


import { useImagesStore } from "@/store/imagesStore";
const imagesStore = useImagesStore()

const storyImageSrc = ref()

const currentStory = computed(() => store.currentStory)

onMounted(() => {
    setCoverImage( currentStory.value);
});

watch(currentStory, async (newCurrentStory) => {
  if (newCurrentStory) {
    setCoverImage(newCurrentStory) 
  }
})

const setCoverImage = async (story) => {
  if (story.imageId) {
      const url = await imagesStore.getUrlForIndexedDBImage(story.imageId)
      storyImageSrc.value = url
    } else {
      storyImageSrc.value = story.imageUrl
    }
  
};


//
</script>
