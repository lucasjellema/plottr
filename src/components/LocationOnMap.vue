<template>
    <v-container>
        <v-row>
            <div id="mapid" style="height: 700px; width:600px"></div>
        </v-row>
    </v-container>
</template>

<script setup>




import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { onMounted } from 'vue';

const props = defineProps({
    geoJsonPoint: Object,
    zoomLevel:10
});


onMounted(() => {
    drawMap();
});

const drawMap = () => {
    // Initialize the map
    const map = L.map('mapid').setView([51.505, -0.09], 13); // Temporary view, will adjust based on GeoJSON

    // Add OpenStreetMap tiles
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);


    // Check if geoJsonPoint is provided and valid
    if (props.geoJsonPoint && props.geoJsonPoint.geometry.type === "Point") {
        const geoJsonLayer = L.geoJson(props.geoJsonPoint, {
            onEachFeature: function (feature, layer) {
                if (feature.properties && feature.properties.popupContent) {
                    layer.bindPopup(feature.properties.popupContent);
                }
            }
        }).addTo(map);


        // Zoom the map to the GeoJSON bounds
        map.fitBounds(geoJsonLayer.getBounds(), { maxZoom: props.zoomLevel });    }
}

</script>