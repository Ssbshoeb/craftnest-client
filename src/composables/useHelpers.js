import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import ApiService from '@/services/api.service'

/**
 * Composable for common helper functions
 */
export function useHelpers() {
  const route = useRoute()
  const authStore = useAuthStore()

  /**
   * Save user timestamp for tracking changes
   * @param {Object|null} oldJson - The old data before changes
   * @param {Object} newJson - The new data after changes
   */
  const saveUserTimestamp = async (oldJson, newJson) => {
    try {
      const form = {
        from_path: route.path,
        from_name: route.name,
        user_id: authStore.user.id,
        old_json: oldJson ? JSON.stringify(oldJson) : null,
        new_json: JSON.stringify(newJson),
      }

      ApiService.post('/user_timestamps', form,
        data => {
          // Success - no action needed
        },
        error => {
          console.error('Error saving user timestamp:', error)
        },
      )
    } catch (error) {
      console.error('Error saving user timestamp:', error)
    }
  }

  /**
   * Check if current page is in delete/trash mode
   * @returns {boolean}
   */
  const isDeletePage = () => {
    return !!route.query.open_trash
  }

  return {
    saveUserTimestamp,
    isDeletePage,
  }
}
