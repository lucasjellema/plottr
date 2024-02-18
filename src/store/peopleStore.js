import { defineStore } from 'pinia';
import { useLocalStorage } from "@vueuse/core"
import { v4 as uuidv4 } from 'uuid';

import peopleDataRecords from './people.csv';

let people

export const usePeopleDataStore = defineStore('peopleData', () => {
    const peopleData = peopleDataRecords.map((person) => {
        // Create a new object by spreading the original item
        return {
            ...person
            , extraProperty: 'X' // placeholder
        }
    })


    const people = ref(useLocalStorage('plottr-people', peopleData))

    const updatedPeople = people.value.map(person => {
        if (!person.id) {
            return { ...person, id: uuidv4() }; // Adding a new property 'id' using spread operator
        }
        return person; // Return the original record if it already has an id
    });

    people.value = updatedPeople; // Update the people array with the newly mapped data


    const addPerson = (person) => {
        if (!person.id) {
            person.id = uuidv4();
        }
        people.value.push(person);
    }

    const updatePerson = (person) => {
        // find person with matching id
        const index = people.value.findIndex(l => l.id === person.id);
        if (index !== -1) {
            people.value[index] = person;
        }
    }
    const removePerson = (personToRemove) => {
        const theIndex = people.value.findIndex(l => l.id === personToRemove.id);
        if (theIndex !== -1) {
            people.value.splice(theIndex, 1);
        }
    }

    return {
    people, addPerson, updatePerson, removePerson
    };
});
