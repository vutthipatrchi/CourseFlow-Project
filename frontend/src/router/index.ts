import { createRouter, createWebHistory } from 'vue-router'
import { hasAdminAccess } from '../auth/access'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
    {
      path: '/admin/courses',
      name: 'admin-courses',
      component: () => import('../views/AdminCourseListView.vue'),
      meta: { requiresAdmin: true },
    },
  ],
})

router.beforeEach((to) => {
  if (to.meta.requiresAdmin && !hasAdminAccess()) {
    return { name: 'home', query: { access: 'admin-required', redirect: to.fullPath } }
  }
})

export default router
