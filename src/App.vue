<script setup>
import ScrollToTop from '@core/components/ScrollToTop.vue'
import initCore from '@core/initCore'
import {
  initConfigStore,
  useConfigStore,
} from '@core/stores/config'
import { hexToRgb } from '@core/utils/colorConverter'
import { useTheme } from 'vuetify'
import { VSonner } from 'vuetify-sonner'
import { useAuthStore } from '@/stores/auth'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const { global } = useTheme()
const router = useRouter()
const authStore = useAuthStore()

// ℹ️ Sync current theme with initial loader theme
initCore()
initConfigStore()

const configStore = useConfigStore()

// Handle token from URL (when redirected from landing page)
onMounted(async () => {
  const urlParams = new URLSearchParams(window.location.search)
  const token = urlParams.get('token')

  if (token) {
    // Token found in URL - attempt authentication
    try {
      await authStore.attempt(token)

      // Remove token from URL to keep it clean
      const url = new URL(window.location.href)

      url.searchParams.delete('token')
      window.history.replaceState({}, document.title, url.pathname + url.hash)
    } catch (error) {
      console.error('Failed to authenticate with URL token:', error)

      // Redirect to login if authentication fails
      router.push('/login')
    }
  }
})
</script>

<template>
  <VLocaleProvider :rtl="configStore.isAppRTL">
    <!-- ℹ️ This is required to set the background color of active nav link based on currently active global theme's primary -->
    <VApp :style="`--v-global-theme-primary: ${hexToRgb(global.current.value.colors.primary)}`">
      <VSonner position="top-center" />
      <RouterView />

      <ScrollToTop />
    </VApp>
  </VLocaleProvider>
</template>
