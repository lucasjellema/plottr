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
          <v-col cols="7" offset="0">
            <div id="mapid" style="height: 700px; width:900px"></div>
            <v-container>
              <v-row align="center">
                <v-col cols="auto">
                  <v-btn @click="refreshMap()">Refresh Map</v-btn>
                </v-col>
                <v-col cols="auto">
                  <v-switch v-model="mapEditMode" label="Edit Mode" color="secondary" hide-details inset></v-switch>
                </v-col>
                <v-col cols="auto">
                  <!-- an input element to set the consolidation radius in km -->
                  <v-text-field v-model="consolidationRadius" label="Consolidation Radius (km)"
                    type="number"></v-text-field>
                </v-col>
              </v-row>
            </v-container>
            <!-- contents for the popup on markers -->
            <div style="display: none;">
              <v-card class="mx-auto" max-width="600" height="400" :image="poppedupFeature?.properties?.imageURL"
                :title="poppedupFeature?.properties?.name" theme="dark" ref="popupContentRef">

                <v-card-text>{{ formatDate(poppedupFeature?.properties?.timestamp) }}
                  {{ poppedupFeature?.properties?.city }},{{ poppedupFeature?.properties?.country }}
                  <v-btn icon @click="editSiteFromPopup()" v-if="mapEditMode">
                    <v-icon>mdi-pencil</v-icon>
                  </v-btn>
                </v-card-text>
              </v-card>
            </div>
            <!-- contents for the context menu on markers
            <div id="markerContextMenu"
              style="display: none; position: absolute; z-index: 1000; background-color: white; border: 1px solid #ccc; border-radius: 4px;">
              <ul style="list-style: none; margin: 0; padding: 5px;">
                <li><a href="#" id="deleteMarker">Delete</a></li>
                <li><a href="#" id="consolidateMarker">Consolidate ({{ consolidationRadius }} km)</a></li>
              </ul>
            </div> -->
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
                <!-- <v-text-field v-model="editedSite.geoJSONText" label="GeoJSON"></v-text-field>
                <a href="https://geojson.io" target="_new">Compose GeoJSON
                  <v-icon>mdi-map</v-icon>
                </a>
                <v-btn v-if="imageMetadata && imageMetadata.gpsInfo && imageMetadata.gpsInfo.latitude"
                  @click="createGeoJSONfromImageGPS" prepend-icon="mdi-web">Set GeoJSON from Image GPS</v-btn> -->

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
import domtoimage from 'dom-to-image-more';
import ImageEditor from "@/components/imageEditor.vue"
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-contextmenu';
import 'leaflet-contextmenu/dist/leaflet.contextmenu.min.css';
import { ref, onMounted } from 'vue';
import { useLocationLibrary } from '@/composables/useLocationLibrary';

const { mapZoomToResolution } = useLocationLibrary();
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
const mapEditMode = ref(false)
const consolidationRadius = ref(2)

const closeDialog = () => {
  showEditSitePopup.value = false;
}

const saveItem = () => {
  editedSite.value.geoJSON = JSON.parse(editedSite.value.geoJSONText)
  editedSite.value.geoJSON.features[0].properties.name = editedSite.value.label
  editedSite.value.geoJSON.features[0].properties.city = editedSite.value.city
  editedSite.value.geoJSON.features[0].properties.country = editedSite.value.country
  editedSite.value.geoJSON.features[0].properties.timestamp = editedSite.value.timestamp
  editedSite.value.geoJSON.features[0].properties.imageId = editedSite.value.imageId

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
const editSiteFromPopup = () => {
  const siteId = poppedupFeature.value.properties.id
  const siteToEdit = storiesStore.getSite(siteId)
  editItem(siteToEdit)
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
  geoJsonLayer.eachLayer(function (layer) {
    // Check if this layer's feature has the property 'id' equal to 87
    if (layer.feature.properties.id === site.id) {
      geoJsonLayer.removeLayer(layer);
    }
  });
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
  mapEditMode.value = false
}


const deleteMarker = marker => {
  hideMarker(marker)
  const feature = marker.feature;
  const site = storiesStore.getSite(feature.properties.id)
  removeSite(site)
}

const hideMarker = marker => {
  marker.remove()
}

function findFeaturesWithinConsolidationRadius(targetFeature, geojsonLayer) {
  // Array to store features within consolidation radius
  const consolidationRangeInMeters = 1000 * consolidationRadius.value
  let featuresWithinRadius = [];

  // Convert target feature's coordinates to a Leaflet LatLng object
  let targetLatLng = L.latLng(targetFeature.geometry.coordinates[1], targetFeature.geometry.coordinates[0]);

  // Iterate over each feature in the GeoJSON layer
  geojsonLayer.eachLayer(function (layer) {
    // do not process the target feature
    if (!(layer.feature === targetFeature)) {


      // Get the current feature's LatLng
      let featureLatLng = L.latLng(layer.feature.geometry.coordinates[1], layer.feature.geometry.coordinates[0]);

      // Calculate the distance between the target feature and the current feature
      let distance = map.value.distance(targetLatLng, featureLatLng);

      // If the distance is less than or equal to consolidation radius, add the feature to the array
      if (distance <= consolidationRangeInMeters) { // Distance in meters
        featuresWithinRadius.push(layer);
      }
    }
  });

  return featuresWithinRadius;
}

const consolidateSite = (featureLayer) => {
  // remove all sites with in the specified consolidation radius
  // in theory all are merged into this one - however: what remains of these other sites? 
  // add their pictures in additional attachments for the site?
  let targetFeature = featureLayer.feature; // Assuming this is your target feature
  let nearbyFeatures = findFeaturesWithinConsolidationRadius(targetFeature, geoJsonLayer);

  // Remove all nearby sites
  // TODO: retain something from the original site in the consolidation center ??
  nearbyFeatures.forEach(function (feature) {
    deleteMarker(feature)
  });
}

const consolidateAllSites = () => {
  // loop over all markers/sites and consolidate each  
  // note: after a consolidation, sites may have been removed from the layer
  geoJsonLayer.eachLayer(function (marker) {
    consolidateSite(marker);
  });

}

const centerMap = (e) => {
  map.value.panTo(e.latlng);
}

const geoJSONToClipboard = () => {
  const geoJSON = geoJsonLayer.toGeoJSON()
  //every feature should have a property called tooltip that contains the city and country and the formatted timestamp
  geoJSON.features.forEach(feature => feature.properties.tooltip = `${feature.properties.city}, ${feature.properties.country} (${formatDate(feature.properties.timestamp)})`)

  // TODO set icon (based on site type), scale (derive from relevance!), color (per day/category),    
  // https://academy.datawrapper.de/article/177-how-to-style-your-markers-before-importing-them-to-datawrapper
  navigator.clipboard.writeText(JSON.stringify(geoJSON));
}

const mapImageToClipboard = async () => {
  const mapElement = document.querySelector("#mapid")
  const { width, height } = mapElement.getBoundingClientRect();
  const blob = await domtoimage.toBlob(mapElement, { width, height })
  const item = new ClipboardItem({ "image/png": blob });
  navigator.clipboard.write([item]).then(() => {
    console.log("Image copied to clipboard");
  }).catch(err => {
    console.error("Error copying image to clipboard", err);
    // Fallback method: display the image for manual copying or saving
    const imgURL = URL.createObjectURL(blob);
    window.open(imgURL, '_blank').focus();
  });
}

watch(mapEditMode, async (newMapEditMode) => {
  if (newMapEditMode) {
    map.value.doubleClickZoom.disable();
    geoJsonLayer.eachLayer(function (marker) {
      marker.dragging.enable();
      marker.on('dragend', function (e) {
        var newLatLng = marker.getLatLng();
        // Update the GeoJSON feature with the new coordinates
        const geoJsonFeature = marker.feature
        geoJsonFeature.geometry.coordinates = [newLatLng.lng, newLatLng.lat];
        // now update site as well

        const site = storiesStore.getSite(marker.feature.properties.id)
        site.geoJSON = geoJsonFeature
        site.geoJSONText = JSON.stringify(geoJsonFeature)
        storiesStore.updateSite(site)
        console.log(newLatLng); // New coordinates
        enqueueCallToReverseGeocode(geoJsonFeature, site);
      });
    });

  } else {
    map.value.doubleClickZoom.enable();
    geoJsonLayer.eachLayer(function (marker) {
      marker.dragging.disable();
    });
  }
})

const drawMap = () => {
  // Initialize the map
  map.value = L.map('mapid', {
    contextmenu: true,
    contextmenuWidth: 140,
    contextmenuItems: [{
      text: 'Center map here',
      callback: centerMap
    }, {
      text: 'Copy GeoJSON to Clipboard',
      callback: geoJSONToClipboard
    }, {
      text: 'Copy Map as Image to Clipboard',
      callback: mapImageToClipboard
    }, {
      text: 'Consolidate All Sites',
      callback: consolidateAllSites
    }]
  }).setView([51.505, -0.09], 7); // Temporary view, will adjust based on GeoJSON

  // Add OpenStreetMap tiles
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map.value);

  attachMapListeners()

  geoJsonLayer = L.geoJSON(null, {
    draggable: true,
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
      layer.bindContextMenu({
        contextmenu: true,
        contextmenuItems: [{
          text: 'Delete Site',
          callback: (e) => {
            var featureLayer = e.relatedTarget;
            deleteMarker(featureLayer);
          }
        }, {
          text: 'Hide Site',
          callback: (e) => {
            var featureLayer = e.relatedTarget;
            hideMarker(featureLayer);
          }
        }, {
          text: 'Consolidate Site',
          callback: (e) => {
            var featureLayer = e.relatedTarget;
            consolidateSite(featureLayer);
          }
        }]
      });




    }
  }).addTo(map.value);

  addSitesToLayer(geoJsonLayer, currentStory.value.sites);
}


const attachMapListeners = () => {
  const mapContainer = map.value.getContainer();
  // Make the map container focusable
  mapContainer.setAttribute('tabindex', '0');

  if (!mapContainer.getAttribute('data-paste-listener-attached')) {
    mapContainer.addEventListener('paste', function (event) {
      // Handle the paste event
      console.log('Paste event detected!');
      event.stopPropagation();
      event.preventDefault();

      // You can access the pasted data using event.clipboardData
      const items = event.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        // Check if the item is an image
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          imageEditorRef.value.handleNewImage(file)
        }
        if (items[i].type.indexOf("text") !== -1) {
          const text = (event.clipboardData || window.clipboardData).getData('text');
          handlePastedText(text);
        }
      }
    });
    mapContainer.setAttribute('data-paste-listener-attached', 'true');
  }


  if (!mapContainer.getAttribute('dblclick-listener-attached')) {
    mapContainer.addEventListener('dblclick', function (e) {
      if (mapEditMode.value) {
        const latlng = map.value.mouseEventToLatLng(e)
        const { lat, lng } = latlng;
        // Create a GeoJSON Point feature for the click location
        const geoJsonPointFeature =
        {
          "type": "FeatureCollection", "features": [
            {
              "type": "Feature", "properties": { name: "Pasted coordinates", timestamp: new Date() }
              , "geometry": { "coordinates": [lng, lat], "type": "Point" }
            }
          ]
        }
          ;
        console.log(`double click at location ${JSON.stringify(geoJsonPointFeature)}`)
        createSiteFromGeoJSON(geoJsonPointFeature, null, new Date());
      }
    })

  }
  mapContainer.setAttribute('dblclick-listener-attached', 'true');

  // Focus the map container to ensure it can receive paste (and other keyboard) events
  // This step might be necessary depending on how you want to handle focus in your application
  mapContainer.focus();

}

const setImageURLonFeature = async (imageId) => {
  const url = await imagesStore.getUrlForIndexedDBImage(imageId)
  poppedupFeature.value.properties.imageURL = url
}


const addSitesToLayer = (layer, sites) => {

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
    resolution: mapZoomToResolution(map.value.getZoom())
  };
  console.log(site.resolution)
  storiesStore.addSite(site);
  console.warn(`request reverse geo call`);

  enqueueCallToReverseGeocode(newGeoJsonData.features[0], site);
  geoJsonLayer.addData(newGeoJsonData);
  if (!mapEditMode.value) {
    const bounds = geoJsonLayer.getBounds();
    map.value.fitBounds(bounds);
  }
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
      geoJsonFeature.properties.city = data.address.village || data.address.city || data.address.town
      geoJsonFeature.properties.country = data.address.country
      site.label = data.tourism || data.name || data.address.city || data.address.town
      site.country = data.address.country
      site.city = data.address.village || data.address.city || data.address.town
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
        "type": "Feature", "properties": { name: "Pasted coordinates", timestamp: new Date() }
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
