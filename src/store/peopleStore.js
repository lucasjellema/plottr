import { defineStore } from 'pinia';

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
    return {
        peopleData
    };
});
