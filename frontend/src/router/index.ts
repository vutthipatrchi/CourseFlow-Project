import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '@clerk/vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
    { path: '/sign-in', name: 'sign-in', component: () => import('../views/sign-in.vue') },
    { path: '/sign-up', name: 'sign-up', component: () => import('../views/sign-up.vue') },
    {
      path: '/admin/courses',
      name: 'admin-courses',
      component: () => import('../views/AdminCourseListView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin/courses/new',
      name: 'admin-course-create',
      component: () => import('../views/AdminCourseCreateView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin/courses/:id/edit',
      name: 'admin-course-edit',
      component: () => import('../views/AdminCourseCreateView.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach(async (to) => {
  if (to.meta.requiresAuth && !(await getToken())) {
    return { name: 'sign-in', query: { redirect: to.fullPath } }
  }
})

export default router
