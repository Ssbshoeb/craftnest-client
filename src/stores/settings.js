import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  // State
  const baseURL = ref(null)
  const mediaURL = ref('https://blr1.vultrobjects.com/space-1/')
  const rowsPerPage = ref(5)

  // Getters
  const getBaseUrl = computed(() => baseURL.value)
  const getMediaUrl = computed(() => mediaURL.value)
  const getRowsPerPage = computed(() => rowsPerPage.value)

  // Actions
  function setBaseUrl(url) {
    baseURL.value = url
  }

  function setMediaUrl(url) {
    mediaURL.value = url
  }

  function setRowsPerPage(rows) {
    rowsPerPage.value = rows
  }

  return {
    // State
    baseURL,
    mediaURL,
    rowsPerPage,

    // Getters
    getBaseUrl,
    getMediaUrl,
    getRowsPerPage,

    // Actions
    setBaseUrl,
    setMediaUrl,
    setRowsPerPage,
  }
})
