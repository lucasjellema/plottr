<template>
  <v-responsive>
    <v-container fluid tag="section" aria-labelledby="title">
      <v-main>
        <h1>Fast Site Creation</h1>
        <v-row>
          <v-col cols="4" offset="0">
            <v-text-field v-model="search" label="Search" clearable></v-text-field>
            <v-data-table :headers="headers" :items="sitesData" :search="search" items-per-page="5" show-select
              :custom-sort="customSort" return-object>
              <template v-slot:item.timestamp="{ item }">
                {{ formatDate(item.timestamp) }}
              </template>
              <template v-slot:item.edit="{ item }">
                <v-btn icon @click="editItem(item)">
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
              </template>
              <template v-slot:item.remove="{ item }">
                <v-btn icon @click="removeSite(item)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-data-table>

            <h3>Upload or paste one or multiple files</h3>
            <image-editor ref="imageEditorRef" image-height=300 image-width=400 @gps-data="handleGPSData"
              :allowMultipleFiles=true :fastSiteCreator="true"></image-editor>

          </v-col>
          <v-col cols="7" offset="1">
            <div id="mapid" style="height: 700px; width:900px"></div>
            <v-btn @click="refreshMap()">Refresh Map</v-btn>

            <div style="display: none;">
              <v-card class="mx-auto" max-width="600" height="400" :image="poppedupFeature?.properties?.imageURL"
                :title="poppedupFeature?.properties?.name" theme="dark" ref="popupContentRef">

                <v-card-text>{{ formatDate(poppedupFeature?.properties?.timestamp) }}
                  {{ poppedupFeature?.properties?.city }},{{ poppedupFeature?.properties?.country }}
                </v-card-text>
              </v-card>
            </div>
          </v-col>
        </v-row>
      </v-main>
      <!-- Add/Edit Site Dialog -->
      <v-dialog v-model="showEditSitePopup" max-width="800px">
        <v-card>
          <v-card-title>
            <span class="headline">Edit Site {{ editedSite.label }}</span>
          </v-card-title>
          <v-card-text>
            <v-container>
              <v-form ref="form">
                <v-text-field v-model="editedSite.label" label="Label" required></v-text-field>
                <v-text-field v-model="editedSite.address" label="Address"></v-text-field>
                <v-text-field v-model="editedSite.city" label="City"></v-text-field>
                <v-text-field v-model="editedSite.country" label="Country"></v-text-field>
                <v-text-field v-model="editedSite.timestamp" label="Timestamp"></v-text-field>
                <v-select v-model="editedSite.resolution" label="Resolution"
                  hint="How exact or roundabout is this location to be interpreted?"
                  :items="resolutionOptions"></v-select>
                <v-text-field v-model="editedSite.geoJSONText" label="GeoJSON"></v-text-field>
                <a href="https://geojson.io" target="_new">Compose GeoJSON
                  <v-icon>mdi-map</v-icon>
                </a>
                <v-btn v-if="imageMetadata && imageMetadata.gpsInfo && imageMetadata.gpsInfo.latitude"
                  @click="createGeoJSONfromImageGPS" prepend-icon="mdi-web">Set GeoJSON from Image GPS</v-btn>

                <image-editor :image-url="editedSite.imageUrl" :image-id="editedSite.imageId" ref="imageEditorRef"
                  image-height=600 image-width=800 @image-change="handleImageChange"
                  @gps-data="handleGPSData"></image-editor>

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
  </v-responsive>
</template>


<script setup>
import ImageEditor from "@/components/imageEditor.vue"
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ref, onMounted } from 'vue';
import { useFunctionCallThrottler } from '@/composables/useFunctionCallThrottler';
const { enqueueCall: enqueueCallToReverseGeocode } = useFunctionCallThrottler(1500, reverseGeocode);


import { useImagesStore } from "@/store/imagesStore";
const imagesStore = useImagesStore()
import { useStorieStore } from "@/store/storiesStore";
const storiesStore = useStorieStore()
const currentStory = computed(() => storiesStore.currentStory)
const sitesData = computed(() => currentStory.value.sites);

const search = ref("")

const popupContentRef = ref(null)// $refs.foo.$el.innerHTML
const poppedupFeature = ref({})
const showPopup = ref(false)
const showEditSitePopup = ref(false)
const imageMetadata = ref()

const closeDialog = () => {
  showEditSitePopup.value = false;
}

const saveItem = () => {
  editedSite.value.geoJSON = JSON.parse(editedSite.value.geoJSONText)
  editedSite.value.geoJSON.features[0].properties.name = editedSite.value.label
  editedSite.value.geoJSON.features[0].properties.city = editedSite.value.city
  editedSite.value.geoJSON.features[0].properties.country = editedSite.value.country
  editedSite.value.geoJSON.features[0].properties.timestamp = editedSite.value.timestamp
  storiesStore.updateSite(editedSite.value)
  closeDialog();
}

const createGeoJSONfromImageGPS = () => {
  editedSite.value.geoJSON =
    { "type": "FeatureCollection", "features": [{ "type": "Feature", "properties": {}, "geometry": { "coordinates": [imageMetadata.value.gpsInfo.longitude, imageMetadata.value.gpsInfo.latitude], "type": "Point" } }] }
  editedSite.value.geoJSONText = JSON.stringify(editedLocation.value.geoJSON)
}
const handleImageChange = (event) => {
  console.log(JSON.stringify(event))
  editedSite.value.imageId = event.imageId
  editedSite.value.imageUrl = event.imageUrl
}


const headers = [
  { title: 'Label', value: 'label', sortable: true },
  { title: 'City', value: 'city', sortable: true },
  { title: 'Timestamp', value: 'timestamp', sortable: true },
  { title: "Edit", value: 'edit' },
  { title: "Delete", value: 'remove' },
]

function formatDate(timestamp) {
  // Define an array of month names to use in the formatted string
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const date = new Date(timestamp)
  // Extract the day, month, year, and hour from the date
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hour = date.getHours();

  // Construct and return the formatted string
  return `${day} ${month} ${year}, ${hour}h `;
}

const customSort = (items, sortBy, sortDesc) => {
  const [sortKey] = sortBy;
  const sortOrder = sortDesc[0] ? -1 : 1;

  if (sortKey === 'timestamp') {
    return items.sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return (dateA - dateB) * sortOrder;
    });
  }

  // Fallback for other sorts or implement similarly
  return items;
}

const resolutionOptions = [
  { title: 'Exact Address (high accuracy)', value: 0 },
  { title: 'City ', value: 1 },
  { title: 'Area/State/Province ', value: 2 },
  { title: 'Country', value: 3 },
  { title: 'Continent', value: 4 },
]

let editedSite = ref({
  label: '',
  address: '',
  city: '',
  country: 'nl',
  resolution: 0,
  geoJSON: {},
  geoJSONText: "",
  imageUrl: '',
  imageId: '',
  relevance: 1, // 0 is low, 1 is normal, 2 is high, 3 is low
  timestamp: new Date()
})

const editItem = (item) => {
  editedSite.value = { ...item }; // Make a copy of the item to edit
  editedSite.value.geoJSONText = JSON.stringify(editedSite.value.geoJSON)
  //    imageMetadata.value = null
  showEditSitePopup.value = true;
}

const imageEditorRef = ref(null)

const handleGPSData = (event) => {
  console.log("GPS Data for image " + JSON.stringify(event))
  if (event.gpsInfo?.longitude) {
    const newGeoJsonData =
    {
      "type": "FeatureCollection", "features": [{
        "type": "Feature", "properties": { name: "To be geo-encoded", imageId: event.imageId, timestamp: event.dateTimeOriginal }
        , "geometry": { "coordinates": [event.gpsInfo.longitude, event.gpsInfo.latitude], "type": "Point" }
      }]
    }
    createSiteFromGeoJSON(newGeoJsonData, event.imageId, event.dateTimeOriginal);
  }
}

const removeSite = (site) => {
  storiesStore.removeSite(site)
}




const props = defineProps({
  geoJsonPoint: Object,
  zoomLevel: 10
});


onMounted(() => {
  drawMap();
});
const map = ref(null)
let geoJsonLayer

const refreshMap = () => {
  map.value.remove()
  drawMap()
}
const drawMap = () => {
  // Initialize the map
  map.value = L.map('mapid').setView([51.505, -0.09], 7); // Temporary view, will adjust based on GeoJSON

  // Add OpenStreetMap tiles
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map.value);

  geoJsonLayer = L.geoJSON(null, {
    onEachFeature: async (feature, layer) => {
      const tooltip = `${feature.properties.name}`;
      layer.bindTooltip(tooltip, { permanent: true, className: 'my-custom-tooltip', direction: 'right' });

      layer.bindPopup((layer) => {
        poppedupFeature.value = layer.feature;
        console.log(layer.feature.properties.name);
        if (layer.feature.properties.imageId) {
          try {
            setImageURLonFeature(layer.feature.properties.imageId);
          }
          catch (e) { }
        }
        return popupContentRef.value.$el;
      });


      const mapContainer = map.value.getContainer();

      // Make the map container focusable
      mapContainer.setAttribute('tabindex', '0');

      if (!mapContainer.getAttribute('data-paste-listener-attached')) {
        // Attach a paste event listener to the map container
        mapContainer.addEventListener('paste', function (event) {
          // Handle the paste event
          console.log('Paste event detected!');
          event.stopPropagation();
          event.preventDefault();

          // You can access the pasted data using event.clipboardData
          // TODO handle Google Map coordinates paste - create site for those coordinates
          // TODO handle paste images - hand over to imageEditor?
          const pastedData = event.clipboardData.getData('text');
          handlePastedText(pastedData);
          console.log('Pasted content:', pastedData);

        });

        mapContainer.setAttribute('data-paste-listener-attached', 'true');
      }
      // Focus the map container to ensure it can receive paste (and other keyboard) events
      // This step might be necessary depending on how you want to handle focus in your application
      mapContainer.focus();

    }
  }).addTo(map.value);

  addSitesToLayer(geoJsonLayer, currentStory.value.sites);
}


const setImageURLonFeature = async (imageId) => {
  const url = await imagesStore.getUrlForIndexedDBImage(imageId)
  poppedupFeature.value.properties.imageURL = url
}


const addSitesToLayer = (layer, sites) => {
  console.log(`sites ${JSON.stringify(currentStory.value.sites)}`);
  const features = sites.map(site => site.geoJSON.features[0]);
  layer.addData({ type: "FeatureCollection", features: features });
  // Zoom the map to the GeoJSON bounds
  try {
    const bounds = geoJsonLayer.getBounds();
    if (bounds)
      map.value.fitBounds(bounds);
    // if (layer.getBounds()) map.value.fitBounds(layer.getBounds());
  } catch (e) { console.warn(`map.value.fitBounds(layer.getBounds() failed`); }
}

function createSiteFromGeoJSON(newGeoJsonData, imageId, dateTimeOriginal) {
  const site = {
    label: "To be geo-encoded",
    imageId: imageId,
    timestamp: dateTimeOriginal,
    geoJSON: newGeoJsonData,
    resolution: 0
  };
  storiesStore.addSite(site);
  console.warn(`request reverse geo call`);

  enqueueCallToReverseGeocode(newGeoJsonData.features[0], site);
  geoJsonLayer.addData(newGeoJsonData);
  const bounds = geoJsonLayer.getBounds();
  map.value.fitBounds(bounds);
}

// Function to perform reverse geocoding
function reverseGeocode(geoJsonFeature, site) {
  //, "geometry": { "coordinates": [event.gpsInfo.longitude, event.gpsInfo.latitude], "type": "Point" }
  console.warn(`go reverse geocode`)
  const longitude = geoJsonFeature.geometry.coordinates[0];
  const latitude = geoJsonFeature.geometry.coordinates[1];
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      console.log('Location details:', data);
      // Here you can extract and use the country, state, city, etc.
      console.log(`Country: ${data.tourism}, ${data.name} ${data.address.country}, State: ${data.address.state}, City: ${data.address.village || data.address.city || data.address.town}`);
      geoJsonFeature.properties.name = data.tourism || data.name || data.address.city || data.address.town
      geoJsonFeature.properties.city = data.village || data.address.city || data.address.town
      geoJsonFeature.properties.country = data.address.country
      site.label = data.tourism || data.name || data.address.city || data.address.town
      site.country = data.address.country
      site.city = data.village || data.address.city || data.address.town
      console.log(`sites ${JSON.stringify(currentStory.value.sites)}`)
    })
    .catch(error => console.error('Error:', error));
}


function isValidCoordinateFormat(str) {
  // Regular expression for matching coordinates with at least one decimal digit
  const regex = /^-?\d+\.\d+, -?\d+\.\d+$/;
  return regex.test(str);
}
const handlePastedText = (text) => {
  if (isValidCoordinateFormat(text)) {
    console.log(`looks like coordinates`)
    const coordinates = text.split(',');
    const longitude = parseFloat(coordinates[1]);
    const latitude = parseFloat(coordinates[0]);

    const newGeoJsonData =
    {
      "type": "FeatureCollection", "features": [{
        "type": "Feature", "properties": { name: "Pasted coordinates",  timestamp: new Date()}
        , "geometry": { "coordinates": [longitude, latitude], "type": "Point" }
      }]
    }


    createSiteFromGeoJSON(newGeoJsonData, null, new Date());
  }
}


</script>
<style>
.my-custom-tooltip {
  background-color: black;
  color: white;
  font-family: Arial, sans-serif;
  /* Other styling */
}
</style>
