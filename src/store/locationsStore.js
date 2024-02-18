import { defineStore } from 'pinia';

import locationRecords from './locations.json';
import { useLocalStorage } from "@vueuse/core"
import { v4 as uuidv4 } from 'uuid';


export const useLocationstore = defineStore('locationData', () => {
    const locationData = locationRecords.locations.map(location => {
        if (!location.id) {
            return { ...location, id: uuidv4() }; // Adding a new property 'id' using spread operator
        }
        return location; // Return the original location if it already has an id
    })

    const locations = ref(useLocalStorage('plottr-locations', locationData))

    const updatedLocations = locations.value.map(location => {
        if (!location.id) {
            return { ...location, id: uuidv4() }; // Adding a new property 'id' using spread operator
        }
        return location; // Return the original location if it already has an id
    });

    locations.value = updatedLocations; // Update the locations array with the newly mapped data

    const addLocation = (location) => {
        if (!location.id) {
            location.id = uuidv4();
        }
        locations.value.push(location);
    }

    const updateLocation = (location) => {
        // find location with matching id
        const index = locations.value.findIndex(l => l.id === location.id);
        if (index !== -1) {
            locations.value[index] = location;
        }
    }
    const removeLocation = (locationToRemove) => {
        const theIndex = locations.value.findIndex(l => l.id === locationToRemove.id);
        if (theIndex !== -1) {
            locations.value.splice(theIndex, 1);
        }
    }
    return {
        locations, addLocation, updateLocation, removeLocation
    };
});


