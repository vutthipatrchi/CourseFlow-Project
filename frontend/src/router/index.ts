import { getToken } from '@clerk/vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
    { path: '/sign-in', name: 'sign-in', component: () => import('../views/sign-in.vue') },
    { path: '/sign-up', name: 'sign-up', component: () => import('../views/sign-up.vue') },
    { path: '/admin', redirect: { name: 'admin-assignments' } },
    {
      path: '/admin/assignments',
      name: 'admin-assignments',
      component: () => import('../views/AdminAssignmentsView.vue'),
      // requiresAdmin only checks "signed in" for now — there is no admin role yet,
      // so any signed-in user currently passes this guard.
      meta: { requiresAdmin: true },
    },
    {
      path: '/admin/assignments/create',
      name: 'admin-assignment-create',
      component: () => import('../views/AdminAssignmentCreateView.vue'),
      meta: { requiresAdmin: true },
    },
  ],
})

router.beforeEach(async (to) => {
  if (!to.meta.requiresAdmin) return true
  const token = await getToken()
  return token ? true : { name: 'sign-in' }
})

export default router
