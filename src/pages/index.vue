<template>
  <v-responsive>
    <v-container fluid tag="section" aria-labelledby="title">
      <my-header />
      <v-main>
        <v-row>
          <v-col cols="4" offset="4">
            <login-form />
          </v-col>
        </v-row>
        <v-row>
          <D3Chart />

        </v-row>
        <v-row>
          <v-col cols="4" offset="4">
            <people-table />
          </v-col>  
        </v-row>
      </v-main>
    </v-container>
  </v-responsive>
</template>


<script setup>
import D3Chart from '@/components/D3Chart.vue';
import MyHeader from "@/components/MyHeader";
import LoginForm from "@/components/LoginForm.vue";
import PeopleTable from "@/components/peopleTable.vue";

  //
</script>
