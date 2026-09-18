import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
    { path: '/courses', name: 'courses', component: () => import('../views/CourseListView.vue') },
    {
      path: '/courses/:id',
      name: 'course-detail',
      component: () => import('../views/CourseDetailView.vue'),
    },
    { path: '/sign-in', name: 'sign-in', component: () => import('../views/sign-in.vue') },
    { path: '/sign-up', name: 'sign-up', component: () => import('../views/sign-up.vue') },
  ],
})

export default router
