import { clerkPlugin } from '@clerk/vue'
import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import './assets/main.css'

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
if (!publishableKey) {
  throw new Error(
    'Missing VITE_CLERK_PUBLISHABLE_KEY. Add your key to .env.local, then restart the dev server.',
  )
}

const app = createApp(App)

app.use(createPinia())
app.use(clerkPlugin, {
  publishableKey,
  signInUrl: '/sign-in',
  signUpUrl: '/sign-up',
  afterSignOutUrl: '/',
  routerPush: (to) => router.push(to),
  routerReplace: (to) => router.replace(to),
  appearance: {
    cssLayerName: 'clerk',
  },
})
app.use(router)
app.mount('#app')
