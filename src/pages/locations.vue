<template>
  <v-responsive>
    <v-container fluid tag="section" aria-labelledby="title">
      <v-main>

        <v-row>
          <v-col cols="8" offset="2">
            <locations-table />
          </v-col>  
        </v-row>
      </v-main>
    </v-container>
  </v-responsive>
</template>


<script setup>
import LocationsTable from "@/components/locationsTable.vue";

  //
</script>
