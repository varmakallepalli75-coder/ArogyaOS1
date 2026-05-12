import api from './api'

// Convert VAPID public key from base64url to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

export const pushService = {
  isSupported: () => 'serviceWorker' in navigator && 'PushManager' in window,

  getPermission: () => Notification.permission,

  async subscribe() {
    if (!this.isSupported()) throw new Error('Push not supported in this browser')

    // Get VAPID public key from backend
    const keyRes = await api.get('/push/vapid-public-key')
    const publicKey = keyRes.data.publicKey

    const reg = await navigator.serviceWorker.ready
    const existing = await reg.pushManager.getSubscription()
    if (existing) await existing.unsubscribe()

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })

    const { endpoint, keys } = subscription.toJSON()
    await api.post('/push/subscribe', {
      endpoint,
      p256dh: keys.p256dh,
      auth:   keys.auth,
    })

    return subscription
  },

  async unsubscribe() {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (!sub) return

    await api.post('/push/unsubscribe', { endpoint: sub.endpoint })
    await sub.unsubscribe()
  },

  async getSubscription() {
    if (!this.isSupported()) return null
    const reg = await navigator.serviceWorker.ready
    return reg.pushManager.getSubscription()
  }
}
