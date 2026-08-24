import { ofetch } from 'ofetch'
import { useAuthStore } from '../stores/auth'

export const $api = ofetch.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  async onRequest({ options }) {
    const accessToken = useAuthStore().token
    if (accessToken)
      options.headers.append('Authorization', `Bearer ${accessToken}`)
  },
})
