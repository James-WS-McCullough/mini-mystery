import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@fontsource/poiret-one/latin-400.css'
import '@fontsource/limelight/latin-400.css'
import '@fontsource/special-elite/latin-400.css'
import '@fontsource/homemade-apple/latin-400.css'
import '@fontsource/caveat/latin-500.css'
import '@fontsource/spectral/latin-400.css'
import '@fontsource/spectral/latin-400-italic.css'
import '@fontsource/spectral/latin-600.css'
import App from './App.vue'
import './style.css'

createApp(App).use(createPinia()).mount('#app')
