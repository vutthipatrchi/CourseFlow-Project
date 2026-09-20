import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import HomeView from '../views/HomeView.vue'

vi.mock('@clerk/vue', async () => {
  const { defineComponent, h } = await vi.importActual<typeof import('vue')>('vue')

  return {
    Show: defineComponent({
      props: { when: { type: String, required: true } },
      setup(props, { slots }) {
        return () => (props.when === 'signed-out' ? slots.default?.() : null)
      },
    }),
    SignInButton: defineComponent({
      setup(_, { slots }) {
        return () => h('a', { href: '/sign-in' }, slots.default?.())
      },
    }),
    UserButton: defineComponent({
      setup() {
        return () => h('div', { 'data-testid': 'user-button' })
      },
    }),
  }
})

describe('home page', () => {
  it('renders the CourseFlow landing content', () => {
    const wrapper = mount(HomeView)

    expect(wrapper.get('h1').text()).toContain('Best Virtual Classroom Software')
    expect(wrapper.text()).toContain('Our Professional Instructors')
    expect(wrapper.text()).toContain('Our Graduates')
  })

  it('links signed-out users to Clerk authentication routes', () => {
    const wrapper = mount(HomeView)

    expect(wrapper.get('a[href="/sign-in"]').text()).toBe('Log in')
    expect(wrapper.get('a[href="/sign-up"]').text()).toBe('Register here')
    expect(wrapper.find('[data-testid="user-button"]').exists()).toBe(false)
  })
})
