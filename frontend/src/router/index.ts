import { getToken } from '@clerk/vue'
import { getRoleFromToken } from '@/lib/jwt'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior() {
    return { top: 0, behavior: 'smooth' }
  },
  routes: [
    { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
    { path: '/courses', name: 'courses', component: () => import('../views/CourseListView.vue') },
    {
      path: '/courses/:id',
      name: 'course-detail',
      component: () => import('../views/CourseDetailView.vue'),
    },
    { path: '/wishlist', name: 'wishlist', component: () => import('../views/WishlistView.vue') },
    { path: '/sign-in', name: 'sign-in', component: () => import('../views/sign-in.vue') },
    {
      path: '/sign-up/:pathMatch(.*)*',
      name: 'sign-up',
      component: () => import('../views/SignUpView.vue'),
    },
    { path: '/admin', redirect: { name: 'admin-courses' } },
    {
      path: '/payment',
      name: 'payment',
      component: () => import('../views/PaymentView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/my-courses',
      name: 'my-courses',
      component: () => import('../views/MyCoursesView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/payment/qr',
      name: 'payment-qr',
      meta: { requiresAuth: true },
      component: () => import('../views/PaymentQrView.vue'),
    },
    {
      path: '/payment/status',
      name: 'payment-status',
      meta: { requiresAuth: true },
      component: () => import('../views/PaymentStatusView.vue'),
    },
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
      path: '/admin/courses/:courseId/lessons/new',
      name: 'admin-lesson-create',
      component: () => import('../views/AdminLessonView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/courses/:courseId/lessons/:lessonId',
      name: 'admin-lesson-edit',
      component: () => import('../views/AdminLessonView.vue'),
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
    {
      path: '/admin/assignments/:id/edit',
      name: 'admin-assignment-edit',
      component: () => import('../views/AdminAssignmentCreateView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/promo-codes',
      name: 'admin-promo-codes',
      component: () => import('../views/AdminPromoCodeListView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/promo-codes/new',
      name: 'admin-promo-code-create',
      component: () => import('../views/AdminPromoCodeCreateView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/promo-codes/:id/edit',
      name: 'admin-promo-code-edit',
      component: () => import('../views/AdminPromoCodeCreateView.vue'),
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
