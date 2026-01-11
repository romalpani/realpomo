type UpdateNotificationOptions = {
  onCheckForUpdates?: () => void
  onDownloadUpdate?: () => void
  onInstallUpdate?: () => void
}

export type UpdateNotification = {
  element: HTMLElement
  handleStatus: (status: string) => void
  show: () => void
  hide: () => void
}

export function createUpdateNotification(options: UpdateNotificationOptions = {}): UpdateNotification {
  const { onDownloadUpdate, onInstallUpdate } = options

  const container = document.createElement('div')
  container.className = 'update-notification'
  container.setAttribute('aria-live', 'polite')
  container.setAttribute('aria-hidden', 'true')

  const message = document.createElement('span')
  message.className = 'update-notification-message'
  message.textContent = 'Update available'

  const installButton = document.createElement('button')
  installButton.className = 'update-notification-button'
  installButton.type = 'button'
  installButton.textContent = 'Install'

  container.appendChild(message)
  container.appendChild(installButton)

  function show() {
    container.setAttribute('aria-hidden', 'false')
    container.classList.add('visible')
  }

  function hide() {
    container.setAttribute('aria-hidden', 'true')
    container.classList.remove('visible')
  }

  function handleStatus(status: string) {
    switch (status) {
      case 'available':
        // Auto-download in background
        onDownloadUpdate?.()
        break

      case 'downloaded':
        // Show "Update available [Install]"
        show()
        break

      default:
        // All other states are silent
        break
    }
  }

  installButton.addEventListener('click', () => {
    // Hide notification and restart to install
    hide()
    onInstallUpdate?.()
  })

  return {
    element: container,
    handleStatus,
    show,
    hide
  }
}

