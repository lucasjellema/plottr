

import { createRouter, createWebHistory } from 'vue-router'

import peopleTable from '@/pages/people.vue';
import locationsTable from '@/pages/locations.vue';
import storiesTable from '@/pages/stories.vue';

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes: [ {
    path: '/',
    name: 'Default',
    component: peopleTable
  },
    {
      path: '/people',
      name: 'People',
      component: peopleTable,
    },
    {
      path: '/locations',
      name: 'Locations',
      component: locationsTable,
    },
    {
      path: '/stories',
      name: 'Stories',
      component: storiesTable,
    },
  ],
})
console.log(JSON.stringify(router.getRoutes(), null, 2))
export default router
