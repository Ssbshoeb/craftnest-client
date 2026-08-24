import { useSettingsStore } from '@/stores/settings'
import { computed } from 'vue'

export function useMedia() {
  const settingsStore = useSettingsStore()

  // Direct access to mediaURL
  const mediaUrl = computed(() => settingsStore.mediaURL)

  // Helper function to get full media path
  const getMediaPath = path => {
    if (!path) return ''
    
    return `${settingsStore.mediaURL}${path}`
  }

  return {
    mediaUrl,
    getMediaPath,
  }
}
