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
    {
      path: '/admin/courses/new',
      name: 'admin-course-create',
      component: () => import('../views/AdminCourseCreateView.vue'),
      meta: { requiresAdmin: true },
    },
    {
      path: '/admin/courses/:id/edit',
      name: 'admin-course-edit',
      component: () => import('../views/AdminCourseCreateView.vue'),
      meta: { requiresAdmin: true },
    },
  ],
})

router.beforeEach((to) => {
  if (import.meta.env.DEV) return true

  if (to.meta.requiresAdmin && !hasAdminAccess()) {
    return { name: 'home', query: { access: 'admin-required', redirect: to.fullPath } }
  }
})

export default router
