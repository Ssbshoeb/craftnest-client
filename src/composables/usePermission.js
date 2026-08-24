import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

export function usePermission() {
  const authStore = useAuthStore()

  // Get user data from auth store
  const userData = computed(() => authStore.user)

  // Get permissions array from auth store
  const permissions = computed(() => authStore.permissions || [])

  /**
   * Check if user can perform an action (has permission)
   * @param {string} permission - Format: 'MODULE.ACTION' e.g., 'SCHOOLS.CREATE'
   * @returns {boolean}
   */
  const can = permission => {
    if (!permission) return false

    // Super Admin and Admin bypass all permission checks
    const roles = userData.value?.roles || []
    if (roles.some(role => role.name === 'SUPER ADMIN' || role.name === 'ADMIN')) {
      return true
    }

    // Check if user has the specific permission
    return permissions.value.includes(permission)
  }

  /**
   * Check if user has ANY of the given permissions
   * @param {Array<string>} permissionArray
   * @returns {boolean}
   */
  const canAny = permissionArray => {
    return permissionArray.some(permission => can(permission))
  }

  /**
   * Check if user has ALL of the given permissions
   * @param {Array<string>} permissionArray
   * @returns {boolean}
   */
  const canAll = permissionArray => {
    return permissionArray.every(permission => can(permission))
  }

  /**
   * Check if user CANNOT perform an action
   * @param {string} permission
   * @returns {boolean}
   */
  const cannot = permission => {
    return !can(permission)
  }

  return {
    can,
    canAny,
    canAll,
    cannot,
    permissions,
    userData,
  }
}
