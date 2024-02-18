import { defineStore } from 'pinia';

import { useLocalStorage } from "@vueuse/core"
import { v4 as uuidv4 } from 'uuid';


export const useStorieStore = defineStore('storyData', () => {
    const stories = ref(useLocalStorage('plottr-stories', []))

    const currentStory = ref(stories.value[0])

    const setCurrentStory = (story) => {
        currentStory.value = story
    }


    const addStory = (story) => {
        if (!story.id) {
            story.id = uuidv4();
        }
        stories.value.push(story);
    }

    const updateStory = (story) => {
        // find story with matching id
        const index = stories.value.findIndex(l => l.id === story.id);
        if (index !== -1) {
            stories.value[index] = story;
        }
    }
    const removeStory = (storyToRemove) => {
        const theIndex = stories.value.findIndex(l => l.id === storyToRemove.id);
        if (theIndex !== -1) {
            stories.value.splice(theIndex, 1);
        }
    }
    return {
        stories, currentStory, addStory, updateStory, removeStory, setCurrentStory
    };
});


