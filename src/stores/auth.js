import { useApi } from '@/composables/useApi'
import ApiService from '@/services/api.service'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref('')
  const user = ref({})
  const company = ref({})
  const permissions = ref([]) // ✅ Add permissions state

  // Getters
  const authenticated = computed(() => !!token.value)

  const roleName = computed(() => {
    return user.value && user.value.roles && user.value.roles.length > 0
      ? user.value.roles[0].name
      : ''
  })

  // Actions
  function setToken(data) {
    if(data) {
      token.value = data
    }else{
      token.value = null
    }
  }

  function setUser(data) {
    user.value = data

    const userCompanies = data ? data.companies : ''

    company.value = userCompanies.length ? userCompanies[0] : {}
  }

  function setCompany(companyData) {
    company.value = companyData
  }

  function setPermissions(permissionsData) {
    permissions.value = permissionsData || []
  }

  async function logIn(credentials) {
    return new Promise(resolve => {
      ApiService.post('/login', credentials,
        async data => {
          console.log('login response', data)
          if (data) {
            await attempt(data.token)
          }
          resolve({ data, error: null })
        },
        error => {
          resolve({ data: null, error })
        },
      )
    })
  }

  async function attempt(authToken) {
    console.log('attempt', authToken)
    if (authToken) {
      setToken(authToken)
    }

    if (!token.value) return

    try {
      const { data, error } = await useApi('/me').get().json()

      console.log('me response', data.value)

      if (!error.value && data.value) {
        setUser(data.value.data)

        // ✅ Set permissions from /me API response
        setPermissions(data.value.permissions || [])

        const storedCompany = localStorage.getItem('company')
        if (storedCompany) {
          setCompany(JSON.parse(storedCompany))
        }
      } else {
        throw new Error('Failed to fetch user')
      }
    } catch (e) {
      setToken(null)
      setUser(null)
      setCompany(null)
      setPermissions([])
    }
  }

  function logOut() {
    setToken(null)
    setUser(null)
    setCompany(null)
    setPermissions([])
  }

  return {
    // State
    token,
    user,
    company,
    permissions,

    // Getters
    authenticated,
    roleName,

    // Actions
    setToken,
    setUser,
    setCompany,
    setPermissions,
    logIn,
    attempt,
    logOut,
  }
}, {
  persist: true, // Enable automatic localStorage persistence
})
