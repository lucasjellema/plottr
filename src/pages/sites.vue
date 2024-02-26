<template>
  <v-responsive>
    <v-container fluid tag="section" aria-labelledby="title">
      <v-main>
        <v-btn prepend-icon="mdi-compass-outline"  title="Fast Site Creation from GPS data in Images" class="mb-2 mr-5" to="/fastSiteCreator">Fast Site Creator</v-btn>
        <v-row>
          <v-col cols="8" offset="2">
            <sites-table />
          </v-col>  
        </v-row>
      </v-main>
    </v-container>
  </v-responsive>
</template>


<script setup>
import SitesTable from "@/components/sitesTable.vue";

  //
</script>
