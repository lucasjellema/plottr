<template>
  <v-responsive>
    <v-container fluid tag="section" aria-labelledby="title">
      <v-main>
        <h1>Fast Site Creation</h1>
        <v-row>
          <v-col cols="4" offset="0">
            Current Sites
            image editor (supporting multi file upload and paste )
            <image-editor ref="imageEditorRef" image-height=300 image-width=400
              @gps-data="handleGPSData" :allowMultipleFiles=true></image-editor>

          </v-col>
          <v-col cols="7" offset="1">
            <div id="mapid" style="height: 700px; width:900px"></div>

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


import { useImagesStore } from "../store/imagesStore";
const imagesStore = useImagesStore()

import { ref } from 'vue';

const imageEditorRef = ref(null)

const handleGPSData = (event) => {
  console.log("GPS Data for image " + JSON.stringify(event))
  if (event.gpsInfo?.longitude) {
    const newGeoJsonData =
    {
      "type": "FeatureCollection", "features": [{
        "type": "Feature", "properties": { name: "To be geo-encoded", imageId: event.imageId , timestamp: event.dateTimeOriginal }
        , "geometry": { "coordinates": [event.gpsInfo.longitude, event.gpsInfo.latitude], "type": "Point" }
      }]
    }

    geoJsonLayer.addData(newGeoJsonData);
    const bounds = geoJsonLayer.getBounds();
    map.value.fitBounds(bounds);
  }
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
  geoJsonLayer = L.geoJSON(null, {
    onEachFeature: async (feature, layer) => {
      const tooltip = `${feature.properties.name}`
      layer.bindTooltip(tooltip, { permanent: true,className: 'my-custom-tooltip',  direction: 'right' });
      const url = await imagesStore.getUrlForIndexedDBImage(feature.properties.imageId)
    
      layer.bindPopup(`<h1>Site</h1>
      ${feature.properties.timestamp}
      <img src=${url} />`);

    }
  }).addTo(map.value);

    // Zoom the map to the GeoJSON bounds
    map.value.fitBounds(geoJsonLayer.getBounds());
  }





// Function to perform reverse geocoding
function reverseGeocode(point) {
  const [longitude, latitude] = point.geometry.coordinates;
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      console.log('Location details:', data);
      // Here you can extract and use the country, state, city, etc.
      alert(`Country: ${data.address.country}, State: ${data.address.state}, City: ${data.address.city || data.address.town}`);
    })
    .catch(error => console.error('Error:', error));
}

// Example usage
//reverseGeocode(geoJsonPoint);

</script>
<style>
.my-custom-tooltip {
  background-color: black;
  color: white;
  font-family: Arial, sans-serif;
  /* Other styling */
}</style>
