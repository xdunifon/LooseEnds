import '@/assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import App from '@/App.vue'
import Noir from '@/config/prime-preset'

const app = createApp(App)

app.use(createPinia())
app.use(PrimeVue, {
  theme: {
    preset: Noir,
  },
})

app.mount('#app')
