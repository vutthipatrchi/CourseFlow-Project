import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { courses, resetCourses } from '../admin/courseStore'
import AdminCourseCreateView from '../views/AdminCourseCreateView.vue'

vi.mock('@clerk/vue', () => ({
  getToken: vi.fn<() => Promise<string>>(async () => 'test-clerk-token'),
  SignOutButton: { template: '<div><slot /></div>' },
}))

beforeEach(() => {
  resetCourses()
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const payload = init?.body ? JSON.parse(String(init.body)) : undefined
      const segments = url.split('/')
      const id = Number(segments[segments.length - 1]) || 9
      const existing = courses.value.find((course) => course.id === id)
      const course = {
        ...existing,
        ...payload,
        id,
        lessons: payload?.lessonItems?.length ?? existing?.lessons ?? 0,
        createdAt: existing?.createdAt ?? '2026-09-17T12:00:00+07:00',
        updatedAt: '2026-09-17T12:00:00+07:00',
        accent: payload?.accent ?? existing?.accent ?? '#dce8fb',
      }
      return new Response(JSON.stringify(course), {
        status: init?.method === 'POST' ? 201 : 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }),
  )
})

async function mountView(path = '/admin/courses/new') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
      {
        path: '/admin/courses',
        name: 'admin-courses',
        component: { template: '<div>Courses</div>' },
      },
      { path: '/admin/courses/new', name: 'admin-course-create', component: AdminCourseCreateView },
      {
        path: '/admin/courses/:id/edit',
        name: 'admin-course-edit',
        component: AdminCourseCreateView,
      },
    ],
  })
  await router.push(path)
  await router.isReady()

  return { router, wrapper: mount(AdminCourseCreateView, { global: { plugins: [router] } }) }
}

describe('admin add course', () => {
  it('shows the course, upload, promo, and lesson controls', async () => {
    const { wrapper } = await mountView()

    expect(wrapper.get('h1').text()).toBe('Add Course')
    expect(wrapper.find('input[name="courseName"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Cover image')
    expect(wrapper.text()).toContain('Preview video')
    expect(wrapper.text()).toContain('Attach File (Optional)')
    expect(wrapper.find('input[name="attachment"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Lesson')

    await wrapper.get('input[name="hasPromo"]').setValue(true)
    expect(wrapper.find('input[name="promoCode"]').exists()).toBe(true)
  })

  it('adds a mock course and returns to the course list', async () => {
    const { router, wrapper } = await mountView()

    await wrapper.get('input[name="courseName"]').setValue('Payment Fundamentals')
    await wrapper.get('input[name="price"]').setValue(1990)
    await wrapper.get('input[name="learningTime"]').setValue(12)
    await wrapper.get('input[name="promoCode"]').setValue('WELCOME200')
    await wrapper.get('input[name="minimumPurchase"]').setValue(0)
    await wrapper.get('input[name="discountType"][value="fixed"]').setValue(true)
    await wrapper.get('input[name="discount"]:not(:disabled)').setValue(200)
    await wrapper.get('textarea[name="summary"]').setValue('A practical finance course.')
    await wrapper
      .get('textarea[name="description"]')
      .setValue('A detailed introduction to payment systems.')
    const coverImage = wrapper.get<HTMLInputElement>('input[name="coverImage"]')
    Object.defineProperty(coverImage.element, 'files', {
      configurable: true,
      value: [new File(['cover'], 'cover.png', { type: 'image/png' })],
    })
    await coverImage.trigger('change')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(courses.value[0]?.name).toBe('Payment Fundamentals')
    expect(router.currentRoute.value.name).toBe('admin-courses')
    expect(router.currentRoute.value.query.created).toBe('Payment Fundamentals')
  })

  it('shows branded required-field messages when the form is empty', async () => {
    const { wrapper } = await mountView()

    await wrapper.get('form').trigger('submit')

    const errors = wrapper.findAll('[role="alert"]')
    expect(errors).toHaveLength(9)
    expect(errors.filter((error) => error.text() === 'Please fill out this field')).toHaveLength(8)
    expect(errors.some((error) => error.text() === 'Please select discount type')).toBe(true)
    expect(wrapper.findAll('input[name="discountType"]:checked')).toHaveLength(0)
    expect(wrapper.findAll('.field.has-error')).toHaveLength(7)
    expect(wrapper.find('fieldset.has-error').exists()).toBe(true)
    expect(wrapper.find('.upload-field.has-error').exists()).toBe(true)
    expect(wrapper.get('input[name="courseName"]').attributes('required')).toBeUndefined()
  })

  it('rejects non-numeric and negative prices with the orange warning state', async () => {
    const { wrapper } = await mountView()
    const priceInput = wrapper.get('input[name="price"]')

    await priceInput.setValue('abc')
    expect(wrapper.get('.field.has-invalid-value [role="alert"]').text()).toBe(
      'Please enter numbers only',
    )

    await priceInput.setValue('-100')
    expect(wrapper.get('.field.has-invalid-value [role="alert"]').text()).toBe(
      'Please enter numbers only',
    )

    await priceInput.setValue('3599')
    expect(wrapper.find('.field.has-invalid-value').exists()).toBe(false)
  })

  it('rejects percentage discounts greater than 100', async () => {
    const { wrapper } = await mountView()

    await wrapper.get('input[name="discountType"][value="percentage"]').setValue(true)
    await wrapper.get('input[name="discount"]:not(:disabled)').setValue(101)

    expect(wrapper.get('fieldset.has-invalid-value [role="alert"]').text()).toBe(
      'Discount must not exceed 100%',
    )

    await wrapper.get('input[name="discount"]:not(:disabled)').setValue(100)
    expect(wrapper.find('fieldset.has-invalid-value').exists()).toBe(false)
  })
})

describe('admin edit course', () => {
  it('loads the existing course and saves changes from the full edit page', async () => {
    const { router, wrapper } = await mountView('/admin/courses/1/edit')

    expect(wrapper.get('h1').text()).toContain('Course')
    expect(wrapper.get('h1').text()).toContain('Service Design Essentials')
    expect((wrapper.get('input[name="courseName"]').element as HTMLInputElement).value).toBe(
      'Service Design Essentials',
    )
    expect(wrapper.get('.save-button').text()).toBe('Edit')

    await wrapper.get('input[name="courseName"]').setValue('Advanced Service Design')
    await wrapper.get('input[name="price"]').setValue(4990)
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(courses.value.find((course) => course.id === 1)?.name).toBe('Advanced Service Design')
    expect(courses.value.find((course) => course.id === 1)?.price).toBe(4990)
    expect(router.currentRoute.value.name).toBe('admin-courses')
    expect(router.currentRoute.value.query.updated).toBe('Advanced Service Design')
  })
})
