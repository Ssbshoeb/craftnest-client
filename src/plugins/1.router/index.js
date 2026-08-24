import { setupLayouts } from 'virtual:meta-layouts'
import { createRouter, createWebHistory } from 'vue-router/auto'
import { useAuthStore } from '@/stores/auth'
import { usePermission } from '@/composables/usePermission'
import navigation from '@/navigation/vertical'
import { additionalRoutes } from './additional-routes'

function recursiveLayouts(route) {
  if (route.children) {
    for (let i = 0; i < route.children.length; i++)
      route.children[i] = recursiveLayouts(route.children[i])

    return route
  }

  return setupLayouts([route])[0]
}

// Helper function to find required role for a route
function getRequiredRole(routeName) {
  const navItem = navigation.find(item => {
    if (item.to && typeof item.to === 'object') {
      return item.to.name === routeName
    }
    
    return false
  })

  return navItem?.requiredRole || null
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to) {
    if (to.hash)
      return { el: to.hash, behavior: 'smooth', top: 60 }

    return { top: 0 }
  },
  extendRoutes: pages => [
    ...[...pages].map(route => recursiveLayouts(route)),
    ...additionalRoutes.map(route => recursiveLayouts(route)),
  ],
})

// Flag to track if auth has been verified in this session
let isAuthVerified = false

// Navigation guard for authentication
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const isLoginPage = to.path === '/login'
  const isUnauthorizedPage = to.path === '/unauthorized'

  // Only verify token on initial page load (from === null means first navigation)
  const isInitialLoad = from === null || from.name === undefined

  // If authenticated and has token
  if (authStore.authenticated && authStore.token) {
    // Only call /me API on initial page load, not on every route change
    if (isInitialLoad && !isAuthVerified) {
      try {
        // Verify token by calling /me API
        await authStore.attempt(authStore.token)
        isAuthVerified = true

        // If verified and trying to access login page, redirect to home
        if (isLoginPage) {
          next('/')
          
          return
        }

        // Check role-based access
        const requiredRole = getRequiredRole(to.name)
        if (requiredRole && authStore.roleName !== requiredRole) {
          next('/unauthorized')
          
          return
        }

        // Check permission-based access
        const requiredPermission = to.meta.permission
        if (requiredPermission) {
          const { can } = usePermission()
          if (!can(requiredPermission)) {
            next('/unauthorized')
            
            return
          }
        }

        next()
      } catch (error) {
        // If verification fails, logout
        console.error('Auth verification failed:', error)
        authStore.logOut()
        isAuthVerified = false

        if (!isLoginPage) {
          next('/login')
        } else {
          next()
        }
      }
    } else {
      // Already verified in this session, just check route access
      if (isLoginPage) {
        next('/')
        
        return
      }

      // Check role-based access
      if (!isUnauthorizedPage) {
        const requiredRole = getRequiredRole(to.name)
        if (requiredRole && authStore.roleName !== requiredRole) {
          next('/unauthorized')
          
          return
        }

        // Check permission-based access
        const requiredPermission = to.meta.permission
        if (requiredPermission) {
          const { can } = usePermission()
          if (!can(requiredPermission)) {
            next('/unauthorized')
            
            return
          }
        }
      }

      next()
    }
  } else {
    // Not authenticated
    isAuthVerified = false
    if (isLoginPage || to.meta.public) {
      next()
    } else {
      next('/login')
    }
  }
})

export { router }
export default function (app) {
  app.use(router)
}
