import { useRegisterSW } from 'virtual:pwa-register/react'
import UpdatePrompt from './UpdatePrompt'

/**
 * Bridges vite-plugin-pwa's update lifecycle to the UI. With the service worker
 * in `prompt` mode, a new build installs but waits; `needRefresh` flips true, we
 * show the toast, and `updateServiceWorker(true)` activates it and reloads the
 * page — so the user gets the new version without a manual hard refresh.
 */
export default function PwaUpdater() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  return (
    <UpdatePrompt
      visible={needRefresh}
      onReload={() => void updateServiceWorker(true)}
      onDismiss={() => setNeedRefresh(false)}
    />
  )
}
