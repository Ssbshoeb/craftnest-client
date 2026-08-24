import navigationItems from '@/navigation/vertical'
import { useAuthStore } from '@/stores/auth'
import { computed } from 'vue'
import { usePermission } from './usePermission'

const authStore = useAuthStore()

export function useNavigation() {
  const { can } = usePermission()

  /**
   * Filter navigation items based on user permissions
   * Recursively filters navigation tree
   */
  const filterNavItems = items => {
    return items
      .map(item => {
        // Recursively filter children first
        if (item.children && item.children.length > 0) {
          const filteredChildren = filterNavItems(item.children)

          // If parent has visible children, show parent regardless of its own permission
          if (filteredChildren.length > 0) {
            return { ...item, children: filteredChildren }
          }

          // If parent has no visible children, exclude it
          return null
        }

        // For items without children, check permission
        // If no permission required, show item
        if (item.requiredRole && authStore.roleName === item.requiredRole) {
          console.log('has ROle', item.title, item.requiredRole)
          
          return item
        }
        if (!item.permission && !item.requiredRole) {
          console.log('no permission', item.title, item)
          
          return item
        }

        // Check if user has required permission
        return can(item.permission) ? item : null
      })
      .filter(item => item !== null)
  }

  const filteredNavigation = computed(() => {
    return filterNavItems(navigationItems)
  })

  return {
    filteredNavigation,
    filterNavItems, // Expose for custom filtering
  }
}
