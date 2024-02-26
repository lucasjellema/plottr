<template>
    <v-container fluid>
        <v-btn color="primary" class="mb-2" @click="openDialog">Add New Location</v-btn>

        <v-text-field v-model="search" label="Search" clearable></v-text-field>
        <v-data-table :headers="headers" :items="locationData" :search="search"
            :item-value="item => `${item.label}-${item.address}`" show-select return-object>
            <template v-slot:item.showOnMap="{ item }">
                <a @click="openMapDialog(item)">
                    <v-icon>mdi-map</v-icon>
                </a>
            </template> 
            <template v-slot:item.edit="{ item }">
                <v-btn icon @click="editItem(item)">
                    <v-icon>mdi-pencil</v-icon>
                </v-btn>
            </template> 
            <template v-slot:item.remove="{ item }">
                <v-btn icon @click="removeItem(item)">
                    <v-icon>mdi-delete</v-icon>
                </v-btn>
            </template>
        </v-data-table>
        <!-- Add/Edit Location Dialog -->
        <v-dialog v-model="dialog" persistent max-width="600px">
            <v-card>
                <v-card-title>
                    <span class="headline">{{ editedIndex > 0 ? 'Edit Location' : 'Add New Location' }}</span>
                </v-card-title>
                <v-card-text>
                    <v-container>
                        <v-form ref="form" v-model="valid">
                            <v-text-field v-model="editedLocation.label" label="Label" required></v-text-field>
                            <v-text-field v-model="editedLocation.address" label="Address"></v-text-field>
                            <v-text-field v-model="editedLocation.city" label="City"></v-text-field>
                            <v-text-field v-model="editedLocation.country" label="Country"></v-text-field>
                            <v-select v-model="editedLocation.resolution" label="Resolution"
                                hint="How exact or roundabout is this location to be interpreted?"
                                :items="resolutionOptions"></v-select>
                            <v-text-field v-model="editedLocation.geoJSONText" label="GeoJSON"></v-text-field>
                            <a href="https://geojson.io" target="_new">Compose GeoJSON
                                <v-icon>mdi-map</v-icon>
                            </a>
                            <v-btn v-if="imageMetadata && imageMetadata.gpsInfo && imageMetadata.gpsInfo.latitude" @click="createGeoJSONfromImageGPS" prepend-icon="mdi-web">Set GeoJSON from Image GPS</v-btn>

                            <image-editor :image-url="editedLocation.imageUrl" :image-id="editedLocation.imageId" ref="imageEditorRef" 
                            image-height=600 image-width=800
                            @image-change="handleImageChange" @gps-data="handleGPSData"></image-editor>

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
        <v-dialog v-model="mapDialog" max-width="600px">
            <v-card>
                <v-card-title>
                    <span class="headline">Show location {{ locationLabel }} on map</span>
                </v-card-title>
                <v-card-text>
                    <location-on-map :geoJsonPoint="geoJsonPoint" :zoomLevel="zoomLevel"></location-on-map>
                </v-card-text>
            </v-card>
        </v-dialog>
    </v-container>
</template>
  
<script setup>

import { useLocationstore } from "../store/locationsStore";
import { useLocationLibrary } from '../composables/useLocationLibrary';
import ImageEditor from "./imageEditor.vue"
// Use the composable
const { mapResolutionToZoom } = useLocationLibrary();

import { ref } from 'vue';

const store = useLocationstore()
const locationData = store.locations;

const search = ref("")
const imageEditorRef = ref(null)

const geoJsonPoint = ref()
const locationLabel = ref()
const imageMetadata = ref()

const headers = [
    { title: 'Label', value: 'label', sortable: true },
    { title: 'Address', value: 'address' },
    { title: 'City', value: 'city' },
    { title: "Show on Map", value: 'showOnMap' },
    { title: "Edit", value: 'edit' },
    { title: "Delete", value: 'remove' },
]

const resolutionOptions = [
    { title: 'Exact Address (high accuracy)', value: 0 },
    { title: 'City ', value: 1 },
    { title: 'Area/State/Province ', value: 2 },
    { title: 'Country', value: 3 },
    { title: 'Continent', value: 4 },
]

const dialog = ref(false)
const valid = ref(true)
const mapDialog = ref(false)

const editedIndex = ref(-1)

let editedLocation = ref({
    label: '',
    address: '',
    city: '',
    country: 'nl',
    resolution: 0,
    geoJSON: {},
    geoJSONText: "",
    imageUrl: '',
    imageId: '' 
})

const defaultLocation = {
    label: '',
    address: '',
    city: '',
    country: 'nl',
    resolution: 0,
    geoJSON: {},
    geoJSONText: "{}"
}

const createGeoJSONfromImageGPS = () => {
    editedLocation.value.geoJSON =
    {"type":"FeatureCollection","features":[{"type":"Feature","properties":{},"geometry":{"coordinates":[imageMetadata.value.gpsInfo.longitude,imageMetadata.value.gpsInfo.latitude],"type":"Point"}}]}
    editedLocation.value.geoJSONText = JSON.stringify(editedLocation.value.geoJSON)
}
const handleImageChange = (event) => {
    console.log(JSON.stringify(event))
    editedLocation.value.imageId = event.imageId	
    editedLocation.value.imageUrl = event.imageUrl	
}

const handleGPSData = (event) => {
    console.log("GPS Data for image "+JSON.stringify(event))
    imageMetadata.value = event
}
const editItem = (item) => {
    editedIndex.value = 1
    editedLocation.value = { ...item }; // Make a copy of the item to edit
    editedLocation.value.geoJSONText = JSON.stringify(editedLocation.value.geoJSON)
    imageMetadata.value = null
    dialog.value = true;
}

const removeItem = (item) => {
    store.removeLocation(item)
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
    imageMetadata.value = null

    editedLocation.value = { ...defaultLocation };
    editedIndex.value = -1;
}

const saveItem = () => {
    editedLocation.value.geoJSON = JSON.parse(editedLocation.value.geoJSONText)
    if (editedIndex.value > -1) {
        // update existing location 
        store.updateLocation(editedLocation.value)
    } else {
        store.addLocation(editedLocation.value)
    }
    closeDialog();
}

const zoomLevel = ref(0); // Example resolution
const openMapDialog = (item) => {
    geoJsonPoint.value = item.geoJSON.features[0]
    locationLabel.value = item.label
    zoomLevel.value = mapResolutionToZoom(item.resolution);
    console.log("Zoomlevel" + zoomLevel.value);

    mapDialog.value = true;
}

const closeMapDialog = () => {
    mapDialog.value = false;
}

</script>
  
<style lang="scss" scoped></style>