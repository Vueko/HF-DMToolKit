import { STORE_KEYS } from './storeKeys'

export const VAULT_IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp'])
export const VAULT_DOC_EXT = new Set(['.pdf', '.docx'])
export const VAULT_BINARY_EXT = new Set([...VAULT_IMAGE_EXT, ...VAULT_DOC_EXT])

export function isAllowedStoreKey(key: unknown): key is string {
  return typeof key === 'string' && STORE_KEYS.has(key)
}

export function isAllowedVaultImageExtension(ext: unknown): ext is string {
  return typeof ext === 'string' && VAULT_IMAGE_EXT.has(ext.toLowerCase())
}

export function isAllowedVaultBinaryExtension(ext: unknown): ext is string {
  return typeof ext === 'string' && VAULT_BINARY_EXT.has(ext.toLowerCase())
}
