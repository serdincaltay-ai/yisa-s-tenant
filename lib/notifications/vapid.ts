/**
 * VAPID key configuration for Web Push API.
 * Keys are read from environment variables:
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY  — shared with client for subscription
 *   VAPID_PRIVATE_KEY             — server-only, used to sign push messages
 *   VAPID_SUBJECT                 — mailto: or URL identifying the sender
 */

import webPush from 'web-push'

export function getVapidKeys() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || 'mailto:info@yisa-s.com'

  if (!publicKey || !privateKey) {
    return null
  }

  return { publicKey, privateKey, subject }
}

/**
 * Configure web-push with VAPID credentials.
 * Returns null if keys are not set.
 */
export function configureWebPush() {
  const keys = getVapidKeys()
  if (!keys) return null

  webPush.setVapidDetails(keys.subject, keys.publicKey, keys.privateKey)
  return webPush
}

/**
 * Generate a new VAPID key pair (one-time utility).
 * Run with: npx tsx -e "import { generateVapidKeys } from './lib/notifications/vapid'; console.log(generateVapidKeys())"
 */
export function generateVapidKeys() {
  return webPush.generateVAPIDKeys()
}
