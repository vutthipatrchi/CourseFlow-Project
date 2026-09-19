import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '@clerk/vue'
import { getRoleFromToken } from '@/lib/jwt'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
    { path: '/sign-in', name: 'sign-in', component: () => import('../views/sign-in.vue') },
    {
      path: '/sign-up/:pathMatch(.*)*',
      name: 'sign-up',
      component: () => import('../views/SignUpView.vue'),
    },
    { path: '/admin', redirect: { name: 'admin-courses' } },
    {
      path: '/admin/courses',
      name: 'admin-courses',
      component: () => import('../views/AdminCourseListView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/courses/new',
      name: 'admin-course-create',
      component: () => import('../views/AdminCourseCreateView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/courses/:id/edit',
      name: 'admin-course-edit',
      component: () => import('../views/AdminCourseCreateView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/assignments',
      name: 'admin-assignments',
      component: () => import('../views/AdminAssignmentsView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/assignments/create',
      name: 'admin-assignment-create',
      component: () => import('../views/AdminAssignmentCreateView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
  ],
})

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return

  const token = await getToken()
  if (!token) {
    return { name: 'sign-in', query: { redirect: to.fullPath } }
  }

  if (to.meta.requiresAdmin && getRoleFromToken(token) !== 'admin') {
    return { name: 'home' }
  }
})

export default router
