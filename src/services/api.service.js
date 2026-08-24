import { useAuthStore } from '@/stores/auth'
import { $api } from '@/utils/api'

const snackbar = useToast()
class ApiService {
  static async get(url, onSuccess, onError) {
    try {
      const authStore = useAuthStore()
      const headers = {}

      if (authStore.company) {
        headers['company-id'] = authStore.company.id
      }

      const response = await $api(url, {
        headers,
      })

      if (onSuccess) onSuccess(response)
    } catch (error) {
      console.error('API Error:', error)
      snackbar.error(`API Error: ${error.message || error}`)
      if (onError) onError(error)
    }
  }

  static async post(url, data, onSuccess, onError) {
    try {
      const authStore = useAuthStore()

      const headers = {
        'Content-Type': 'application/json',
      }

      if (authStore.company) {
        headers['company-id'] = authStore.company.id
      }

      const response = await $api(url, {
        method: 'POST',
        headers,
        body: data,
      })

      if (onSuccess) onSuccess(response)
    } catch (error) {
      console.error('API Error:', error)

      const errorMessage = error?.data?.message || error.message || 'An error occurred'

      snackbar.error(errorMessage)
      if (onError) onError(error)
    }
  }

  static async upload(url, file, onSuccess, onError) {
    try {
      const authStore = useAuthStore()

      const headers = {
        'Accept': 'application/json',
      }

      if (authStore.company) {
        headers['company-id'] = authStore.company.id
      }

      // Create FormData and append file as binary
      const formData = new FormData()

      formData.append('file', file)

      const response = await $api(url, {
        method: 'POST',
        headers,
        body: formData,
      })

      if (onSuccess) onSuccess(response)
    } catch (error) {
      console.error('API Error:', error)

      const errorMessage = error?.data?.message || error.message || 'An error occurred'

      snackbar.error(errorMessage)
      if (onError) onError(error)
    }
  }

  static async postFormData(url, formData, onSuccess, onError) {
    try {
      const authStore = useAuthStore()

      const headers = {
        'Accept': 'application/json',
      }

      if (authStore.company) {
        headers['company-id'] = authStore.company.id
      }

      const response = await $api(url, {
        method: 'POST',
        headers,
        body: formData,
      })

      if (onSuccess) onSuccess(response)
    } catch (error) {
      console.error('API Error:', error)

      const errorMessage = error?.data?.message || error.message || 'An error occurred'

      snackbar.error(errorMessage)
      if (onError) onError(error)
    }
  }

  static async put(url, data, onSuccess, onError) {
    try {
      const authStore = useAuthStore()

      const headers = {
        'Content-Type': 'application/json',
      }

      if (authStore.company) {
        headers['company-id'] = authStore.company.id
      }

      const response = await $api(url, {
        method: 'PUT',
        headers,
        body: data,
      })

      if (onSuccess) onSuccess(response)
    } catch (error) {
      console.error('API Error:', error)

      const errorMessage = error?.data?.message || error.message || 'An error occurred'

      snackbar.error(errorMessage)
      if (onError) onError(error)
    }
  }

  static async patch(url, data, onSuccess, onError) {
    try {
      const authStore = useAuthStore()

      const headers = {
        'Content-Type': 'application/json',
      }

      if (authStore.company) {
        headers['company-id'] = authStore.company.id
      }

      const response = await $api(url, {
        method: 'PATCH',
        headers,
        body: data,
      })

      if (onSuccess) onSuccess(response)
    } catch (error) {
      console.error('API Error:', error)

      const errorMessage = error?.data?.message || error.message || 'An error occurred'

      snackbar.error(errorMessage)
      if (onError) onError(error)
    }
  }

  static async delete(url, onSuccess, onError) {
    try {
      const authStore = useAuthStore()

      const headers = {
        'Accept': 'application/json',
      }

      if (authStore.company) {
        headers['company-id'] = authStore.company.id
      }

      const response = await $api(url, {
        method: 'DELETE',
        headers,
      })

      if (onSuccess) onSuccess(response)
    } catch (error) {
      console.error('API Error:', error)
      snackbar.error(`API Error: ${error.message || error}`)
      if (onError) onError(error)
    }
  }

  static async download(url, filename, onSuccess, onError) {
    try {
      const authStore = useAuthStore()
      const headers = {}

      if (authStore.company) {
        headers['company-id'] = authStore.company.id
      }

      const response = await $api(url, {
        headers,
        responseType: 'blob',
      })

      // Create blob link to download
      const blob = new Blob([response])
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = downloadUrl
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)

      if (onSuccess) onSuccess(response)
    } catch (error) {
      console.error('API Error:', error)
      snackbar.error(`Download Error: ${error.message || error}`)
      if (onError) onError(error)
    }
  }

  static async uploadFile(url, file, onSuccess, onError) {
    try {
      const authStore = useAuthStore()

      const headers = {
        'Accept': 'application/json',
      }

      if (authStore.company) {
        headers['company-id'] = authStore.company.id
      }

      // Create FormData and append file
      const formData = new FormData()

      formData.append('file', file)

      const response = await $api(url, {
        method: 'POST',
        headers,
        body: formData,
      })

      if (onSuccess) onSuccess(response)

      return response
    } catch (error) {
      console.error('API Error:', error)

      const errorMessage = error?.data?.message || error.message || 'An error occurred during file upload'

      snackbar.error(errorMessage)
      if (onError) onError(error)
      throw error
    }
  }
}


export default ApiService

