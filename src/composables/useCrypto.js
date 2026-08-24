import CryptoJS from 'crypto-js'

/**
 * Composable for encryption and decryption
 */
export function useCrypto() {
  const secretKey = CryptoJS.enc.Utf8.parse('12345678123456781234567812345678')
  const iv = CryptoJS.enc.Utf8.parse('Ef7ix7ETPgghl3vP')

  /**
   * Encrypt a string
   * @param {string} string - The string to encrypt
   * @returns {string} - The encrypted string
   */
  const encryptIt = string => {
    const encrypted = CryptoJS.AES.encrypt(
      CryptoJS.enc.Utf8.parse(string),
      secretKey,
      {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      },
    ).toString()

    return encrypted.replace(/\+/g, '-').replace(/\//g, '_')
  }

  /**
   * Decrypt a string
   * @param {string} string - The encrypted string to decrypt
   * @returns {string} - The decrypted string
   */
  const decryptIt = string => {
    const processedString = string.replace(/-/g, '+').replace(/_/g, '/')

    return CryptoJS.AES.decrypt(processedString, secretKey, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    }).toString(CryptoJS.enc.Utf8)
  }

  return {
    encryptIt,
    decryptIt,
  }
}
