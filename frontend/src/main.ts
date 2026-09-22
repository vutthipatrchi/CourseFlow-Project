import { clerkPlugin } from '@clerk/vue'
import { createApp } from 'vue'

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

app.use(clerkPlugin, {
  publishableKey,

  signInUrl: import.meta.env.VITE_CLERK_SIGN_IN_URL || '/sign-in',
  signUpUrl: import.meta.env.VITE_CLERK_SIGN_UP_URL || '/sign-up',

  signInFallbackRedirectUrl: import.meta.env.VITE_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL,
  signUpFallbackRedirectUrl: import.meta.env.VITE_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL,

  afterSignOutUrl: '/',

  routerPush: (to) => router.push(to),
  routerReplace: (to) => router.replace(to),

  appearance: {
    cssLayerName: 'clerk',
  },
})
app.use(router)
app.mount('#app')
