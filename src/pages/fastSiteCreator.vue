<template>
  <v-responsive>
    <v-container fluid tag="section" aria-labelledby="title">
      <v-main>
        <h1>Fast Site Creation</h1>
        <v-row>
          <v-col cols="4" offset="0">
            <v-text-field v-model="search" label="Search" clearable></v-text-field>
            <v-data-table :headers="headers" :items="sitesData" :search="search" items-per-page="5" show-select
              return-object>

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
              :allowMultipleFiles=true></image-editor>

          </v-col>
          <v-col cols="7" offset="1">
            <div id="mapid" style="height: 700px; width:900px"></div>
            <v-card class="mx-auto" max-width="600" height="400" :image="poppedupFeature?.properties?.imageURL"
              :title="poppedupFeature?.properties?.name" theme="dark" ref="popupContentRef" >
              <v-card-text>{{ poppedupFeature?.properties?.timestamp }}</v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-main>
    </v-container>
  </v-responsive>
</template>


<script setup>
import ImageEditor from "@/components/imageEditor.vue"
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { defineComponent, ref } from 'vue';


import { useImagesStore } from "@/store/imagesStore";
const imagesStore = useImagesStore()
import { useStorieStore } from "@/store/storiesStore";
const storiesStore = useStorieStore()
const currentStory = computed(() => storiesStore.currentStory)
const sitesData = computed(() => currentStory.value.sites);

const search = ref("")
const theImageId = ref(0)
const popupContentRef = ref(null)// $refs.foo.$el.innerHTML
const poppedupFeature = ref({})
const showPopup = ref(false)

const headers = [
  { title: 'Label', value: 'label', sortable: true },
  { title: 'City', value: 'city' },
  { title: "Edit", value: 'edit' },
  { title: "Delete", value: 'remove' },
]


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
    const site = {
      label: "To be geo-encoded",
      imageId: event.imageId,
      timestamp: event.dateTimeOriginal,
      geoJSON: newGeoJsonData,
      resolution: 0
    }
    storiesStore.addSite(site)

    geoJsonLayer.addData(newGeoJsonData);
    const bounds = geoJsonLayer.getBounds();
    map.value.fitBounds(bounds);
    throttledReverseGeocodeApiCall(newGeoJsonData.features[0], site);

  }
}

const removeSite = (site) => {
  storiesStore.removeSite(site)
}


import { onMounted } from 'vue';

const props = defineProps({
  geoJsonPoint: Object,
  zoomLevel: 10
});


onMounted(() => {
  drawMap();
});
const map = ref(null)
let geoJsonLayer
const drawMap = () => {
  // Initialize the map
  map.value = L.map('mapid').setView([51.505, -0.09], 7); // Temporary view, will adjust based on GeoJSON

  // Add OpenStreetMap tiles
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map.value);

  //    geoJsonLayer = L.geoJSON().addTo(map.value);

  console.log(`sites ${JSON.stringify(currentStory.value.sites)}`)
  const features = currentStory.value.sites.map(site => site.geoJSON.features[0])





  geoJsonLayer = L.geoJSON({ type: "FeatureCollection", features: features }, {
    onEachFeature: async (feature, layer) => {
      const tooltip = `${feature.properties.name}`
      layer.bindTooltip(tooltip, { permanent: true, className: 'my-custom-tooltip', direction: 'right' });


      let popup = `<h1>Site: ${feature.properties.name}</h1>
                   ${feature.properties.timestamp}
                   
                   `

      if (feature.properties.imageId) {
        try {
          const url = await imagesStore.getUrlForIndexedDBImage(feature.properties.imageId)
          popup += `<img src=${url} />`;
        }
        catch (e) { }
      }

      //layer.bindPopup(popup);
      layer.bindPopup((layer) => {
        theImageId.value = feature.properties.imageId
        poppedupFeature.value = layer.feature
        console.log(layer.feature.properties.name)
        if (feature.properties.imageId && !poppedupFeature.value.properties.imageURL) {
          try {
            setImageURLonFeature(feature.properties.imageId)
          }
          catch (e) { }
        }

        return popupContentRef.value.$el
      })


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
          var pastedData = event.clipboardData.getData('text');
          console.log('Pasted content:', pastedData);
        });

        mapContainer.setAttribute('data-paste-listener-attached', 'true');
      }
      // Focus the map container to ensure it can receive paste (and other keyboard) events
      // This step might be necessary depending on how you want to handle focus in your application
      mapContainer.focus();

    }
  }).addTo(map.value);


  // Zoom the map to the GeoJSON bounds
  try {
  if (geoJsonLayer.getBounds()) map.value.fitBounds(geoJsonLayer.getBounds());
  } catch (e) { console.warn(`map.value.fitBounds(geoJsonLayer.getBounds() failed`)}
}

const throttledReverseGeocodeApiCall = throttle(reverseGeocode, 1000);

const setImageURLonFeature = async (imageId) =>{
   const url = await imagesStore.getUrlForIndexedDBImage(imageId)
   poppedupFeature.value.properties.imageURL = url
}

function throttle(func, limit) {
  let lastFunc;
  let lastRan;
  return function () {
    const context = this;
    const args = arguments;
    if (!lastRan) {
      func.apply(context, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(function () {
        if ((Date.now() - lastRan) >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  }
}



// Function to perform reverse geocoding
function reverseGeocode(geoJsonFeature, site) {
  //, "geometry": { "coordinates": [event.gpsInfo.longitude, event.gpsInfo.latitude], "type": "Point" }
  const longitude = geoJsonFeature.geometry.coordinates[0];
  const latitude = geoJsonFeature.geometry.coordinates[1];
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      console.log('Location details:', data);
      // Here you can extract and use the country, state, city, etc.
      console.log(`Country: ${data.tourism}, ${data.name} ${data.address.country}, State: ${data.address.state}, City: ${data.address.city || data.address.town}`);
      geoJsonFeature.properties.name = data.tourism || data.name || data.address.city || data.address.town
      geoJsonFeature.properties.city = data.address.city || data.address.town
      geoJsonFeature.properties.country = data.address.country
      site.label = data.tourism || data.name || data.address.city || data.address.town
      site.country = data.address.country
      site.city = data.address.city || data.address.town
      console.log(`sites ${JSON.stringify(currentStory.value.sites)}`)
    })
    .catch(error => console.error('Error:', error));
}


const handlePaste = async (event) => {

  if (event.clipboardData?.items) {
    const items = event.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      // Check if the item is an image
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        console.log('Pasted image:', file);
      }
      if (items[i].type.indexOf("text") !== -1) {
        const text = (event.clipboardData || window.clipboardData).getData('text');
        console.log('Pasted text:', text); // TODO check if geo coordinates, for example pasted from Google Maps
      }
    }
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
