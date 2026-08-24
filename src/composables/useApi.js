import useToast from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { createFetch } from '@vueuse/core'
import { destr } from 'destr'


export const useApi = createFetch({
  baseUrl: import.meta.env.VITE_API_BASE_URL,
  fetchOptions: {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  },
  options: {
    refetch: true,
    async beforeFetch({ options }) {
      const accessToken = useAuthStore().token
      if (accessToken) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${accessToken}`,
        }
      }

      const authStore = useAuthStore()
      if (authStore.company) {
        options.headers = {
          ...options.headers,
          'company-id': authStore.company.id,
        }
      }

      return { options }
    },
    afterFetch(ctx) {
      const { data, response } = ctx

      // Parse data if it's JSON
      let parsedData = null
      try {
        parsedData = destr(data)
      }
      catch (error) {
        console.error(error)
      }

      return { data: parsedData, response }
    },

    // on fetch error
    onError(ctx) {
      // if error code is 401, redirect to login page
      console.error('API error:', ctx.error)
      useToast().error('API Error '+ctx.error, 'error')
    },
    onFetchError(ctx) {
      const { response, data } = ctx

      if (response?.status === 401) {
        handleUnauthorizedResponse()
      }
      let parsedData = null
      try {
        parsedData = destr(data)
      }
      catch (error) {
        console.error('Error parsing JSON data:', error)

        console.error(error)
      }
      if (parsedData !== null)
      {
        ctx.error = parsedData
       
      }
      
      return ctx
    },
  },
  onRequest({ error }) {
    console.error('API error:', error)
    useToast().error('API Error '+error, 'error')
  },
})
