<template>
    <v-container class="pt-10">
        <v-text-field v-model="search" label="Search" clearable></v-text-field>
        <v-data-table :headers="headers" :items="peopleData" sticky  :search="search">
            <template v-slot:item.linkedinURL="{ item }">
                <a :href="prefixHttp(item.linkedinURL)" target="_new">
                    <v-icon>mdi-linkedin</v-icon>
                </a>
            </template>
        </v-data-table>
    </v-container>
</template>
  
<script setup>

import { usePeopleDataStore } from "../store/peopleStore";
import {ref} from 'vue';
import { storeToRefs } from "pinia";
const store = usePeopleDataStore();
//const { peopleData } = storeToRefs(store);
const peopleData = store.peopleData;

const search = ref("")
const headers = [
    { title: 'First Name', value: 'firstName', sortable: true },
    { title: 'Last Name', value: 'lastName', sortable: true },
    { title: 'Linkedin Profile', value: 'linkedinURL' }
]

const prefixHttp = (url) => {
    // Ensure the URL starts with http:// or https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return `https://${url}`;
    }
    return url;
}

</script>
  
<style lang="scss" scoped></style>