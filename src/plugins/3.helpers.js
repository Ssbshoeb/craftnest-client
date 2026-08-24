import { useCrypto } from '@/composables/useCrypto'

/**
 * Global helpers plugin
 */
export default function (app) {
  const { encryptIt, decryptIt } = useCrypto()

  // Add global properties
  app.config.globalProperties.$encryptIt = encryptIt
  app.config.globalProperties.$decryptIt = decryptIt
}
